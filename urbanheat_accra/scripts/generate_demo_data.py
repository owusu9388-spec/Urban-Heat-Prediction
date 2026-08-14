"""
generate_demo_data.py

IMPORTANT — READ THIS FIRST:
No real Accra remote-sensing dataset (satellite LST/NDVI extracts) was supplied
for this project. This script generates a CLEARLY LABELLED SYNTHETIC/DEMO
dataset so the application is runnable end-to-end for the examination.

What IS real: the 30 location names and their approximate latitude/longitude
coordinates are real Accra neighbourhoods (public knowledge, approximate
centroids).

What IS NOT real: the feature values (NDVI, land surface temperature,
built-up density, impervious surface, population density, vegetation %) are
SYNTHETICALLY GENERATED using a deterministic random seed and a simple rule
of thumb (denser/more built-up areas get lower vegetation and higher LST).
These are illustrative numbers, not real satellite measurements, and must
never be presented as validated scientific observations of Accra.

Output: data/locations.csv
"""

import csv
import random
from pathlib import Path

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "locations.csv"

# Real Accra neighbourhoods with approximate real-world coordinates.
# A rough "urbanisation" hint (0=green/low-density, 1=dense/built-up) is used
# ONLY to make the synthetic features internally consistent with each other
# (e.g. a dense commercial district shouldn't randomly get high vegetation).
ACCRA_LOCATIONS = [
    ("Osu", 5.5558, -0.1830, 0.80),
    ("Labone", 5.5619, -0.1667, 0.60),
    ("East Legon", 5.6494, -0.1519, 0.45),
    ("Airport Residential Area", 5.6052, -0.1719, 0.40),
    ("Cantonments", 5.5793, -0.1735, 0.45),
    ("Adabraka", 5.5580, -0.2080, 0.85),
    ("Jamestown", 5.5333, -0.2167, 0.90),
    ("Usshertown", 5.5390, -0.2130, 0.90),
    ("Ridge", 5.5610, -0.1980, 0.55),
    ("North Ridge", 5.5670, -0.1980, 0.50),
    ("Kaneshie", 5.5580, -0.2360, 0.85),
    ("Dansoman", 5.5390, -0.2560, 0.75),
    ("Achimota", 5.6100, -0.2260, 0.55),
    ("Abelenkpe", 5.5940, -0.2050, 0.55),
    ("Dzorwulu", 5.6010, -0.1900, 0.50),
    ("Roman Ridge", 5.5940, -0.1830, 0.50),
    ("Tesano", 5.5960, -0.2320, 0.60),
    ("Kokomlemle", 5.5680, -0.2050, 0.80),
    ("Nima", 5.5720, -0.1950, 0.90),
    ("Maamobi", 5.5810, -0.1900, 0.90),
    ("Madina", 5.6800, -0.1670, 0.70),
    ("Adenta", 5.7080, -0.1660, 0.55),
    ("Spintex", 5.6350, -0.1150, 0.55),
    ("Teshie", 5.5810, -0.1000, 0.65),
    ("Nungua", 5.5960, -0.0680, 0.60),
    ("La", 5.5620, -0.1560, 0.70),
    ("Chorkor", 5.5340, -0.2370, 0.85),
    ("Mamprobi", 5.5340, -0.2270, 0.85),
    ("Abeka", 5.5920, -0.2360, 0.80),
    ("Legon", 5.6510, -0.1870, 0.30),
]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def generate_row(name: str, lat: float, lon: float, urbanisation: float, idx: int) -> dict:
    """Generate one synthetic-but-internally-consistent feature row.

    `urbanisation` (0-1) biases the correlated features so the demo data
    behaves sensibly (dense areas run hotter / less green), which keeps the
    downstream model's learned relationships plausible for a classroom demo.
    """
    jitter = lambda scale: random.uniform(-scale, scale)

    # NDVI: -1 to 1, denser areas -> lower vegetation index
    ndvi = _clamp(0.75 - 0.65 * urbanisation + jitter(0.08), -1.0, 1.0)

    # Vegetation percentage roughly tracks NDVI
    vegetation_percentage = _clamp((ndvi + 1) / 2 * 100 * (1 - 0.15 * urbanisation) + jitter(4), 0, 100)

    # Land surface temperature (deg C): denser/less green -> hotter
    land_surface_temperature = _clamp(29.5 + 8.5 * urbanisation - 3.0 * max(ndvi, 0) + jitter(0.8), 24, 42)

    # Built-up density and impervious surface track urbanisation
    built_up_density = _clamp(0.15 + 0.75 * urbanisation + jitter(0.06), 0, 1)
    impervious_surface = _clamp(0.10 + 0.80 * urbanisation + jitter(0.06), 0, 1)

    # Population density (people/km^2) - loosely correlated with urbanisation
    population_density = round(_clamp(1500 + 14000 * urbanisation + jitter(1200), 300, 18000))

    return {
        "id": idx,
        "name": name,
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "ndvi": round(ndvi, 4),
        "land_surface_temperature": round(land_surface_temperature, 2),
        "built_up_density": round(built_up_density, 4),
        "impervious_surface": round(impervious_surface, 4),
        "population_density": population_density,
        "vegetation_percentage": round(vegetation_percentage, 2),
    }


def main() -> None:
    rows = [
        generate_row(name, lat, lon, urb, idx + 1)
        for idx, (name, lat, lon, urb) in enumerate(ACCRA_LOCATIONS)
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with open(OUTPUT_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} synthetic demo location rows to {OUTPUT_PATH}")
    print("REMINDER: feature values are synthetic/illustrative, not real satellite measurements.")


if __name__ == "__main__":
    main()
