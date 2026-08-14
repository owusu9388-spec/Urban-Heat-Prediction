import React, { useState, useRef, useEffect } from 'react';
import { Search, RefreshCw, Filter, Sparkles, X, ChevronDown } from 'lucide-react';

export default function Header({
  searchTerm,
  setSearchTerm,
  riskFilter,
  setRiskFilter,
  locations,
  onSelectLocation,
  onRefresh,
  isLoading,
  onOpenPredictor,
  activeView
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter autocomplete results based on search input
  const searchSuggestions = searchTerm.trim().length >= 1
    ? locations
        .filter(loc => 
          loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (loc.neighbourhood && loc.neighbourhood.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterOptions = [
    { label: 'All Risks', value: 'all', color: '#635d57' },
    { label: 'Low (<30)', value: 'low', color: '#2FA96C' },
    { label: 'Moderate (30-55)', value: 'moderate', color: '#E0A030' },
    { label: 'High (55-75)', value: 'high', color: '#C4432B' },
    { label: 'Severe (>75)', value: 'severe', color: '#7B0000' },
  ];

  return (
    <header className="h-16 border-b border-[#dfc0b5] bg-[#fbf9f5]/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: View title & Filter tabs */}
      <div className="flex items-center gap-6">
        <h2 className="font-bold text-lg text-[#1b1c1a] tracking-tight hidden sm:block">
          {activeView === 'map' ? 'Urban Heat Risk Map' : 'Location Data Explorer'}
        </h2>

        {/* Risk Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-[#eae1d8]/70 rounded-xl border border-[#dfc0b5]/60 overflow-x-auto">
          {filterOptions.map(opt => {
            const isActive = riskFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setRiskFilter(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1b1c1a] shadow-xs border border-[#dfc0b5]'
                    : 'text-[#57423a] hover:text-[#1b1c1a] hover:bg-white/50'
                }`}
              >
                {opt.value !== 'all' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Search & Quick actions */}
      <div className="flex items-center gap-3">
        {/* Search input with autocomplete */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b7268] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search site or area..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-56 md:w-64 pl-9 pr-8 py-1.5 rounded-full text-xs font-medium bg-white border border-[#dfc0b5] text-[#1b1c1a] placeholder-[#8b7268] focus:outline-none focus:ring-2 focus:ring-[#a13a00]/30 focus:border-[#a13a00] transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b7268] hover:text-[#1b1c1a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#dfc0b5] shadow-xl py-1 z-50 overflow-hidden">
              <div className="px-3 py-1 text-[10px] font-semibold text-[#8b7268] uppercase tracking-wider bg-[#f5f3ef]">
                Matching Locations ({searchSuggestions.length})
              </div>
              {searchSuggestions.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc);
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#f5f3ef] transition-colors flex items-center justify-between text-xs border-b border-[#dfc0b5]/30 last:border-0"
                >
                  <div>
                    <span className="font-semibold text-[#1b1c1a]">{loc.name}</span>
                    {loc.neighbourhood && (
                      <span className="text-[#8b7268] ml-1.5">({loc.neighbourhood})</span>
                    )}
                  </div>
                  <span
                    className="font-bold px-2 py-0.5 rounded-md text-[11px]"
                    style={{
                      backgroundColor: `${loc.risk_category === 'Severe' ? '#7B0000' : loc.risk_category === 'High' ? '#C4432B' : loc.risk_category === 'Moderate' ? '#E0A030' : '#2FA96C'}15`,
                      color: loc.risk_category === 'Severe' ? '#7B0000' : loc.risk_category === 'High' ? '#C4432B' : loc.risk_category === 'Moderate' ? '#916212' : '#1e6f47'
                    }}
                  >
                    {Math.round(loc.risk_score)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Predictor Quick Button */}
        <button
          onClick={onOpenPredictor}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#c2521b] to-[#a13a00] text-white hover:brightness-105 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Prediction</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Data from API"
          className="p-2 rounded-full border border-[#dfc0b5] bg-white text-[#57423a] hover:text-[#a13a00] hover:bg-[#f5f3ef] transition-all disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#a13a00]' : ''}`} />
        </button>
      </div>
    </header>
  );
}
