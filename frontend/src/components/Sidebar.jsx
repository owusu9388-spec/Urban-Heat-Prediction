import React from 'react';
import { 
  MapPin, 
  Database, 
  Sparkles, 
  Info, 
  Flame, 
  Activity, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Sidebar({ 
  activeView, 
  setActiveView, 
  apiStatus, 
  onOpenPredictor, 
  onOpenAbout 
}) {
  return (
    <aside className="w-64 bg-[#f5f3ef] border-r border-[#dfc0b5] flex flex-col h-screen shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#dfc0b5]/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c2521b] to-[#a13a00] flex items-center justify-center text-white shadow-md shadow-[#a13a00]/20">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-[#a13a00] leading-tight flex items-center gap-1.5">
            UrbanHeat Accra
          </h1>
          <p className="text-xs text-[#57423a] font-medium">Climate Resilience AI</p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
          Dashboards
        </div>

        <button
          onClick={() => setActiveView('map')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            activeView === 'map'
              ? 'bg-[#eae1d8] text-[#a13a00] font-semibold shadow-xs border border-[#dfc0b5]'
              : 'text-[#57423a] hover:bg-[#eae1d8]/60 hover:text-[#1b1c1a]'
          }`}
        >
          <MapPin className={`w-4 h-4 ${activeView === 'map' ? 'text-[#a13a00]' : 'text-[#8b7268]'}`} />
          <span>Heat Risk Map</span>
        </button>

        <button
          onClick={() => setActiveView('explorer')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            activeView === 'explorer'
              ? 'bg-[#eae1d8] text-[#a13a00] font-semibold shadow-xs border border-[#dfc0b5]'
              : 'text-[#57423a] hover:bg-[#eae1d8]/60 hover:text-[#1b1c1a]'
          }`}
        >
          <Database className={`w-4 h-4 ${activeView === 'explorer' ? 'text-[#a13a00]' : 'text-[#8b7268]'}`} />
          <span>Data Explorer</span>
        </button>

        <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold text-[#8b7268] uppercase tracking-wider">
          Decision Support
        </div>

        <button
          onClick={onOpenPredictor}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#57423a] hover:bg-[#eae1d8]/60 hover:text-[#a13a00] transition-colors group"
        >
          <Sparkles className="w-4 h-4 text-[#c2521b] group-hover:scale-110 transition-transform" />
          <span>Risk Predictor Tool</span>
        </button>

        <button
          onClick={onOpenAbout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#57423a] hover:bg-[#eae1d8]/60 hover:text-[#1b1c1a] transition-colors"
        >
          <Info className="w-4 h-4 text-[#8b7268]" />
          <span>Methodology & Scope</span>
        </button>
      </nav>

      {/* Backend API status & footer */}
      <div className="p-3 border-t border-[#dfc0b5]/60 bg-[#efeeea]/60 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/80 border border-[#dfc0b5]/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {apiStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FA96C] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  apiStatus === 'connected'
                    ? 'bg-[#2FA96C]'
                    : apiStatus === 'connecting'
                    ? 'bg-[#E0A030]'
                    : 'bg-[#C4432B]'
                }`}
              ></span>
            </span>
            <span className="font-medium text-[#1b1c1a]">
              {apiStatus === 'connected'
                ? 'FastAPI Connected'
                : apiStatus === 'connecting'
                ? 'Connecting...'
                : 'API Offline'}
            </span>
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            title="Open Swagger API Docs"
            className="text-[#8b7268] hover:text-[#a13a00] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="px-3 py-1 text-[11px] text-[#8b7268] flex items-center justify-between">
          <span>Accra Met Area</span>
          <span>v1.0.0 (MVP)</span>
        </div>
      </div>
    </aside>
  );
}
