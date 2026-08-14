"""
seed_database.py

Loads the labelled locations dataset (produced by train_model.py) into
SQLite via SQLAlchemy ORM. Safe to re-run: it clears and re-inserts.

Run:
    python scripts/seed_database.py
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.database import Base, SessionLocal, engine  # noqa: E402
from app.models.location import Location  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LABELLED_CSV = ROOT / "data" / "processed" / "locations_labelled.csv"


def main() -> None:
    if not LABELLED_CSV.exists():
        raise FileNotFoundError(
            f"{LABELLED_CSV} not found. Run scripts/train_model.py first "
            "(it produces the labelled dataset from data/locations.csv)."
        )

    df = pd.read_csv(LABELLED_CSV)

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        deleted = db.query(Location).delete()
        if deleted:
            print(f"Cleared {deleted} existing rows.")

        rows = [
            Location(
                id=int(r["id"]),
                name=r["name"],
                latitude=float(r["latitude"]),
                longitude=float(r["longitude"]),
                ndvi=float(r["ndvi"]),
                land_surface_temperature=float(r["land_surface_temperature"]),
                built_up_density=float(r["built_up_density"]),
                impervious_surface=float(r["impervious_surface"]),
                population_density=float(r["population_density"]),
                vegetation_percentage=float(r["vegetation_percentage"]),
                risk_score=float(r["risk_score"]),
                risk_category=str(r["risk_category"]),
            )
            for _, r in df.iterrows()
        ]
        db.add_all(rows)
        db.commit()
        print(f"Seeded {len(rows)} locations into {engine.url}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
