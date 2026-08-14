/**
 * map.js — Leaflet map setup and marker rendering.
 */

const RISK_COLORS = {
  Low: "#4c9a6a",
  Moderate: "#d9a441",
  High: "#d9702f",
  "Very High": "#b83232",
};

const ACCRA_CENTER = [5.6037, -0.1870];

function initMap() {
  const map = L.map("map", { zoomControl: true }).setView(ACCRA_CENTER, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  return map;
}

function riskDotClass(category) {
  return {
    Low: "low",
    Moderate: "moderate",
    High: "high",
    "Very High": "very-high",
  }[category] || "low";
}

function renderMarkers(map, locations, onSelect) {
  const markers = [];
  locations.forEach((loc) => {
    const color = RISK_COLORS[loc.risk_category] || "#999";
    const marker = L.circleMarker([loc.latitude, loc.longitude], {
      radius: 9,
      color: "#ffffff",
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.9,
    }).addTo(map);

    marker.bindTooltip(`${loc.name} — ${loc.risk_category} (${loc.risk_score})`);
    marker.on("click", () => onSelect(loc.id));
    markers.push(marker);
  });
  return markers;
}
