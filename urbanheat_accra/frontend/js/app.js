/**
 * app.js — application controller. Wires the map, sidebar list, detail
 * drawer, and simulation controls together via the shared api.js client.
 */

let map;
let allLocations = [];
let activeFilter = "All";
let selectedLocationId = null;

const CATEGORY_ORDER = ["Low", "Moderate", "High", "Very High"];

function riskDotClass(category) {
  return { Low: "low", Moderate: "moderate", High: "high", "Very High": "very-high" }[category] || "low";
}

function riskBadgeClass(category) {
  return riskDotClass(category);
}

async function bootstrap() {
  map = initMap();

  try {
    allLocations = await api.getLocations();
  } catch (err) {
    showListError(err);
    return;
  }

  renderMarkers(map, allLocations, selectLocation);
  renderSidebarList(allLocations);
}

function showListError(err) {
  const list = document.getElementById("location-list");
  list.innerHTML = `<div class="error-banner">${err.message}</div>`;
}

function renderSidebarList(locations) {
  const list = document.getElementById("location-list");
  list.innerHTML = "";

  const filtered =
    activeFilter === "All" ? locations : locations.filter((l) => l.risk_category === activeFilter);

  filtered
    .slice()
    .sort((a, b) => b.risk_score - a.risk_score)
    .forEach((loc) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `
        <span class="risk-dot ${riskDotClass(loc.risk_category)}"></span>
        <span class="name">${loc.name}</span>
        <span class="score">${loc.risk_score}</span>
      `;
      li.addEventListener("click", () => selectLocation(loc.id));
      list.appendChild(li);
    });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="loading-text">No locations in this category.</div>`;
  }
}

function setupFilterChips() {
  const row = document.getElementById("filter-chips");
  const categories = ["All", ...CATEGORY_ORDER];
  row.innerHTML = "";
  categories.forEach((cat) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = cat;
    chip.dataset.active = cat === activeFilter ? "true" : "false";
    chip.addEventListener("click", () => {
      activeFilter = cat;
      document
        .querySelectorAll("#filter-chips .chip")
        .forEach((c) => (c.dataset.active = c.textContent === cat ? "true" : "false"));
      renderSidebarList(allLocations);
    });
    row.appendChild(chip);
  });
}

async function selectLocation(locationId) {
  selectedLocationId = locationId;
  const drawer = document.getElementById("detail-drawer");
  drawer.classList.add("open");
  drawer.innerHTML = `<div class="loading-text">Loading location detail…</div>`;

  try {
    const [location, explanation] = await Promise.all([
      api.getLocation(locationId),
      api.explain(locationId),
    ]);
    renderDetailDrawer(location, explanation);
  } catch (err) {
    drawer.innerHTML = `
      <button class="close-btn" onclick="closeDrawer()">&times;</button>
      <div class="error-banner">${err.message}</div>
    `;
  }
}

function closeDrawer() {
  document.getElementById("detail-drawer").classList.remove("open");
  selectedLocationId = null;
}

function renderDetailDrawer(location, explanation) {
  const drawer = document.getElementById("detail-drawer");
  drawer.innerHTML = `
    <button class="close-btn" onclick="closeDrawer()">&times;</button>
    <h2 style="margin:4px 0 6px;font-size:1.05rem;">${location.name}</h2>
    <span class="risk-badge ${riskBadgeClass(location.risk_category)}">${location.risk_category}</span>
    <span style="margin-left:8px;font-size:0.85rem;color:var(--text-muted);">Score: ${location.risk_score}/100</span>

    <div class="section-title">Contributing factors</div>
    <div class="chart-wrap"><canvas id="factor-chart"></canvas></div>

    <div class="sim-controls">
      <div class="section-title" style="margin-top:0;">What-if: change vegetation</div>
      <label for="veg-slider">Vegetation change: <span id="veg-slider-value">0</span>%</label>
      <input type="range" id="veg-slider" min="-50" max="50" value="0" step="5" />
      <div style="margin-top:8px;">
        <button class="primary" id="simulate-btn">Simulate</button>
      </div>
      <div id="sim-error"></div>
      <div id="sim-result" class="sim-result"></div>
      <div class="chart-wrap" id="comparison-chart-wrap" style="display:none;">
        <canvas id="comparison-chart"></canvas>
      </div>
    </div>

    <div class="disclaimer">${explanation.disclaimer}</div>
  `;

  renderFactorChart("factor-chart", explanation.factors);

  const slider = document.getElementById("veg-slider");
  const sliderValue = document.getElementById("veg-slider-value");
  slider.addEventListener("input", () => {
    sliderValue.textContent = slider.value;
  });

  document.getElementById("simulate-btn").addEventListener("click", () => runSimulation(location.id));
}

async function runSimulation(locationId) {
  const slider = document.getElementById("veg-slider");
  const errorBox = document.getElementById("sim-error");
  const resultBox = document.getElementById("sim-result");
  errorBox.innerHTML = "";

  try {
    const result = await api.simulate({
      location_id: locationId,
      delta_vegetation_pct: Number(slider.value),
    });

    resultBox.innerHTML = `
      <strong>${result.original_risk}</strong> &rarr; <strong>${result.simulated_risk}</strong>
      (${result.difference >= 0 ? "+" : ""}${result.difference}, ${result.percentage_change}%)
      <div class="disclaimer">${result.assumption}</div>
    `;

    document.getElementById("comparison-chart-wrap").style.display = "block";
    renderComparisonChart("comparison-chart", result.original_risk, result.simulated_risk);
  } catch (err) {
    errorBox.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupFilterChips();
  bootstrap();
});
