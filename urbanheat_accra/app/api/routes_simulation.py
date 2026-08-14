"""POST /simulate"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.location import Location
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.services.simulation_service import simulate_vegetation_change
from app.utils.errors import LocationNotFoundError

router = APIRouter(tags=["simulation"])


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Illustrative what-if simulation: change vegetation, see re-scored risk",
    responses={404: {"description": "Unknown location_id"}, 422: {"description": "Validation error"}},
)
def simulate(payload: SimulationRequest, db: Session = Depends(get_db)) -> SimulationResponse:
    location = db.query(Location).filter(Location.id == payload.location_id).first()
    if location is None:
        raise LocationNotFoundError(payload.location_id)
    return simulate_vegetation_change(location, payload.delta_vegetation_pct)
