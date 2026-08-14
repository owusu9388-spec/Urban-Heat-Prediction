import React from 'react';
import { X, Info, ShieldCheck, AlertTriangle, Cpu, Database, BookOpen } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#dfc0b5] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#dfc0b5]/60 bg-[#fbf9f5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#a13a00]/15 text-[#a13a00] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1b1c1a]">About UrbanHeat Accra</h3>
              <p className="text-xs text-[#57423a]">Climate Resilience & Planning Support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8b7268] hover:text-[#1b1c1a] hover:bg-[#eae1d8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs leading-relaxed text-[#57423a]">
          <div>
            <h4 className="font-bold text-sm text-[#1b1c1a] mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#a13a00]" />
              <span>Project Background</span>
            </h4>
            <p>
              UrbanHeat Accra is an AI-assisted planning support dashboard designed to assist urban planners in identifying, understanding, and mitigating urban heat vulnerability across the Greater Accra Metropolitan Area.
            </p>
          </div>

          <div className="p-3.5 bg-[#f5f3ef] rounded-2xl border border-[#dfc0b5] space-y-2">
            <h4 className="font-bold text-xs text-[#1b1c1a] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#c2521b]" />
              <span>Machine Learning & Physics Rationale</span>
            </h4>
            <p>
              The system utilizes a <b>RandomForestRegressor</b> model trained on multispectral and geospatial indicators:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><b>NDVI:</b> Higher vegetation cover provides direct evaporative cooling (reduces risk).</li>
              <li><b>Built-up Density:</b> Higher thermal mass & impervious concrete amplifies heat retention (increases risk).</li>
              <li><b>Distance to Green Space:</b> Proximity to urban parks and tree canopy dampens heat vulnerability.</li>
              <li><b>Elevation:</b> Orographic airflow and cooling effects at higher altitudes.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-[#eae1d8]/60 rounded-2xl border border-[#dfc0b5] space-y-1.5">
            <h4 className="font-bold text-xs text-[#1b1c1a] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#E0A030]" />
              <span>Methodological Limitations</span>
            </h4>
            <p className="text-[11px]">
              Outputs provide a <b>relative heat vulnerability indicator</b> for spatial comparison and planning prioritization. The simulation uses a simplified linear adjustment and should not be interpreted as absolute meteorological measurements.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f5f3ef] border-t border-[#dfc0b5]/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold text-xs bg-[#a13a00] text-white hover:bg-[#c2521b] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
