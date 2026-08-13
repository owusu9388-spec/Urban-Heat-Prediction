"""
SQLAlchemy ORM models. One table for the MVP: locations.
Matches the schema referenced in Section 8.5 of the project document.
"""
from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    neighbourhood = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Predictor features (all satellite/derived, range-bound)
    ndvi = Column(Float, nullable=False)                     # -1 to 1, vegetation index
    built_up_density_pct = Column(Float, nullable=False)     # 0-100
    distance_to_green_space_m = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)

    # Model outputs, computed at seed time and cached for fast /locations reads
    risk_score = Column(Float, nullable=False)                # 0-100
    risk_category = Column(String, nullable=False)             # Low/Moderate/High/Severe
