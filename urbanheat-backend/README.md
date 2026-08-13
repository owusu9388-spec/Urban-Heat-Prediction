# UrbanHeat Accra — Backend

FastAPI backend for the UrbanHeat Accra heat-risk prediction tool. Implements the
stack decided in Section 8.7 of the project document: FastAPI + SQLite (via
SQLAlchemy) + scikit-learn, no auth (MVP is read-only, FR9 is "Won't").

## 1. Local setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edit FRONTEND_ORIGIN if needed

python train_model.py           # generates app/heat_risk_model.pkl + app/seed_locations.csv
python -m app.seed              # loads seed_locations.csv into urbanheat.db

uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` — interactive OpenAPI docs, doubles as your
manual test harness.

## 2. Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./urbanheat.db` |
| `FRONTEND_ORIGIN` | Exact allowed CORS origin | `http://localhost:5500` |

## 3. Regenerating data / model

- Replace the synthetic generator in `train_model.py` with your real curated
  dataset when available (see Technical Debt: "static dataset" item).
- Re-run `python train_model.py` then delete `urbanheat.db` and re-run
  `python -m app.seed` to reload from the new CSV.

## 4. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness check |
| GET | `/api/locations` | list, filter by `min_risk`/`max_risk`, `sort_by` |
| GET | `/api/locations/{id}` | single location detail |
| POST | `/api/predict` | risk score from raw features |
| GET | `/api/explain/{id}` | top contributing factors |
| POST | `/api/simulate` | before/after risk with a vegetation increase |

## 5. Tests

```bash
pytest -v
```

## 6. Deployment (Render free tier)

1. Push this folder to a GitHub repo.
2. Render → New Web Service → connect repo.
3. Build command: `pip install -r requirements.txt && python train_model.py && python -m app.seed`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars `DATABASE_URL` (leave default for SQLite demo) and
   `FRONTEND_ORIGIN` (your deployed frontend's exact URL) in the Render dashboard.

## 7. Known limitations / technical debt

See the project's Technical Debt Plan document. Summary: no auth (by design,
MVP is read-only), SQLite not Postgres, no rate limiting, feature-importance
explainability rather than SHAP, simplified linear NDVI simulation.
