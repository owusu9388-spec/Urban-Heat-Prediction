import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiRow from './components/KpiRow';
import MapView from './components/MapView';
import LocationDrawer from './components/LocationDrawer';
import DataExplorer from './components/DataExplorer';
import PredictModal from './components/PredictModal';
import AboutModal from './components/AboutModal';
import { getLocations, checkHealth } from './api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('map'); // 'map' | 'explorer'
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'low' | 'moderate' | 'high' | 'severe'

  // Modals
  const [isPredictorOpen, setIsPredictorOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Health check & data load
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check health
      await checkHealth();
      setApiStatus('connected');

      // 2. Fetch locations
      const res = await getLocations();
      setLocations(res.results || []);
    } catch (err) {
      console.error('Failed to connect to backend:', err);
      setApiStatus('error');
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Periodic health poll every 15 seconds
    const interval = setInterval(() => {
      checkHealth()
        .then(() => setApiStatus('connected'))
        .catch(() => setApiStatus('error'));
    }, 15000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Compute filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Risk filter
      if (riskFilter !== 'all') {
        if (loc.risk_category.toLowerCase() !== riskFilter.toLowerCase()) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesNeighbourhood = loc.neighbourhood && loc.neighbourhood.toLowerCase().includes(q);
        if (!matchesName && !matchesNeighbourhood) {
          return false;
        }
      }

      return true;
    });
  }, [locations, riskFilter, searchTerm]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbf9f5] font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        apiStatus={apiStatus}
        onOpenPredictor={() => setIsPredictorOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Top Header */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          riskFilter={riskFilter}
          setRiskFilter={setRiskFilter}
          locations={locations}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
          onRefresh={loadData}
          isLoading={loading}
          onOpenPredictor={() => setIsPredictorOpen(true)}
          activeView={activeView}
        />

        {/* Global Connection Warning Banner */}
        {apiStatus === 'error' && (
          <div className="bg-[#C4432B]/10 border-b border-[#C4432B]/30 px-6 py-2 flex items-center justify-between text-xs text-[#C4432B] font-semibold shrink-0 z-20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Backend API is currently unreachable. Ensure the FastAPI server is running on http://127.0.0.1:8000</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-[#C4432B]/40 hover:bg-[#C4432B]/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Body based on active view */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {activeView === 'map' ? (
            <>
              {/* Live KPI summary cards */}
              <KpiRow
                allLocations={locations}
                filteredLocations={filteredLocations}
              />

              {/* Map Canvas */}
              <div className="flex-1 relative w-full h-full">
                <MapView
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={(loc) => setSelectedLocation(loc)}
                />
              </div>
            </>
          ) : (
            <DataExplorer
              locations={filteredLocations}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              onSwitchToMap={() => setActiveView('map')}
            />
          )}
        </div>

        {/* Selected Location Slide-out Drawer */}
        {selectedLocation && (
          <LocationDrawer
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        )}
      </main>

      {/* Decision Support Modals */}
      <PredictModal
        isOpen={isPredictorOpen}
        onClose={() => setIsPredictorOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
