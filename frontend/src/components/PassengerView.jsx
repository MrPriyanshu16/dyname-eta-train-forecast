import React, { useState, useMemo } from 'react';
import { Search, Train, Gauge, Sparkles, MapPin, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Focus, AlertTriangle, Layers } from 'lucide-react';
import CorridorMap from './CorridorMap';

// Category Badge Color Palette matching the clean reference design
const getCategoryBadgeStyle = (category, trainColor) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('vande')) {
    return { bg: '#FFFFFF', iconColor: '#0284C7', border: '#38BDF8' };
  } else if (cat.includes('shatabdi')) {
    return { bg: '#F5F3FF', iconColor: '#7C3AED', border: '#A78BFA' };
  } else if (cat.includes('rajdhani')) {
    return { bg: '#FFF1F2', iconColor: '#E11D48', border: '#FB7185' };
  } else if (cat.includes('superfast')) {
    return { bg: '#FEF3C7', iconColor: '#D97706', border: '#FBBF24' };
  }
  return { bg: '#FFFFFF', iconColor: trainColor || '#38BDF8', border: '#71717A' };
};

export default function PassengerView({ 
  trains = [], 
  selectedTrainId, 
  onSelectTrain,
  stations = [],
  sections = [],
  signals = [],
  nationwideRoutes = [],
  nationwideStations = [],
  disruptions = {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ontime' | 'delayed' | 'premium'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter trains based on search input and active filter chip
  const filteredTrains = useMemo(() => {
    return trains.filter(t => {
      const matchesSearch = 
        t.train_number.includes(searchQuery) ||
        t.train_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === 'ontime') return (t.current_delay_min || 0) <= 5;
      if (activeFilter === 'delayed') return (t.current_delay_min || 0) > 5;
      if (activeFilter === 'premium') {
        const cat = (t.category || '').toLowerCase();
        return cat.includes('vande') || cat.includes('shatabdi') || cat.includes('rajdhani') || t.priority_tier === 1;
      }
      return true;
    });
  }, [trains, searchQuery, activeFilter]);

  const selectedTrain = useMemo(() => {
    return trains.find(t => t.train_number === selectedTrainId) || trains[0] || null;
  }, [trains, selectedTrainId]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#09090b]">
      
      {/* 1. FULL-BLEED BACKGROUND MAP (Uber-style base with all rail lines + glowing corridor) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CorridorMap
          stations={stations}
          sections={sections}
          trains={trains}
          signals={signals}
          nationwideRoutes={nationwideRoutes}
          nationwideStations={nationwideStations}
          selectedTrainId={selectedTrainId}
          onSelectTrain={onSelectTrain}
          disruptions={disruptions}
          hideInternalHeader={true}
        />
      </div>

      {/* 2. FLOATING BUTTON TO RE-OPEN SIDEBAR (Appears when sidebar is collapsed) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="absolute top-20 left-4 z-[900] flex items-center space-x-2 px-3.5 py-2.5 rounded-2xl bg-zinc-950/85 backdrop-blur-2xl border border-white/10 text-xs font-semibold text-white shadow-2xl hover:bg-zinc-900 transition active:scale-95 pointer-events-auto"
        >
          <Train className="w-4 h-4 text-sky-400" />
          <span>Show Trains ({filteredTrains.length})</span>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      )}

      {/* 3. FLOATING LEFT SIDEBAR (Glassmorphic Train Search & List matching reference design) */}
      <div 
        className={`absolute top-20 left-4 bottom-4 w-[360px] sm:w-[380px] z-[900] transition-all duration-300 ease-in-out pointer-events-auto ${
          isSidebarCollapsed ? '-translate-x-[420px] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
      >
        <div className="w-full h-full bg-[#121318]/85 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          
          {/* Sidebar Top Bar */}
          <div className="p-4 sm:p-5 pb-3 border-b border-white/5 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Train className="w-4 h-4 text-zinc-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white tracking-tight">Active Trains</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">NDLS ➔ CNB Corridor</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  LIVE
                </span>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Collapse Sidebar"
                  className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Pill Input with Icon on Right (Matching reference design) */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search train or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-zinc-900/90 border border-white/10 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition shadow-inner"
              />
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>

            {/* Filter Chips Row (Matching reference "Show me:" pills) */}
            <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto pb-1">
              <span className="text-[11px] text-zinc-400 font-medium shrink-0">Show me:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'ontime', label: 'On Time' },
                { id: 'delayed', label: 'Delayed' },
                { id: 'premium', label: 'Vande Bharat' },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap active:scale-95 ${
                    activeFilter === pill.id
                      ? 'bg-zinc-700 text-white border border-zinc-500 shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-zinc-800'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable List of Trains (Circular Badges matching reference) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredTrains.map((train) => {
              const isSelected = selectedTrain?.train_number === train.train_number;
              const isDelayed = (train.current_delay_min || 0) > 5;
              const badgeStyle = getCategoryBadgeStyle(train.category, train.color);

              return (
                <div
                  key={train.train_number}
                  onClick={() => onSelectTrain(train.train_number)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-800/90 border-sky-500/80 shadow-xl ring-1 ring-sky-500/50'
                      : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/60 hover:border-white/10'
                  }`}
                >
                  {/* Left: 44px Circular Avatar matching Adidas/Nike/Puma circles */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center shadow-lg transition-transform duration-200"
                      style={{ backgroundColor: badgeStyle.bg, border: `2px solid ${badgeStyle.border}` }}
                    >
                      <Train className="w-5 h-5" style={{ color: badgeStyle.iconColor }} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{train.train_name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        <span className={isDelayed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {isDelayed ? `+${Math.round(train.current_delay_min)}m` : 'On Time'}
                        </span>
                        <span> • {train.current_speed_kmh} km/h • #{train.train_number}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Small compact pill matching [smiley 100] pill */}
                  <div className="shrink-0 text-right">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block shadow-sm ${
                      isDelayed 
                        ? 'bg-rose-950/70 text-rose-300 border-rose-500/40' 
                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {isDelayed ? `+${Math.round(train.current_delay_min)}m` : `✓ 0m`}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTrains.length === 0 && (
              <div className="p-8 text-center text-zinc-400 text-xs border border-dashed border-white/10 rounded-2xl">
                No trains match your search or filter.
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-zinc-950/70 border-t border-white/5 text-[11px] text-zinc-400 flex items-center justify-between shrink-0">
            <span>Corridor: <strong className="text-zinc-200 font-mono">NDLS ➔ CNB (440 km)</strong></span>
            <span className="font-mono text-sky-400">{filteredTrains.length} Trains</span>
          </div>

        </div>
      </div>

      {/* 4. FLOATING TOP-RIGHT TRACK DENSITY CARD (Glassmorphism Overlay) */}
      <div className="absolute top-20 right-4 z-[900] pointer-events-auto bg-[#121318]/85 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl text-xs space-y-2">
        <div className="font-semibold text-zinc-200 flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="text-[11px] uppercase tracking-wider text-zinc-300 font-mono font-bold">Track Density</span>
          <span className="text-[10px] font-mono text-zinc-500">NDLS➔CNB</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span>&lt;60% Clear</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
            <span>60-85% Caution</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            <span>&gt;85% Bottleneck</span>
          </div>
        </div>
        {disruptions.fog && (
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold pt-1 border-t border-white/10 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            <span>Dense Winter Fog Active (MPS 60 km/h)</span>
          </div>
        )}
      </div>

      {/* 5. FLOATING BOTTOM DRAWER (Selected Train Dynamic ETA & Explainable AI) */}
      {selectedTrain && (
        <div 
          className={`absolute bottom-4 z-[900] transition-all duration-300 pointer-events-auto ${
            isSidebarCollapsed ? 'left-4 right-4' : 'left-4 sm:left-[398px] right-4'
          }`}
        >
          <div className="bg-[#121318]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Drawer Header Summary Bar */}
            <div 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition gap-2"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow"
                  style={{ backgroundColor: getCategoryBadgeStyle(selectedTrain.category, selectedTrain.color).bg }}
                >
                  <Train className="w-4 h-4" style={{ color: getCategoryBadgeStyle(selectedTrain.category, selectedTrain.color).iconColor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs sm:text-sm text-white truncate">{selectedTrain.train_name}</span>
                    <span className="font-mono text-[11px] text-sky-400 font-bold">#{selectedTrain.train_number}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">
                    Speed: <span className="font-mono text-emerald-400 font-bold">{selectedTrain.current_speed_kmh} km/h</span>
                    <span> • </span>
                    Delay: <span className={`font-mono font-bold ${selectedTrain.current_delay_min > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedTrain.current_delay_min > 5 ? `+${Math.round(selectedTrain.current_delay_min)}m` : 'On Time'}
                    </span>
                    <span> • </span>
                    <span>{selectedTrain.current_status}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(!isDrawerOpen);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-semibold transition shadow-sm"
                >
                  <span>{isDrawerOpen ? 'Hide Schedule' : 'View Dynamic ETAs'}</span>
                  {isDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Slide-Up Expanded Schedule Table & Explainable AI */}
            {isDrawerOpen && (
              <div className="p-4 border-t border-white/10 space-y-3.5 max-h-[300px] overflow-y-auto">
                
                {/* Explainable AI Banner */}
                {selectedTrain.dynamic_etas?.length > 0 && selectedTrain.dynamic_etas[0].delay_reason && (
                  <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-sky-300 font-mono">
                        Explainable AI Delay Attribution (Ground Reality Analysis)
                      </h5>
                      <p className="text-xs text-zinc-200 mt-0.5">
                        {selectedTrain.dynamic_etas[0].delay_reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Downstream Stations Timetable */}
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-zinc-900/90 text-[10px] uppercase text-zinc-400 font-mono border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2.5">Station</th>
                        <th className="px-2 py-2.5">Platform</th>
                        <th className="px-2 py-2.5">Distance</th>
                        <th className="px-3 py-2.5">Scheduled</th>
                        <th className="px-3 py-2.5">NTES Baseline</th>
                        <th className="px-3 py-2.5 text-sky-400">Dynamic AI ETA</th>
                        <th className="px-3 py-2.5">90% Conf. Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedTrain.dynamic_etas?.map((eta) => (
                        <tr key={eta.station_code} className="hover:bg-white/5 transition">
                          <td className="px-3 py-2 font-medium text-white flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-sky-400" />
                            <span>{eta.station_name} ({eta.station_code})</span>
                          </td>
                          <td className="px-2 py-2 font-mono text-[11px]">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">
                              P{eta.platform}
                            </span>
                          </td>
                          <td className="px-2 py-2 font-mono text-[11px] text-zinc-400">
                            {eta.distance_km} km
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-zinc-400">
                            {eta.scheduled_arr}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-rose-300">
                            {eta.ntes_baseline_eta}
                            <span className="block text-[9px] text-zinc-500">+{Math.round(eta.ntes_baseline_delay_min)}m</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs font-bold text-sky-300">
                            {eta.dynamic_ml_eta}
                            <span className="block text-[9px] font-normal text-sky-400">
                              +{Math.round(eta.dynamic_ml_delay_min)}m
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-zinc-400">
                            {eta.confidence_interval}
                          </td>
                        </tr>
                      ))}

                      {(!selectedTrain.dynamic_etas || selectedTrain.dynamic_etas.length === 0) && (
                        <tr>
                          <td colSpan="7" className="px-3 py-4 text-center text-zinc-500 text-xs">
                            Train has arrived at terminal station.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
