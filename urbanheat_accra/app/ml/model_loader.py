"""Loads the trained heat-risk model exactly once (singleton), never per-request.

Per NFR1 (<1s prediction target), joblib.load() is expensive and must not be
called inside a request handler.
"""

from functools import lru_cache
from typing import Any

import joblib

from app.config import settings


class ModelBundle:
    def __init__(self, model: Any, feature_columns: list[str], feature_importances: dict[str, float]):
        self.model = model
        self.feature_columns = feature_columns
        self.feature_importances = feature_importances


@lru_cache(maxsize=1)
def get_model_bundle() -> ModelBundle:
    if not settings.MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {settings.MODEL_PATH}. "
            "Run `python scripts/train_model.py` first."
        )
    payload = joblib.load(settings.MODEL_PATH)
    return ModelBundle(
        model=payload["model"],
        feature_columns=payload["feature_columns"],
        feature_importances=payload["feature_importances"],
    )
