"""POST /predict"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.location import Location
from app.schemas.prediction import (
    PredictByFeaturesRequest,
    PredictByLocationRequest,
    PredictResponse,
)
from app.services.prediction_service import predict_from_features, predict_from_location
from app.utils.errors import LocationNotFoundError

router = APIRouter(tags=["prediction"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict heat-risk score, either by location_id or raw features",
    responses={404: {"description": "Unknown location_id"}, 422: {"description": "Validation error"}},
)
def predict(
    payload: PredictByLocationRequest | PredictByFeaturesRequest,
    db: Session = Depends(get_db),
) -> PredictResponse:
    if isinstance(payload, PredictByLocationRequest):
        location = db.query(Location).filter(Location.id == payload.location_id).first()
        if location is None:
            raise LocationNotFoundError(payload.location_id)
        score, category = predict_from_location(location)
        return PredictResponse(location_id=location.id, risk_score=score, risk_category=category)

    score, category = predict_from_features(payload.model_dump())
    return PredictResponse(location_id=None, risk_score=score, risk_category=category)
