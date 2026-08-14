"""SQLAlchemy ORM model for the `locations` table."""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    ndvi: Mapped[float] = mapped_column(Float, nullable=False)
    land_surface_temperature: Mapped[float] = mapped_column(Float, nullable=False)
    built_up_density: Mapped[float] = mapped_column(Float, nullable=False)
    impervious_surface: Mapped[float] = mapped_column(Float, nullable=False)
    population_density: Mapped[float] = mapped_column(Float, nullable=False)
    vegetation_percentage: Mapped[float] = mapped_column(Float, nullable=False)

    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_category: Mapped[str] = mapped_column(String(20), nullable=False)
