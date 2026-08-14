/**
 * charts.js — Chart.js visualisations for factor importance and
 * before/after simulation comparison.
 */

let factorChart = null;
let comparisonChart = null;

function renderFactorChart(canvasId, factors) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const labels = factors.map((f) => f.feature);
  const values = factors.map((f) => f.importance);

  if (factorChart) factorChart.destroy();
  factorChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Feature importance",
          data: values,
          backgroundColor: "#c2603d",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    },
  });
}

function renderComparisonChart(canvasId, originalRisk, simulatedRisk) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (comparisonChart) comparisonChart.destroy();
  comparisonChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Original risk", "Simulated risk"],
      datasets: [
        {
          label: "Risk score",
          data: [originalRisk, simulatedRisk],
          backgroundColor: ["#a24c2e", "#4c9a6a"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}
