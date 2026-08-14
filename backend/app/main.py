"""
UrbanHeat Accra — backend API.

Endpoints (all public/read-only for this MVP — see Section 8.7 Authentication:
no auth by design, FR9 admin panel is "Won't" for this scope):

    GET  /api/locations            list locations, optional filters
    GET  /api/locations/{id}       single location detail
    POST /api/predict              predict risk score from raw features
    GET  /api/explain/{id}         top contributing factors for a location
    POST /api/simulate             simulate a vegetation increase for a location

Run locally:
    uvicorn app.main:app --reload
Docs:
    http://127.0.0.1:8000/docs
"""
import logging
import os
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db, Base, engine
from app.models import Location
from app import schemas, ml

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("urbanheat")

from contextlib import asynccontextmanager
from app.seed import seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database is seeded automatically on startup (idempotent)
    seed()
    yield

app = FastAPI(
    title="UrbanHeat Accra API",
    description="Urban heat risk prediction, explanation, and vegetation-simulation API.",
    version="1.0.0",
    lifespan=lifespan,
)


# --- CORS: locked to known frontend origins (NFR6 / security controls) ---
# FRONTEND_ORIGIN may be a comma-separated list or '*' for open CORS:
_raw_origins = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,*"
)
ALLOWED_ORIGINS = ["*"] if _raw_origins.strip() == "*" else [o.strip() for o in _raw_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)



# --- Global error handler: never leak stack traces externally ---
@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"error": "Something went wrong"})


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------- Locations ----------------

@app.get("/api/locations", response_model=schemas.LocationListOut)
def list_locations(
    min_risk: Optional[float] = Query(None, ge=0, le=100),
    max_risk: Optional[float] = Query(None, ge=0, le=100),
    sort_by: Optional[str] = Query("risk_score", pattern="^(risk_score|name)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Location)
    if min_risk is not None:
        query = query.filter(Location.risk_score >= min_risk)
    if max_risk is not None:
        query = query.filter(Location.risk_score <= max_risk)

    sort_col = Location.risk_score.desc() if sort_by == "risk_score" else Location.name.asc()
    results = query.order_by(sort_col).all()
    return {"count": len(results), "results": results}


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found")
    return loc


# ---------------- Predict ----------------

@app.post("/api/predict", response_model=schemas.PredictResponse)
def predict(payload: schemas.PredictRequest):
    result = ml.predict_risk(
        ndvi=payload.ndvi,
        built_up_density_pct=payload.built_up_density_pct,
        distance_to_green_space_m=payload.distance_to_green_space_m,
        elevation_m=payload.elevation_m,
    )
    return result


# ---------------- Explain ----------------

@app.get("/api/explain/{location_id}", response_model=schemas.ExplainResponse)
def explain(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found")

    return {
        "location_id": loc.id,
        "risk_score": loc.risk_score,
        "risk_category": loc.risk_category,
        "top_factors": ml.top_factors(),
    }


# ---------------- Simulate ----------------

@app.post("/api/simulate", response_model=schemas.SimulateResponse)
def simulate(payload: schemas.SimulateRequest, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == payload.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {payload.location_id} not found")

    # Simplified linear NDVI adjustment (see Technical Debt register — illustrative,
    # not a re-derived physical model): +delta_vegetation_pct -> +delta_vegetation_pct/100 NDVI
    ndvi_before = loc.ndvi
    ndvi_after = min(1.0, ndvi_before + payload.delta_vegetation_pct / 100.0)

    before = ml.predict_risk(
        ndvi=ndvi_before,
        built_up_density_pct=loc.built_up_density_pct,
        distance_to_green_space_m=loc.distance_to_green_space_m,
        elevation_m=loc.elevation_m,
    )
    after = ml.predict_risk(
        ndvi=ndvi_after,
        built_up_density_pct=loc.built_up_density_pct,
        distance_to_green_space_m=loc.distance_to_green_space_m,
        elevation_m=loc.elevation_m,
    )

    return {
        "location_id": loc.id,
        "before_risk_score": before["risk_score"],
        "after_risk_score": after["risk_score"],
        "before_risk_category": before["risk_category"],
        "after_risk_category": after["risk_category"],
        "ndvi_before": round(ndvi_before, 3),
        "ndvi_after": round(ndvi_after, 3),
    }
