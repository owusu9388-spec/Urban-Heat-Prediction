/**
 * api/client.js — Unified API Client for UrbanHeat Accra
 * Communicates with the FastAPI backend at /api
 */

// In development, Vite proxies /api to http://127.0.0.1:8000
// If VITE_API_BASE_URL is specified in .env, use it; otherwise default to '' (relative for proxy) or http://127.0.0.1:8000
const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'http://127.0.0.1:8000');

/** Generic fetch helper with JSON parsing and clear error propagation */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.detail || errorData.error || `Request failed with status ${res.status}`;
      throw new Error(message);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to backend server at ${API_BASE || 'http://127.0.0.1:8000'}`);
    }
    throw err;
  }
}

/**
 * Check backend health
 * GET /api/health -> { status: "ok" }
 */
export async function checkHealth() {
  return apiFetch('/api/health');
}

/**
 * Fetch list of locations with optional filtering and sorting
 * GET /api/locations?min_risk=&max_risk=&sort_by=
 */
export async function getLocations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.min_risk !== undefined && filters.min_risk !== null && filters.min_risk !== '') {
    params.set('min_risk', filters.min_risk);
  }
  if (filters.max_risk !== undefined && filters.max_risk !== null && filters.max_risk !== '') {
    params.set('max_risk', filters.max_risk);
  }
  if (filters.sort_by) {
    params.set('sort_by', filters.sort_by);
  }
  const queryString = params.toString() ? `?${params}` : '';
  return apiFetch(`/api/locations${queryString}`);
}

/**
 * Fetch a single location detail
 * GET /api/locations/{id}
 */
export async function getLocation(id) {
  return apiFetch(`/api/locations/${id}`);
}

/**
 * Fetch feature explanation / top contributing factors for a location
 * GET /api/explain/{id}
 */
export async function getExplanation(id) {
  return apiFetch(`/api/explain/${id}`);
}

/**
 * Simulate an intervention (vegetation increase %) on a location
 * POST /api/simulate
 * body: { location_id: number, delta_vegetation_pct: number }
 */
export async function runSimulation(locationId, deltaVegetationPct) {
  return apiFetch('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({
      location_id: Number(locationId),
      delta_vegetation_pct: Number(deltaVegetationPct),
    }),
  });
}

/**
 * Run a direct ML prediction for custom environmental features
 * POST /api/predict
 * body: { ndvi, built_up_density_pct, distance_to_green_space_m, elevation_m }
 */
export async function predictRisk(features) {
  return apiFetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify({
      ndvi: Number(features.ndvi),
      built_up_density_pct: Number(features.built_up_density_pct),
      distance_to_green_space_m: Number(features.distance_to_green_space_m),
      elevation_m: Number(features.elevation_m),
    }),
  });
}

/**
 * Color mapping utility for heat risk categories
 */
export function getRiskColor(category) {
  switch ((category || '').toLowerCase()) {
    case 'low':
      return '#2FA96C';
    case 'moderate':
      return '#E0A030';
    case 'high':
      return '#C4432B';
    case 'severe':
      return '#7B0000';
    default:
      return '#8b7268';
  }
}

/**
 * Badge style utility
 */
export function getRiskBadgeClasses(category) {
  switch ((category || '').toLowerCase()) {
    case 'low':
      return 'bg-[#2FA96C]/15 text-[#1e6f47] border-[#2FA96C]/30';
    case 'moderate':
      return 'bg-[#E0A030]/15 text-[#916212] border-[#E0A030]/30';
    case 'high':
      return 'bg-[#C4432B]/15 text-[#C4432B] border-[#C4432B]/30';
    case 'severe':
      return 'bg-[#7B0000]/15 text-[#7B0000] border-[#7B0000]/30';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-300';
  }
}
