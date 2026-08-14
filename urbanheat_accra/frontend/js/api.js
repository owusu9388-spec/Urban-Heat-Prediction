/**
 * api.js — single shared API client.
 *
 * Intentional design decision: ALL fetch calls and error handling live here,
 * not scattered across map.js/app.js/charts.js. This directly avoids the
 * "frontend API-call duplication" technical debt item called out in the
 * project's technical debt register.
 */

const API_BASE_URL = window.URBANHEAT_API_BASE_URL || "http://127.0.0.1:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkErr) {
    throw new ApiError("Couldn't reach the prediction service. Retry.", 0);
  }

  let body = null;
  try {
    body = await response.json();
  } catch (_) {
    // No JSON body (unlikely for this API, but don't blow up on it).
  }

  if (!response.ok) {
    const message =
      (body && (body.error || body.detail)) || "Couldn't reach the prediction service. Retry.";
    throw new ApiError(typeof message === "string" ? message : "Request failed.", response.status);
  }

  return body;
}

const api = {
  getLocations: () => request("/locations"),
  getLocation: (id) => request(`/locations/${id}`),
  predict: (data) =>
    request("/predict", { method: "POST", body: JSON.stringify(data) }),
  explain: (id) => request(`/explain/${id}`),
  simulate: (data) =>
    request("/simulate", { method: "POST", body: JSON.stringify(data) }),
  ApiError,
};
