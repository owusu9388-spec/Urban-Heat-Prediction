"""UrbanHeat Accra API — FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes_explanation, routes_locations, routes_prediction, routes_simulation
from app.config import get_allowed_origins, settings
from app.ml.model_loader import get_model_bundle
from app.utils.errors import LocationNotFoundError
from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model once at startup (singleton), per NFR1 performance target.
    get_model_bundle()
    logger.info("Heat-risk model loaded at startup.")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Machine-learning-based Urban Heat Risk Prediction and "
        "Mitigation-Simulation API for Accra, Ghana. Outputs are relative "
        "urban heat-risk indicators for planning support, not validated "
        "absolute climate measurements."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(routes_locations.router)
app.include_router(routes_prediction.router)
app.include_router(routes_explanation.router)
app.include_router(routes_simulation.router)


@app.exception_handler(LocationNotFoundError)
def handle_location_not_found(request: Request, exc: LocationNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"error": f"Location {exc.location_id} not found"})


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    # Stack traces are logged server-side only, never exposed to the client.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "Something went wrong"})


@app.get("/health", tags=["health"], summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}
