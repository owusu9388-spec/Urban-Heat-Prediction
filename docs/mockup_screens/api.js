/**
 * api.js — UrbanHeat Accra shared API client
 * Import this file in every HTML screen; all backend calls live here.
 */

const API_BASE = "http://127.0.0.1:8000";

/** Generic fetch wrapper with error handling */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/health
 * Returns { status: "ok" }
 */
export async function fetchHealth() {
  return apiFetch("/api/health");
}

/**
 * GET /api/locations
 * @param {Object} filters  – optional { min_risk, max_risk, sort_by }
 * Returns { count, results: LocationOut[] }
 */
export async function fetchLocations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.min_risk != null) params.set("min_risk", filters.min_risk);
  if (filters.max_risk != null) params.set("max_risk", filters.max_risk);
  if (filters.sort_by)         params.set("sort_by", filters.sort_by);
  const qs = params.toString() ? `?${params}` : "";
  return apiFetch(`/api/locations${qs}`);
}

/**
 * GET /api/locations/{id}
 * Returns a single LocationOut
 */
export async function fetchLocation(id) {
  return apiFetch(`/api/locations/${id}`);
}

/**
 * GET /api/explain/{id}
 * Returns { location_id, risk_score, risk_category, top_factors }
 */
export async function fetchExplain(id) {
  return apiFetch(`/api/explain/${id}`);
}

/**
 * POST /api/simulate
 * @param {number} locationId
 * @param {number} deltaVegetationPct  – 0..100
 * Returns SimulateResponse
 */
export async function postSimulate(locationId, deltaVegetationPct) {
  return apiFetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location_id: locationId,
      delta_vegetation_pct: deltaVegetationPct,
    }),
  });
}

/**
 * POST /api/predict
 * @param {Object} features – { ndvi, built_up_density_pct, distance_to_green_space_m, elevation_m }
 * Returns { risk_score, risk_category }
 */
export async function postPredict(features) {
  return apiFetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });
}

/** Helper: map risk_category to Tailwind colour token */
export function riskColor(category) {
  switch ((category || "").toLowerCase()) {
    case "low":      return "#2FA96C";
    case "moderate": return "#E0A030";
    case "high":     return "#C4432B";
    case "severe":   return "#7B0000";
    default:         return "#8b7268";
  }
}

/** Helper: map risk_score (0-100) to category string (matches backend bands) */
export function scoreToCategory(score) {
  if (score < 30)   return "Low";
  if (score < 55)   return "Moderate";
  if (score < 75)   return "High";
  return "Severe";
}
