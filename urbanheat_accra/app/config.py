"""Application configuration, loaded from environment variables.

No secrets are hardcoded here. Copy .env.example to .env and adjust values
for local development; the hosting platform's dashboard should set these in
production.
"""

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    APP_NAME: str = "UrbanHeat Accra API"
    APP_VERSION: str = "0.1.0"

    # Comma-separated list of allowed origins; never "*" in production.
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5500")

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{ROOT_DIR / 'data' / 'urbanheat.db'}"
    )

    MODEL_PATH: Path = Path(
        os.getenv("MODEL_PATH", str(ROOT_DIR / "models" / "heat_risk_model.pkl"))
    )

    DEBUG: bool = _get_bool("DEBUG", False)


settings = Settings()


def get_allowed_origins() -> list[str]:
    """Split FRONTEND_ORIGIN on commas so multiple dev/prod origins can be
    configured without editing code."""
    return [origin.strip() for origin in settings.FRONTEND_ORIGIN.split(",") if origin.strip()]
