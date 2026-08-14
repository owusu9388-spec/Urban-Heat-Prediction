import React from 'react';
import { ShieldAlert, TrendingUp, MapPin, Layers } from 'lucide-react';

export default function KpiRow({ allLocations, filteredLocations }) {
  const total = allLocations.length;
  const highSevereCount = allLocations.filter(
    l => l.risk_category === 'High' || l.risk_category === 'Severe'
  ).length;

  const avgRisk = total > 0
    ? Math.round(allLocations.reduce((sum, l) => sum + l.risk_score, 0) / total)
    : 0;

  const shownCount = filteredLocations.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 bg-[#fbf9f5] border-b border-[#dfc0b5]/50 shrink-0">
      {/* KPI 1: Total Locations */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#dfc0b5] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
            Total Locations
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight mt-0.5">
            {total}
          </p>
          <p className="text-[11px] text-[#57423a] mt-0.5">Accra Metropolitan</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] border border-[#dfc0b5]/60 flex items-center justify-center text-[#a13a00]">
          <MapPin className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2: High / Severe Risk */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#dfc0b5] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
            High & Severe Risk
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#C4432B] tracking-tight mt-0.5">
            {highSevereCount}
          </p>
          <p className="text-[11px] text-[#C4432B] font-medium mt-0.5">
            {total > 0 ? `${Math.round((highSevereCount / total) * 100)}% of total sites` : '—'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#C4432B]/10 border border-[#C4432B]/20 flex items-center justify-center text-[#C4432B]">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Average Heat Risk Score */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#dfc0b5] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
            Avg. Heat Risk
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight">
              {avgRisk}
            </span>
            <span className="text-xs font-bold text-[#E0A030]">/100</span>
          </div>
          <p className="text-[11px] text-[#57423a] mt-0.5">
            {avgRisk < 30 ? 'Low Risk Mean' : avgRisk < 55 ? 'Moderate Tier' : 'Elevated Tier'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#E0A030]/10 border border-[#E0A030]/20 flex items-center justify-center text-[#E0A030]">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Filtered / Shown */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#dfc0b5] shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
            Active Filter
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#a13a00] tracking-tight mt-0.5">
            {shownCount}
          </p>
          <p className="text-[11px] text-[#57423a] mt-0.5">Sites visible on map</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#a13a00]/10 border border-[#a13a00]/20 flex items-center justify-center text-[#a13a00]">
          <Layers className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
