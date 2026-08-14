# UrbanHeat Accra

Machine-Learning-Based Urban Heat Risk Prediction & Mitigation-Simulation Dashboard for Accra, Ghana.

Built with **FastAPI**, **scikit-learn**, **SQLite**, and a **React (Vite + Tailwind CSS + Leaflet)** frontend.

---

## 🏛️ Project Architecture & Directory Structure

```
Urban-Heat-Prediction/
├── backend/                       # FastAPI Machine Learning & REST API
│   ├── app/
│   │   ├── main.py                # REST endpoints & CORS configuration
│   │   ├── database.py            # SQLite engine & session management
│   │   ├── models.py              # Location SQL schema
│   │   ├── schemas.py             # Pydantic request/response validation
│   │   ├── ml.py                  # Scikit-learn inference & feature importance
│   │   ├── seed.py                # Database population script
│   │   ├── seed_locations.csv     # 250 curated Accra sites
│   │   └── heat_risk_model.pkl    # Trained RandomForest model
│   ├── tests/
│   │   └── test_api.py            # Pytest test suite
│   ├── train_model.py             # Model training & synthetic data generation
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example
│   └── README.md
│
├── frontend/                      # Modern React SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # API client for backend endpoints
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation & API health monitor
│   │   │   ├── Header.jsx         # Search type-ahead & risk tier filters
│   │   │   ├── KpiRow.jsx         # Live summary metrics cards
│   │   │   ├── MapView.jsx        # Interactive Leaflet map with custom heat pins
│   │   │   ├── LocationDrawer.jsx # Detail drawer (Overview & Mitigation Simulator)
│   │   │   ├── DataExplorer.jsx   # Searchable & sortable data table + CSV export
│   │   │   ├── PredictModal.jsx   # Custom ML parameter prediction sandbox
│   │   │   └── AboutModal.jsx     # Methodology & project scope
│   │   ├── App.jsx                # Layout orchestration & state management
│   │   └── index.css              # Custom styling & Tailwind design tokens
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                          # Architecture & UX design package
│   └── mockup_screens/            # Original UI wireframes & documentation
│
├── run_dev.py                     # One-command runner for both backend and frontend
└── README.md
```

---

## 🚀 Quick Start — Running Locally

### Prerequisites
- **Python 3.10+** (Tested on Python 3.11, 3.12, 3.14)
- **Node.js 18+** & **npm**

---

### Option 1: One-Command Dev Runner (Recommended)

From the project root:

```bash
# 1. Install backend dependencies (first time only)
pip install -r backend/requirements.txt

# 2. Install frontend dependencies (first time only)
cd frontend && npm install && cd ..

# 3. Start both FastAPI and React with one command:
python run_dev.py
```

This will automatically seed the database if needed, start the FastAPI API on `http://127.0.0.1:8000`, start the React dev server on `http://localhost:5173`, and open your default browser.

---

### Option 2: Running Backend & Frontend in Separate Terminals

#### Terminal 1 — Backend (FastAPI):
```bash
cd backend
pip install -r requirements.txt
python -m app.seed                 # Seed the SQLite database (one-time)
uvicorn app.main:app --reload --port 8000
```
- **API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

#### Terminal 2 — Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
- **Web App:** `http://localhost:5173`

---

## 🧪 Running Tests

To run the backend test suite:

```bash
cd backend
python -m pytest
```

To build the React frontend bundle for production:

```bash
cd frontend
npm run build
```

---

## 📡 REST API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint (`{"status": "ok"}`) |
| `GET` | `/api/locations` | List all locations with optional filtering (`min_risk`, `max_risk`, `sort_by`) |
| `GET` | `/api/locations/{id}` | Retrieve individual location details and baseline features |
| `GET` | `/api/explain/{id}` | Retrieve top driving environmental factors & feature weights |
| `POST` | `/api/simulate` | Run what-if simulation for vegetation cover increase (`delta_vegetation_pct`) |
| `POST` | `/api/predict` | Direct inference from raw features (`ndvi`, `built_up_density_pct`, etc.) |

---

## 📦 Preparing for Git Push

Before pushing to GitHub, ensure:
1. `.env` files are not committed (covered by `.gitignore`).
2. SQLite `urbanheat.db` is ignored in Git (seed script will re-generate it on any fresh clone).
3. Both `backend` tests pass and `frontend` builds cleanly.
