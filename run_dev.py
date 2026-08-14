"""
run_dev.py — one-command dev runner for UrbanHeat Accra.

Starts:
  1. FastAPI ML backend (uvicorn app.main:app on http://127.0.0.1:8000)
  2. React SPA frontend (Vite dev server on http://localhost:5173)

Usage:
    python run_dev.py
    python run_dev.py --api-port 8000 --frontend-port 5173
    python run_dev.py --skip-seed    # skip one-time DB seed check
    python run_dev.py --no-open      # don't auto-open browser
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def run_step(description: str, cmd: list[str], cwd: Path) -> None:
    print(f"\n--- {description} ---")
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"FAILED: {description} (exit code {result.returncode})")
        sys.exit(result.returncode)


def ensure_backend_ready(skip_seed: bool) -> None:
    if skip_seed:
        return
    # Run seed (idempotent: skips automatically if table already populated)
    run_step(
        "Checking database seed (python -m app.seed)",
        [sys.executable, "-m", "app.seed"],
        cwd=BACKEND_DIR,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run UrbanHeat Accra full-stack app locally.")
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--frontend-port", type=int, default=5173)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--skip-seed", action="store_true", help="Skip DB seed step")
    parser.add_argument("--no-open", action="store_true", help="Don't auto-open the browser")
    args = parser.parse_args()

    api_base_url = f"http://{args.host}:{args.api_port}"
    frontend_url = f"http://localhost:{args.frontend_port}"

    if not BACKEND_DIR.exists():
        print(f"ERROR: backend directory not found at {BACKEND_DIR}")
        sys.exit(1)
    if not FRONTEND_DIR.exists():
        print(f"ERROR: frontend directory not found at {FRONTEND_DIR}")
        sys.exit(1)

    # 1. Ensure DB seeded
    ensure_backend_ready(args.skip_seed)

    # 2. Launch backend
    print(f"\n--- Starting FastAPI backend on {api_base_url} ---")
    api_process = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn", "app.main:app",
            "--host", args.host, "--port", str(args.api_port), "--reload"
        ],
        cwd=BACKEND_DIR,
    )

    time.sleep(2)  # Give uvicorn a moment to bind

    # 3. Launch React frontend (npm run dev)
    print(f"--- Starting React (Vite) frontend on {frontend_url} ---")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--port", str(args.frontend_port), "--host"],
        cwd=FRONTEND_DIR,
    )

    print(
        f"\n============================================================\n"
        f"  UrbanHeat Accra is running:\n"
        f"    React App   :  {frontend_url}\n"
        f"    FastAPI API :  {api_base_url}\n"
        f"    Swagger Docs:  {api_base_url}/docs\n"
        f"    Health Check:  {api_base_url}/api/health\n\n"
        f"  Press Ctrl+C to stop both servers.\n"
        f"============================================================\n"
    )

    if not args.no_open:
        time.sleep(1.5)
        webbrowser.open(frontend_url)

    try:
        api_process.wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nShutting down servers...")
        for proc in (api_process, frontend_process):
            if proc.poll() is None:
                proc.terminate()
        for proc in (api_process, frontend_process):
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        print("Servers stopped.")


if __name__ == "__main__":
    main()
