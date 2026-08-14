import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRiskColor, getRiskBadgeClasses } from '../api/client';
import { ChevronRight, Thermometer, Trees, Building2, Mountain } from 'lucide-react';

/** Map controller component to smoothly fly/pan to selected location */
function MapController({ selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 14, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selectedLocation, map]);

  return null;
}

/** Create custom colored DivIcon for map markers */
function createCustomPin(location, isSelected) {
  const color = getRiskColor(location.risk_category);
  const size = isSelected ? 22 : 16;
  const pulseHtml = isSelected
    ? `<div class="marker-pulse" style="background-color: ${color};"></div>`
    : '';

  return L.divIcon({
    className: 'custom-heat-pin',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${pulseHtml}
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          background: ${color}; 
          border: ${isSelected ? '3.5px' : '2.5px'} solid #ffffff; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          transition: transform 0.2s ease;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

export default function MapView({
  locations,
  selectedLocation,
  onSelectLocation,
}) {
  const defaultCenter = [5.603, -0.187]; // Accra coordinates
  const defaultZoom = 12;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapController selectedLocation={selectedLocation} />

        {locations.map((loc) => {
          const isSelected = selectedLocation && selectedLocation.id === loc.id;
          const color = getRiskColor(loc.risk_category);
          const badgeClasses = getRiskBadgeClasses(loc.risk_category);

          return (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={createCustomPin(loc, isSelected)}
              eventHandlers={{
                click: () => onSelectLocation(loc),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] select-none">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b1c1a] leading-tight">
                        {loc.name}
                      </h4>
                      {loc.neighbourhood && (
                        <p className="text-xs text-[#57423a] font-medium">
                          {loc.neighbourhood}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeClasses}`}
                    >
                      {loc.risk_category}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="bg-[#f5f3ef] rounded-xl p-2.5 mb-2.5 flex items-center justify-between border border-[#dfc0b5]/50">
                    <div className="flex items-center gap-1.5 text-xs text-[#57423a] font-semibold">
                      <Thermometer className="w-3.5 h-3.5 text-[#a13a00]" />
                      <span>Risk Score</span>
                    </div>
                    <span className="text-base font-extrabold text-[#1b1c1a]">
                      {Math.round(loc.risk_score)}
                      <span className="text-xs text-[#8b7268] font-normal"> / 100</span>
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#57423a] mb-3">
                    <div className="flex items-center gap-1 bg-white p-1 rounded border border-[#dfc0b5]/40">
                      <Trees className="w-3 h-3 text-[#2FA96C]" />
                      <span>NDVI: <b>{loc.ndvi?.toFixed(2)}</b></span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded border border-[#dfc0b5]/40">
                      <Building2 className="w-3 h-3 text-[#C4432B]" />
                      <span>Density: <b>{loc.built_up_density_pct?.toFixed(0)}%</b></span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onSelectLocation(loc)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#a13a00] text-white hover:bg-[#c2521b] transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>Simulate & Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-5 left-5 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#dfc0b5] shadow-lg text-xs select-none">
        <h4 className="font-bold text-xs text-[#1b1c1a] mb-2 flex items-center gap-1.5">
          <span>Heat Risk Tiers</span>
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2FA96C] border border-white shadow-xs"></span>
            <span className="text-[#57423a] font-medium">Low (&lt; 30)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E0A030] border border-white shadow-xs"></span>
            <span className="text-[#57423a] font-medium">Moderate (30 - 55)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C4432B] border border-white shadow-xs"></span>
            <span className="text-[#57423a] font-medium">High (55 - 75)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#7B0000] border border-white shadow-xs"></span>
            <span className="text-[#57423a] font-medium">Severe (&gt; 75)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
