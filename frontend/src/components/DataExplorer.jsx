import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import { getRiskBadgeClasses } from '../api/client';

export default function DataExplorer({ 
  locations, 
  onSelectLocation, 
  onSwitchToMap 
}) {
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState('risk_score');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtered & Sorted records
  const processedLocations = useMemo(() => {
    let result = [...locations];

    // Filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(
        loc =>
          loc.name.toLowerCase().includes(q) ||
          (loc.neighbourhood && loc.neighbourhood.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [locations, tableSearch, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedLocations.length / pageSize));
  const currentRecords = processedLocations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    if (!processedLocations.length) return;

    const headers = [
      'ID',
      'Name',
      'Neighbourhood',
      'Latitude',
      'Longitude',
      'NDVI',
      'BuiltUp_Density_Pct',
      'GreenSpace_Dist_m',
      'Elevation_m',
      'Risk_Score',
      'Risk_Category',
    ];

    const rows = processedLocations.map(loc => [
      loc.id,
      `"${loc.name.replace(/"/g, '""')}"`,
      `"${(loc.neighbourhood || '').replace(/"/g, '""')}"`,
      loc.latitude,
      loc.longitude,
      loc.ndvi,
      loc.built_up_density_pct,
      loc.distance_to_green_space_m,
      loc.elevation_m,
      loc.risk_score,
      loc.risk_category,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `UrbanHeat_Accra_Dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#8b7268]/60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#a13a00] ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#a13a00] ml-1 inline" />
    );
  };

  return (
    <div className="flex-1 p-6 bg-[#fbf9f5] flex flex-col overflow-hidden">
      {/* Top Table Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b7268] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter dataset rows..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-1.5 rounded-xl text-xs font-medium bg-white border border-[#dfc0b5] text-[#1b1c1a] placeholder-[#8b7268] focus:outline-none focus:ring-2 focus:ring-[#a13a00]/30 w-64 shadow-xs"
            />
          </div>
          <span className="text-xs text-[#57423a] font-semibold">
            {processedLocations.length} locations found
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#dfc0b5] text-[#57423a] hover:text-[#a13a00] hover:bg-[#f5f3ef] transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white rounded-2xl border border-[#dfc0b5] shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#f5f3ef] border-b border-[#dfc0b5] z-10 select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Site Name {renderSortIcon('name')}
                </th>
                <th
                  onClick={() => handleSort('neighbourhood')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Neighbourhood {renderSortIcon('neighbourhood')}
                </th>
                <th
                  onClick={() => handleSort('latitude')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Coordinates {renderSortIcon('latitude')}
                </th>
                <th
                  onClick={() => handleSort('ndvi')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  NDVI {renderSortIcon('ndvi')}
                </th>
                <th
                  onClick={() => handleSort('built_up_density_pct')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Built-up % {renderSortIcon('built_up_density_pct')}
                </th>
                <th
                  onClick={() => handleSort('distance_to_green_space_m')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Green Space {renderSortIcon('distance_to_green_space_m')}
                </th>
                <th
                  onClick={() => handleSort('elevation_m')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap"
                >
                  Elevation {renderSortIcon('elevation_m')}
                </th>
                <th
                  onClick={() => handleSort('risk_score')}
                  className="py-3 px-4 font-bold text-[#57423a] cursor-pointer hover:text-[#1b1c1a] whitespace-nowrap text-right"
                >
                  Risk Score {renderSortIcon('risk_score')}
                </th>
                <th className="py-3 px-4 font-bold text-[#57423a] text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfc0b5]/40 font-medium text-[#1b1c1a]">
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#8b7268]">
                    No locations match the filter criteria.
                  </td>
                </tr>
              ) : (
                currentRecords.map((loc) => {
                  const badgeClasses = getRiskBadgeClasses(loc.risk_category);
                  return (
                    <tr
                      key={loc.id}
                      onClick={() => onSelectLocation(loc)}
                      className="hover:bg-[#fbf9f5] cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-bold text-[#a13a00] group-hover:underline">
                        {loc.name}
                      </td>
                      <td className="py-3 px-4 text-[#57423a]">
                        {loc.neighbourhood || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#8b7268]">
                        {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                      </td>
                      <td className="py-3 px-4 font-mono text-[#1b1c1a]">
                        {loc.ndvi.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#1b1c1a]">
                        {Math.round(loc.built_up_density_pct)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-[#57423a]">
                        {Math.round(loc.distance_to_green_space_m)} m
                      </td>
                      <td className="py-3 px-4 font-mono text-[#57423a]">
                        {loc.elevation_m.toFixed(1)} m
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeClasses}`}
                        >
                          <span>{Math.round(loc.risk_score)}</span>
                          <span className="text-[10px] font-semibold opacity-80">
                            ({loc.risk_category})
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLocation(loc);
                            onSwitchToMap();
                          }}
                          title="Locate on Map"
                          className="p-1 rounded-lg text-[#8b7268] hover:text-[#a13a00] hover:bg-[#eae1d8] transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-[#f5f3ef] border-t border-[#dfc0b5] flex items-center justify-between text-xs text-[#57423a] shrink-0">
          <div>
            Showing{' '}
            <span className="font-bold text-[#1b1c1a]">
              {processedLocations.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#1b1c1a]">
              {Math.min(currentPage * pageSize, processedLocations.length)}
            </span>{' '}
            of <span className="font-bold text-[#1b1c1a]">{processedLocations.length}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#dfc0b5] bg-white text-[#57423a] hover:bg-[#eae1d8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-[#1b1c1a]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#dfc0b5] bg-white text-[#57423a] hover:bg-[#eae1d8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
