"""
run_dev.py — one-command dev/build script for UrbanHeat Accra.

What "build the frontend" means for this project: the frontend is
deliberately plain HTML/CSS/JS (no npm/webpack/bundler — see README's
Technology Stack rationale), so there's no compile step. What it *does*
need before you can see it working is:

  1. A trained model + seeded database (backend dependencies)
  2. The FastAPI backend running (the frontend calls it over REST)
  3. A static file server for the frontend (browsers block file:// fetch()
     calls to another origin, so index.html can't just be double-clicked)

This script does all three, in order, and cleans both processes up on Ctrl+C.

Usage:
    python scripts/run_dev.py
    python scripts/run_dev.py --api-port 8000 --frontend-port 5500
    python scripts/run_dev.py --skip-setup   # if model/db already exist and are current
    python scripts/run_dev.py --no-open      # don't auto-open the browser
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
MODEL_PATH = ROOT / "models" / "heat_risk_model.pkl"
DB_PATH = ROOT / "data" / "urbanheat.db"
FRONTEND_INDEX = FRONTEND_DIR / "index.html"


def run_step(description: str, cmd: list[str]) -> None:
    print(f"\n--- {description} ---")
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        print(f"FAILED: {description} (exit code {result.returncode})")
        sys.exit(result.returncode)


def ensure_backend_ready(skip_setup: bool) -> None:
    if skip_setup:
        print("--skip-setup: assuming model + database are already built and current.")
        return

    if not (ROOT / "data" / "locations.csv").exists():
        run_step("Generating demo dataset", [sys.executable, "scripts/generate_demo_data.py"])
    else:
        print("data/locations.csv already exists — skipping generation.")

    run_step("Training model (re-runs every time so metrics stay current)", [sys.executable, "scripts/train_model.py"])
    run_step("Seeding database", [sys.executable, "scripts/seed_database.py"])


def rewrite_frontend_api_base_url(api_base_url: str) -> None:
    """Keep frontend/index.html's URBANHEAT_API_BASE_URL in sync with the
    port this script actually starts the API on, so people don't have to
    hand-edit the file for local dev."""
    if not FRONTEND_INDEX.exists():
        print(f"WARNING: {FRONTEND_INDEX} not found, skipping API base URL sync.")
        return

    text = FRONTEND_INDEX.read_text()
    marker = "window.URBANHEAT_API_BASE_URL = "
    lines = text.splitlines()
    changed = False
    for i, line in enumerate(lines):
        if marker in line:
            indent = line[: len(line) - len(line.lstrip())]
            lines[i] = f'{indent}window.URBANHEAT_API_BASE_URL = "{api_base_url}";'
            changed = True
            break
    if changed:
        FRONTEND_INDEX.write_text("\n".join(lines) + "\n")
        print(f"Synced frontend API base URL -> {api_base_url}")
    else:
        print(f"WARNING: could not find '{marker}' in {FRONTEND_INDEX}; leaving it untouched.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build & run UrbanHeat Accra locally.")
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--frontend-port", type=int, default=5500)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--skip-setup", action="store_true", help="Skip data/train/seed steps")
    parser.add_argument("--no-open", action="store_true", help="Don't auto-open the browser")
    args = parser.parse_args()

    api_base_url = f"http://{args.host}:{args.api_port}"
    frontend_url = f"http://{args.host}:{args.frontend_port}"

    if shutil.which(sys.executable) is None:
        print("Could not resolve a Python interpreter.")
        sys.exit(1)

    ensure_backend_ready(args.skip_setup)
    rewrite_frontend_api_base_url(api_base_url)

    print(f"\n--- Starting backend API on {api_base_url} ---")
    api_process = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn", "app.main:app",
            "--host", args.host, "--port", str(args.api_port),
        ],
        cwd=ROOT,
    )

    time.sleep(2)  # give uvicorn a moment to bind before the frontend starts hitting it

    print(f"--- Starting frontend static server on {frontend_url} ---")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(args.frontend_port)],
        cwd=FRONTEND_DIR,
    )

    print(
        f"\nUrbanHeat Accra is running:\n"
        f"  Frontend:  {frontend_url}\n"
        f"  API docs:  {api_base_url}/docs\n"
        f"  API health:{api_base_url}/health\n\n"
        f"Press Ctrl+C to stop both servers."
    )

    if not args.no_open:
        time.sleep(1)
        webbrowser.open(frontend_url)

    try:
        api_process.wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nShutting down...")
        for proc in (api_process, frontend_process):
            if proc.poll() is None:
                proc.terminate()
        for proc in (api_process, frontend_process):
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        print("Stopped.")


if __name__ == "__main__":
    main()
