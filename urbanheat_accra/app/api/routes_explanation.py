"""GET /explain/{location_id}"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.location import Location
from app.schemas.prediction import ExplainResponse
from app.services.explanation_service import explain_location
from app.utils.errors import LocationNotFoundError

router = APIRouter(tags=["explanation"])


@router.get(
    "/explain/{location_id}",
    response_model=ExplainResponse,
    summary="Explain the factors contributing to a location's risk score (feature importance)",
    responses={404: {"description": "Unknown location_id"}},
)
def explain(location_id: int, db: Session = Depends(get_db)) -> ExplainResponse:
    location = db.query(Location).filter(Location.id == location_id).first()
    if location is None:
        raise LocationNotFoundError(location_id)
    return explain_location(location)
