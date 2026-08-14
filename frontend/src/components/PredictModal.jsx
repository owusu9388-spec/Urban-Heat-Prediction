import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Thermometer, Trees, Building2, Navigation, Mountain } from 'lucide-react';
import { predictRisk, getRiskColor, getRiskBadgeClasses } from '../api/client';

export default function PredictModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    ndvi: 0.25,
    built_up_density_pct: 65,
    distance_to_green_space_m: 850,
    elevation_m: 35,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await predictRisk(formData);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#dfc0b5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#dfc0b5]/60 bg-[#fbf9f5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c2521b]/15 text-[#c2521b] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1b1c1a]">
                Direct ML Heat Risk Predictor
              </h3>
              <p className="text-xs text-[#57423a]">
                Inference via RandomForest model (/api/predict)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8b7268] hover:text-[#1b1c1a] hover:bg-[#eae1d8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NDVI Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c1a]">
                <label className="flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-[#2FA96C]" />
                  <span>NDVI (Vegetation Index)</span>
                </label>
                <span className="font-mono text-[#2FA96C] font-bold">
                  {formData.ndvi.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-0.2"
                max="0.9"
                step="0.05"
                value={formData.ndvi}
                onChange={(e) => handleChange('ndvi', parseFloat(e.target.value))}
                className="w-full accent-[#2FA96C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b7268]">
                <span>-0.2 (Water/Barren)</span>
                <span>0.35 (Sparse)</span>
                <span>0.9 (Dense Canopy)</span>
              </div>
            </div>

            {/* Built-up Density */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c1a]">
                <label className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#C4432B]" />
                  <span>Built-up Surface Density (%)</span>
                </label>
                <span className="font-mono text-[#C4432B] font-bold">
                  {formData.built_up_density_pct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={formData.built_up_density_pct}
                onChange={(e) => handleChange('built_up_density_pct', parseFloat(e.target.value))}
                className="w-full accent-[#C4432B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b7268]">
                <span>0% Rural</span>
                <span>50% Suburb</span>
                <span>100% High-Density Urban</span>
              </div>
            </div>

            {/* Distance to Green Space */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c1a]">
                <label className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#E0A030]" />
                  <span>Distance to Nearest Green Space (m)</span>
                </label>
                <span className="font-mono text-[#E0A030] font-bold">
                  {formData.distance_to_green_space_m} m
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={formData.distance_to_green_space_m}
                onChange={(e) => handleChange('distance_to_green_space_m', parseFloat(e.target.value))}
                className="w-full accent-[#E0A030] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b7268]">
                <span>0m (Adjacent)</span>
                <span>2500m</span>
                <span>5000m (Remote)</span>
              </div>
            </div>

            {/* Elevation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c1a]">
                <label className="flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#635d57]" />
                  <span>Elevation (m AMSL)</span>
                </label>
                <span className="font-mono text-[#57423a] font-bold">
                  {formData.elevation_m} m
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={formData.elevation_m}
                onChange={(e) => handleChange('elevation_m', parseFloat(e.target.value))}
                className="w-full accent-[#635d57] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b7268]">
                <span>0m Coastal Lowland</span>
                <span>60m Midland</span>
                <span>120m Ridge</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#a13a00] text-white hover:bg-[#c2521b] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Evaluating Model...' : 'Calculate Heat Risk Score'}</span>
            </button>
          </form>

          {/* Prediction Result Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-[#f5f3ef] rounded-2xl border border-[#dfc0b5] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
                  Predicted Heat Risk Score
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className="text-3xl font-extrabold tracking-tight"
                    style={{ color: getRiskColor(result.risk_category) }}
                  >
                    {Math.round(result.risk_score)}
                  </span>
                  <span className="text-xs font-bold text-[#8b7268]">/ 100</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeClasses(
                  result.risk_category
                )}`}
              >
                {result.risk_category} Risk
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
