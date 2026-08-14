"""
One-time (or re-run anytime) seed script: loads app/seed_locations.csv into
the locations table. Run:
    python -m app.seed
"""
import os
import pandas as pd
from app.database import Base, engine, SessionLocal
from app.models import Location

CSV_PATH = os.path.join(os.path.dirname(__file__), "seed_locations.csv")


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Location).count()
        if existing > 0:
            print(f"locations table already has {existing} rows — skipping seed. "
                  f"Delete urbanheat.db to reseed from scratch.")
            return

        df = pd.read_csv(CSV_PATH)
        rows = [
            Location(
                name=r["name"],
                neighbourhood=r.get("neighbourhood"),
                latitude=r["latitude"],
                longitude=r["longitude"],
                ndvi=r["ndvi"],
                built_up_density_pct=r["built_up_density_pct"],
                distance_to_green_space_m=r["distance_to_green_space_m"],
                elevation_m=r["elevation_m"],
                risk_score=r["risk_score"],
                risk_category=r["risk_category"],
            )
            for _, r in df.iterrows()
        ]
        db.bulk_save_objects(rows)
        db.commit()
        print(f"Seeded {len(rows)} locations into {engine.url}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
