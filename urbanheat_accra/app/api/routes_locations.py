"""GET /locations and GET /locations/{id}"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.location import Location
from app.schemas.location import LocationOut, LocationSummary
from app.utils.errors import LocationNotFoundError

router = APIRouter(tags=["locations"])


@router.get(
    "/locations",
    response_model=list[LocationSummary],
    summary="List all locations with risk scores (for map markers)",
)
def list_locations(db: Session = Depends(get_db)) -> list[Location]:
    return db.query(Location).order_by(Location.id).all()


@router.get(
    "/locations/{location_id}",
    response_model=LocationOut,
    summary="Get full detail for a single location",
    responses={404: {"description": "Location not found"}},
)
def get_location(location_id: int, db: Session = Depends(get_db)) -> Location:
    location = db.query(Location).filter(Location.id == location_id).first()
    if location is None:
        raise LocationNotFoundError(location_id)
    return location
