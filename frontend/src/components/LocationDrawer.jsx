import React, { useState, useEffect } from 'react';
import { 
  X, 
  Thermometer, 
  Trees, 
  Building2, 
  Navigation, 
  Mountain, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp,
  Sparkles, 
  RotateCcw, 
  Info, 
  Lightbulb,
  Sliders,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { 
  getExplanation, 
  runSimulation, 
  getRiskColor, 
  getRiskBadgeClasses 
} from '../api/client';

export default function LocationDrawer({ location, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'simulate'
  const [explanation, setExplanation] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Simulation state
  const [vegetationDelta, setVegetationDelta] = useState(10);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState(null);

  // Fetch explanation whenever location changes
  useEffect(() => {
    if (!location) return;

    let isMounted = true;
    setLoadingExplain(true);
    setSimulationResult(null);
    setVegetationDelta(10);
    setSimError(null);

    getExplanation(location.id)
      .then((data) => {
        if (isMounted) {
          setExplanation(data);
          setLoadingExplain(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load factor explanation:', err);
          setLoadingExplain(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location?.id]);

  // Run simulation
  const handleSimulate = async (delta) => {
    const val = delta !== undefined ? delta : vegetationDelta;
    setVegetationDelta(val);
    setSimulating(true);
    setSimError(null);

    try {
      const result = await runSimulation(location.id, val);
      setSimulationResult(result);
    } catch (err) {
      setSimError(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setVegetationDelta(10);
    setSimulationResult(null);
    setSimError(null);
  };

  if (!location) return null;

  const riskColor = getRiskColor(location.risk_category);
  const badgeClasses = getRiskBadgeClasses(location.risk_category);

  // Determine top driving factor summary
  const topFactor = explanation?.top_factors?.[0];
  const insightText = topFactor
    ? topFactor.direction === 'increases_risk'
      ? `High heat vulnerability here is primarily amplified by ${topFactor.feature.replace(/_/g, ' ')}. Prioritizing urban canopy cooling is recommended.`
      : `Beneficial environmental buffers (${topFactor.feature.replace(/_/g, ' ')}) are currently moderating temperatures in this sector.`
    : 'Analyzing environmental multi-factor interactions for this sector...';

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-[#dfc0b5] shadow-2xl z-40 flex flex-col transition-all duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#dfc0b5]/60 bg-[#fbf9f5] shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
                {location.risk_category} Risk
              </span>
              {location.neighbourhood && (
                <span className="text-xs font-semibold text-[#8b7268]">
                  {location.neighbourhood}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#1b1c1a] tracking-tight mt-1">
              {location.name}
            </h3>
            <p className="text-xs text-[#57423a] font-mono mt-0.5">
              {location.latitude.toFixed(4)}° N, {Math.abs(location.longitude).toFixed(4)}° W
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8b7268] hover:text-[#1b1c1a] hover:bg-[#eae1d8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#dfc0b5] mt-4 -mb-5 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#a13a00] text-[#a13a00]'
                : 'border-transparent text-[#57423a] hover:text-[#1b1c1a]'
            }`}
          >
            Risk Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('simulate');
              if (!simulationResult) handleSimulate(vegetationDelta);
            }}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'simulate'
                ? 'border-[#a13a00] text-[#a13a00]'
                : 'border-transparent text-[#57423a] hover:text-[#1b1c1a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c2521b]" />
            <span>Mitigation Simulator</span>
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#fbf9f5]">
        {activeTab === 'overview' ? (
          <>
            {/* Heat Risk Score Hero Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#dfc0b5] shadow-xs text-center relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: riskColor }}
              />
              <p className="text-xs font-bold text-[#8b7268] uppercase tracking-wider mb-2">
                Urban Heat Risk Index
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="text-5xl font-black tracking-tight"
                  style={{ color: riskColor }}
                >
                  {Math.round(location.risk_score)}
                </span>
                <span className="text-sm font-bold text-[#8b7268]">/ 100</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: riskColor }}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>{location.risk_category} Risk Zone</span>
              </div>
            </div>

            {/* Environmental Feature Indicators */}
            <div>
              <h4 className="text-xs font-bold text-[#57423a] uppercase tracking-wider mb-2.5">
                Environmental Baseline
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-[#dfc0b5] shadow-xs">
                  <div className="flex items-center justify-between text-[#8b7268] mb-1">
                    <span className="text-[11px] font-medium">NDVI Index</span>
                    <Trees className="w-3.5 h-3.5 text-[#2FA96C]" />
                  </div>
                  <p className="text-lg font-bold text-[#1b1c1a]">
                    {location.ndvi.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-[#57423a]">Vegetation density</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#dfc0b5] shadow-xs">
                  <div className="flex items-center justify-between text-[#8b7268] mb-1">
                    <span className="text-[11px] font-medium">Built-up %</span>
                    <Building2 className="w-3.5 h-3.5 text-[#C4432B]" />
                  </div>
                  <p className="text-lg font-bold text-[#1b1c1a]">
                    {Math.round(location.built_up_density_pct)}%
                  </p>
                  <p className="text-[10px] text-[#57423a]">Impervious surface</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#dfc0b5] shadow-xs">
                  <div className="flex items-center justify-between text-[#8b7268] mb-1">
                    <span className="text-[11px] font-medium">Green Space</span>
                    <Navigation className="w-3.5 h-3.5 text-[#E0A030]" />
                  </div>
                  <p className="text-lg font-bold text-[#1b1c1a]">
                    {Math.round(location.distance_to_green_space_m)} m
                  </p>
                  <p className="text-[10px] text-[#57423a]">Distance to park/canopy</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#dfc0b5] shadow-xs">
                  <div className="flex items-center justify-between text-[#8b7268] mb-1">
                    <span className="text-[11px] font-medium">Elevation</span>
                    <Mountain className="w-3.5 h-3.5 text-[#635d57]" />
                  </div>
                  <p className="text-lg font-bold text-[#1b1c1a]">
                    {location.elevation_m.toFixed(1)} m
                  </p>
                  <p className="text-[10px] text-[#57423a]">Altitude (AMSL)</p>
                </div>
              </div>
            </div>

            {/* Feature Contribution & Explainability */}
            <div className="bg-white p-4 rounded-2xl border border-[#dfc0b5] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1b1c1a] uppercase tracking-wider">
                  Top Contributing Factors
                </h4>
                <span className="text-[10px] text-[#8b7268] font-medium">SHAP/RF Feature Importance</span>
              </div>

              {loadingExplain ? (
                <div className="py-6 text-center text-xs text-[#8b7268] animate-pulse">
                  Calculating factor weights...
                </div>
              ) : explanation?.top_factors ? (
                <div className="space-y-2.5">
                  {explanation.top_factors.map((factor, i) => {
                    const isIncreases = factor.direction === 'increases_risk';
                    const maxWeight = Math.max(...explanation.top_factors.map(f => f.importance));
                    const widthPct = Math.max(15, Math.round((factor.importance / maxWeight) * 100));

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1b1c1a] capitalize">
                            {factor.feature.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`font-bold flex items-center gap-0.5 text-[11px] ${
                              isIncreases ? 'text-[#C4432B]' : 'text-[#2FA96C]'
                            }`}
                          >
                            {isIncreases ? '+' : '−'}
                            {(factor.importance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#f5f3ef] rounded-full overflow-hidden border border-[#dfc0b5]/40">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: isIncreases ? '#C4432B' : '#2FA96C',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#8b7268]">Factor breakdown unavailable.</p>
              )}
            </div>

            {/* Planner Insight Note */}
            <div className="p-3.5 bg-[#eae1d8]/70 border border-[#dfc0b5] rounded-xl flex items-start gap-2.5 text-xs text-[#57423a]">
              <Lightbulb className="w-4 h-4 text-[#a13a00] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{insightText}</p>
            </div>
          </>
        ) : (
          /* SIMULATE TAB */
          <div className="space-y-5">
            {/* Simulation Header */}
            <div>
              <h4 className="text-xs font-bold text-[#57423a] uppercase tracking-wider mb-1">
                Vegetation Canopy Intervention
              </h4>
              <p className="text-xs text-[#8b7268]">
                Simulate temperature moderation benefits by scaling urban greening and tree canopy.
              </p>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {[10, 20, 30, 50].map((delta) => {
                const isSelected = vegetationDelta === delta;
                return (
                  <button
                    key={delta}
                    onClick={() => handleSimulate(delta)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#a13a00] text-white border-[#a13a00] shadow-sm'
                        : 'bg-white text-[#57423a] border-[#dfc0b5] hover:border-[#a13a00]/60 hover:bg-[#f5f3ef]'
                    }`}
                  >
                    +{delta}% Vegetation
                  </button>
                );
              })}
            </div>

            {/* Custom Slider */}
            <div className="bg-white p-3.5 rounded-xl border border-[#dfc0b5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c1a]">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#a13a00]" />
                  <span>Custom Delta</span>
                </span>
                <span className="text-[#a13a00] font-bold">+{vegetationDelta}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={vegetationDelta}
                onChange={(e) => handleSimulate(Number(e.target.value))}
                className="w-full accent-[#a13a00] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b7268]">
                <span>0% Baseline</span>
                <span>+50% Expansion</span>
                <span>+100% Full Canopy</span>
              </div>
            </div>

            {/* Before vs After Comparison Card */}
            {simError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{simError}</span>
              </div>
            ) : simulationResult ? (
              <div className="bg-white rounded-2xl p-5 border border-[#dfc0b5] shadow-xs space-y-4">
                <p className="text-xs font-bold text-[#8b7268] uppercase tracking-wider text-center">
                  Projected Heat Risk Comparison
                </p>

                {/* Score delta showcase */}
                <div className="flex items-center justify-between gap-3">
                  {/* Before */}
                  <div className="flex-1 text-center p-3 bg-[#f5f3ef] rounded-xl border border-[#dfc0b5]/50">
                    <p className="text-[11px] font-semibold text-[#8b7268]">Current Baseline</p>
                    <p className="text-2xl font-black text-[#1b1c1a] mt-1">
                      {Math.round(simulationResult.before_risk_score)}
                    </p>
                    <span className="text-[10px] font-bold text-[#57423a]">
                      {simulationResult.before_risk_category}
                    </span>
                  </div>

                  {/* Arrow & Delta Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-[#8b7268]" />
                    {(() => {
                      const diff = Math.round(
                        simulationResult.after_risk_score - simulationResult.before_risk_score
                      );
                      const isReduction = diff < 0;
                      return (
                        <div
                          className={`mt-1 px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-0.5 ${
                            isReduction
                              ? 'bg-[#2FA96C]/15 text-[#1e6f47] border border-[#2FA96C]/30'
                              : 'bg-[#C4432B]/15 text-[#C4432B] border border-[#C4432B]/30'
                          }`}
                        >
                          {isReduction ? (
                            <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUp className="w-3 h-3" />
                          )}
                          <span>{Math.abs(diff)} pts</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* After */}
                  <div className="flex-1 text-center p-3 bg-[#2FA96C]/10 rounded-xl border border-[#2FA96C]/30">
                    <p className="text-[11px] font-semibold text-[#1e6f47]">Projected Risk</p>
                    <p className="text-2xl font-black text-[#1e6f47] mt-1">
                      {Math.round(simulationResult.after_risk_score)}
                    </p>
                    <span className="text-[10px] font-bold text-[#1e6f47]">
                      {simulationResult.after_risk_category}
                    </span>
                  </div>
                </div>

                {/* NDVI Progression Bar */}
                <div className="pt-2 border-t border-[#dfc0b5]/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#57423a] font-medium">NDVI Index Shift</span>
                    <span className="font-bold text-[#1b1c1a]">
                      {simulationResult.ndvi_before} →{' '}
                      <span className="text-[#2FA96C]">{simulationResult.ndvi_after}</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#f5f3ef] rounded-full overflow-hidden flex border border-[#dfc0b5]/50">
                    <div
                      className="bg-[#57423a] h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, simulationResult.ndvi_before * 100)}%` }}
                    />
                    <div
                      className="bg-[#2FA96C] h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100 - simulationResult.ndvi_before * 100,
                          (simulationResult.ndvi_after - simulationResult.ndvi_before) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetSimulation}
                  className="w-full py-2 px-3 rounded-xl border border-[#dfc0b5] bg-white text-[#57423a] hover:text-[#a13a00] hover:bg-[#f5f3ef] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Baseline</span>
                </button>
              </div>
            ) : simulating ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#dfc0b5] text-xs text-[#8b7268] animate-pulse">
                Running ML simulation inference...
              </div>
            ) : null}

            {/* Disclaimer caption */}
            <div className="p-3 bg-[#eae1d8]/50 rounded-xl border border-[#dfc0b5]/60 text-[11px] text-[#57423a] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#8b7268] shrink-0 mt-0.5" />
              <p className="leading-normal">
                Simulation reflects simplified linear NDVI adjustments for planning support — indicative of cooling trends rather than absolute meteorological forecasts.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
