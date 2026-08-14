# UrbanHeat Accra

Machine-learning-based Urban Heat Risk Prediction and Mitigation-Simulation
Dashboard for city planners in Accra, Ghana. Built as a 48-hour individual
capstone examination project (CSCD602 Advanced Software Engineering,
MPhil/MSc, University of Ghana).

Outputs are a **relative urban heat-risk indicator** for planning support —
not a validated absolute climate measurement. See [Limitations](#known-limitations).

---

## Project Overview

A non-technical planner can:
1. View an interactive map of Accra with locations coloured by heat-risk category.
2. Select a location and see its risk score, category, and contributing factors.
3. Run a "what-if" simulation (change vegetation, see re-scored risk).
4. Compare original vs simulated risk on a chart.
5. See clear error/validation messages if something goes wrong.
6. Use the app on desktop, tablet, or mobile.

## Architecture

```
Browser
  |
  | REST/JSON
  v
FastAPI backend
  |
  +---- ML prediction service (RandomForestRegressor, loaded once at startup)
  |
  +---- SQLAlchemy ORM ---- SQLite (locations table)
  |
  +---- Pydantic validation (every POST body)
  |
  +---- Explanation service (feature importance)
  |
  +---- Simulation service (illustrative what-if adjustment)
```

Frontend is a single-page vanilla HTML/CSS/JS app (Leaflet.js for the map,
Chart.js for the factor/comparison charts) — no build tooling, no framework,
by deliberate scope decision (see Technical Debt).

## Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Python 3.11+ / FastAPI | Built-in Pydantic validation, free OpenAPI docs, fast to build 6 endpoints in a time-boxed window |
| Database | SQLite via SQLAlchemy | Zero external service, portable, real query semantics (not raw CSV parsing) |
| ML | scikit-learn RandomForestRegressor | Fast CPU inference, simplest model giving reasonable performance on tabular features |
| Frontend | Vanilla HTML/CSS/JS + Leaflet.js + Chart.js | No build toolchain needed for a one-page app; Leaflet needs no API key |

## Folder Structure

```
urbanheat_accra/
├── app/
│   ├── main.py                  FastAPI app, CORS, exception handlers, lifespan model load
│   ├── config.py                Environment-variable driven settings
│   ├── api/
│   │   ├── routes_locations.py  GET /locations, GET /locations/{id}
│   │   ├── routes_prediction.py POST /predict
│   │   ├── routes_explanation.py GET /explain/{id}
│   │   └── routes_simulation.py POST /simulate
│   ├── models/
│   │   ├── database.py          SQLAlchemy engine/session
│   │   └── location.py          Location ORM model
│   ├── schemas/                 Pydantic request/response schemas
│   ├── services/                Prediction, explanation, simulation logic
│   ├── ml/
│   │   ├── model_loader.py      Singleton model loader (loaded once, not per-request)
│   │   └── features.py          Shared risk-category boundaries
│   └── utils/                   Custom errors, logging
├── data/
│   ├── locations.csv            Seed dataset (see Data below)
│   └── processed/
│       └── locations_labelled.csv  Features + computed risk_score/category
├── models/
│   ├── heat_risk_model.pkl      Trained model bundle
│   └── training_metrics.json    Real evaluation metrics from the last training run
├── scripts/
│   ├── generate_demo_data.py    Generates the demo dataset (see Data below)
│   ├── train_model.py           Trains and evaluates the model
│   └── seed_database.py         Loads labelled data into SQLite
├── tests/                       pytest suite (14 tests)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/{api,map,charts,app}.js
├── requirements.txt
├── .env.example
└── .gitignore
```

## Data

**No real Accra satellite/remote-sensing dataset was supplied for this
project.** `scripts/generate_demo_data.py` produces a clearly-labelled
**synthetic** dataset:

- **Real:** 30 Accra neighbourhood names and their approximate real-world coordinates (Osu, Labone, East Legon, Jamestown, etc.)
- **Synthetic:** NDVI, land surface temperature, built-up density, impervious surface, population density, and vegetation percentage — generated deterministically (seed 42) using a simple rule (denser areas get lower vegetation / higher LST) so the numbers are internally consistent for demo purposes.

This is documented in the script's docstring and must never be presented as
real satellite measurements of Accra. If a real dataset becomes available,
replace `data/locations.csv` with matching columns and re-run `train_model.py`
and `seed_database.py` — no code changes required as long as column names match.

## Installation

```bash
cd urbanheat_accra
pip install -r requirements.txt --break-system-packages   # or use a virtualenv without the flag
cp .env.example .env   # adjust FRONTEND_ORIGIN etc. if needed
```

## Quick Start (recommended)

`scripts/run_dev.py` builds and runs everything in one command: it generates
the demo dataset if missing, (re-)trains the model, seeds the database,
syncs the frontend's API base URL to the port you choose, then starts both
the FastAPI backend and a static file server for the frontend — and opens
your browser.

```bash
python scripts/run_dev.py
# or choose ports / skip re-training if the model+db are already current:
python scripts/run_dev.py --api-port 8000 --frontend-port 5500
python scripts/run_dev.py --skip-setup --no-open
```

Ctrl+C stops both servers cleanly. Use this for local dev; the manual
steps below are what this script automates, useful if you want to run
pieces individually (e.g. just retraining, or just the API).

## Database Setup & Model Training

Run in order (each step's output feeds the next):

```bash
python scripts/generate_demo_data.py   # -> data/locations.csv
python scripts/train_model.py          # -> models/heat_risk_model.pkl, data/processed/locations_labelled.csv
python scripts/seed_database.py        # -> data/urbanheat.db (SQLite)
```

`train_model.py` prints real MAE/RMSE/R² from the run (not fabricated). Last
recorded run on the synthetic dataset:

| Metric | Value |
|---|---|
| MAE | 1.24 |
| RMSE | 1.65 |
| R² | 0.99 |
| Train / test rows | 22 / 8 |

**Caveat:** n=30 total rows (8 held out for test) is too small for these
numbers to be statistically robust — they're indicative of the pipeline
working correctly, not a claim of production-grade accuracy. This is a
direct consequence of using a synthetic 30-row demo dataset within the
48-hour constraint.

## Running the API

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Swagger docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health check: http://127.0.0.1:8000/health

## Running the Frontend

The frontend is static — no build step. Serve it with any static file server
and make sure `window.URBANHEAT_API_BASE_URL` in `frontend/index.html`
points at your running API:

```bash
cd frontend
python -m http.server 5500
# open http://127.0.0.1:5500
```

Make sure `FRONTEND_ORIGIN` in `.env` includes `http://127.0.0.1:5500` (or
whatever origin you serve the frontend from) so CORS allows the requests.

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/locations` | List all locations (map markers) |
| GET | `/locations/{id}` | Full detail for one location |
| POST | `/predict` | Predict risk by `location_id` or raw features |
| GET | `/explain/{id}` | Feature importance for a location's prediction |
| POST | `/simulate` | Illustrative what-if vegetation simulation |

All POST bodies are validated with Pydantic (e.g. `ndvi` must be between -1
and 1). Invalid input → `422`. Unknown `location_id` → `404`. Unexpected
server errors → `500` with a generic message (no stack traces exposed).

## Testing

```bash
python -m pytest tests/ -v
```

14 tests covering `/health`, `/locations` (list, detail, 404), `/predict`
(location-based, feature-based, invalid input, unknown location, latency),
`/simulate` (success, 404, validation), and `/explain` (ranked factors, 404).
All 14 pass as of the last run; prediction latency measured at ~16ms
(target: <1s, NFR1).

Coverage is intentionally limited to core paths given the 48-hour window —
see Technical Debt.

## Deployment

- **Backend:** deployable to Render (or similar free-tier host) as a standard
  Python/Uvicorn service. Set `FRONTEND_ORIGIN`, `DATABASE_URL`, `MODEL_PATH`
  as environment variables in the hosting dashboard — never commit `.env`.
- **Frontend:** deployable separately as a static site (Netlify, Vercel,
  GitHub Pages). Update `window.URBANHEAT_API_BASE_URL` to the deployed
  backend URL before deploying.
- **Database:** SQLite file is committed as part of the deployed backend
  service for this MVP (no concurrent-write requirements). Migration path to
  managed Postgres documented below.
- HTTPS is assumed to be provided by the hosting platform.

## Known Limitations

- Feature values are synthetic (see Data section) — outputs are illustrative, not scientifically validated.
- Training metrics are based on n=30 rows; not statistically robust.
- No authentication (by design — see Technical Debt; all endpoints are public/read-only).
- Simulation uses a simplified linear NDVI↔vegetation-percentage mapping, not a re-derived physical model.
- Explanation uses global model feature importance, not per-instance SHAP.

## Technical Debt

| Debt | Cause | Impact | Priority | Proposed Resolution |
|---|---|---|---|---|
| Synthetic dataset instead of real satellite data | No dataset supplied within 48h window | Outputs are illustrative, not real measurements | Critical (long-term) | Source real Accra LST/NDVI extracts (GEE/Sentinel Hub) and retrain |
| Feature-importance explainability instead of full SHAP | Time constraint | Less granular per-instance explanation | Acceptable temporarily | Add `shap` library post-exam |
| SQLite instead of PostgreSQL | Simplicity for MVP demo | Limits concurrent writes at scale | Scheduled for future resolution | Migrate connection string to managed Postgres when write features are added |
| No authentication on any endpoint | All routes are public/read-only by design (admin panel out of scope) | Anyone with the URL can call the API | Critical *if* write access is ever added; acceptable now | Add JWT auth (`python-jose` + `OAuth2PasswordBearer`) before any admin/write feature ships |
| Minimal automated test coverage (core paths only) | Time constraint | Some edge cases untested | Scheduled for future resolution | Expand unit/integration suite, add CI |
| No caching on repeated predictions | Time constraint | Minor unnecessary recomputation under load | Acceptable temporarily | Add in-memory or Redis cache if usage grows |
| Simplified linear NDVI adjustment for simulation | Time constraint | Simulated scores are illustrative, not physically precise | Acceptable temporarily, labelled in UI | Fit an empirical NDVI→LST relationship from literature/regression |
| No rate limiting on `/predict`/`/simulate` | Design shortcut, low expected demo traffic | A public demo URL could be hit with excessive requests | Scheduled for future resolution | Add `slowapi` per-IP token-bucket limiter before public release |
| No dedicated developer-onboarding doc beyond this README | Time constraint | N/A — this README now covers it | Resolved | — |
| Pinned dependency versions not security-audited | Expedience during time-boxed build | Unvetted versions could carry known CVEs | Scheduled for future resolution | Run `pip-audit`, review results before any real handover |
| No formal code review process | Solo 48h exam format | Some suboptimal patterns may go uncaught | Acceptable temporarily — inherent to assessment format | Adopt PR review if project continues with collaborators |

Run `pip-audit` before submission to check dependency CVEs:

```bash
pip install pip-audit --break-system-packages
pip-audit -r requirements.txt
```

## Maintenance Strategy

- **Corrective:** monitor `/health` and error logs; fix defects as reported.
- **Adaptive:** update dependency pins as scikit-learn/FastAPI/Pydantic release new versions; re-test.
- **Perfective:** expand test coverage, add caching, add rate limiting (see Technical Debt table).
- **Preventive:** run `pip-audit` regularly; keep the SQLite→Postgres migration path documented and ready.

## Future Evolution

1. Replace synthetic dataset with real satellite-derived features (GEE/Sentinel Hub ingestion).
2. Add SHAP-based per-instance explanations.
3. Migrate to PostgreSQL when write features (admin retraining panel) are introduced.
4. Add JWT authentication scoped to the admin retraining workflow only.
5. Add `slowapi` rate limiting before any non-demo public release.

## Security Notes

- CORS restricted to `FRONTEND_ORIGIN` from environment variables, never `*`.
- All SQL access goes through the SQLAlchemy ORM (parameterised queries — no string-concatenated SQL).
- No secrets committed; `.env` is gitignored, `.env.example` documents required variables.
- Server errors return a generic `{"error": "Something went wrong"}` — stack traces are logged server-side only, never sent to the client.
