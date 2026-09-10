import React, { useState, useMemo } from 'react';
import { Search, Train, Clock, AlertCircle, CheckCircle2, ChevronRight, Gauge, Info, Sparkles, MapPin } from 'lucide-react';

export default function PassengerView({ 
  trains = [], 
  selectedTrainId, 
  onSelectTrain,
  stations = []
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trains based on search input
  const filteredTrains = useMemo(() => {
    return trains.filter(t => 
      t.train_number.includes(searchQuery) ||
      t.train_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trains, searchQuery]);

  const selectedTrain = useMemo(() => {
    return trains.find(t => t.train_number === selectedTrainId) || trains[0] || null;
  }, [trains, selectedTrainId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Sidebar: Train Search & Train List */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-rail-muted" />
          <input
            type="text"
            placeholder="Search train (e.g. 12004, Rajdhani)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-rail-card border border-rail-border rounded-xl text-sm text-slate-100 placeholder-rail-muted focus:outline-none focus:border-rail-accent focus:ring-1 focus:ring-rail-accent shadow-sm"
          />
        </div>

        {/* Active Trains List */}
        <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
          {filteredTrains.map((train) => {
            const isSelected = selectedTrain?.train_number === train.train_number;
            const isDelayed = train.current_delay_min > 5;

            return (
              <div
                key={train.train_number}
                onClick={() => onSelectTrain(train.train_number)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rail-card border-rail-accent shadow-md shadow-sky-900/20 ring-1 ring-rail-accent'
                    : 'bg-rail-card/70 border-rail-border hover:border-slate-500 hover:bg-rail-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm"
                      style={{ backgroundColor: train.color || '#0284c7' }}
                    >
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">{train.train_name}</h4>
                      <p className="font-mono text-xs text-rail-muted">#{train.train_number} • {train.category}</p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                    isDelayed 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isDelayed ? `+${Math.round(train.current_delay_min)}m` : 'On Time'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-rail-border/60 flex items-center justify-between text-xs text-rail-muted">
                  <span className="flex items-center space-x-1">
                    <Gauge className="w-3.5 h-3.5 text-rail-accent" />
                    <span className="font-mono text-slate-200">{train.current_speed_kmh} km/h</span>
                  </span>
                  <span className="truncate max-w-[170px] text-right font-medium text-slate-300">
                    {train.current_status}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredTrains.length === 0 && (
            <div className="p-8 text-center text-rail-muted text-sm border border-dashed border-rail-border rounded-xl">
              No trains found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Selected Train Dynamic Forecast Details */}
      <div className="lg:col-span-8 space-y-6">
        {selectedTrain ? (
          <>
            {/* Train Overview Banner */}
            <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rail-border">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span 
                      className="px-2 py-0.5 text-xs font-mono font-bold rounded text-white shadow-sm"
                      style={{ backgroundColor: selectedTrain.color }}
                    >
                      {selectedTrain.category}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedTrain.train_name}</h2>
                    <span className="font-mono text-sm text-rail-accent font-semibold">#{selectedTrain.train_number}</span>
                  </div>
                  <p className="text-xs text-rail-muted mt-1 flex items-center space-x-2">
                    <span>Priority Class {selectedTrain.priority_tier}</span>
                    <span>•</span>
                    <span>Corridor Position: {Math.round(selectedTrain.current_km)} km from NDLS</span>
                  </p>
                </div>

                {/* Speed & Live Status */}
                <div className="flex items-center space-x-4 bg-rail-bg/80 px-4 py-2 rounded-lg border border-rail-border">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-rail-muted block">Live Speed</span>
                    <span className="font-mono text-base font-bold text-emerald-400">{selectedTrain.current_speed_kmh} km/h</span>
                  </div>
                  <div className="h-6 w-px bg-rail-border" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-rail-muted block">Accumulated Delay</span>
                    <span className="font-mono text-base font-bold text-rose-400">+{Math.round(selectedTrain.current_delay_min)} min</span>
                  </div>
                </div>
              </div>

              {/* Explainable AI Delay Attribution Card */}
              {selectedTrain.dynamic_etas?.length > 0 && (
                <div className="mt-4 p-3.5 bg-sky-950/40 border border-sky-800/50 rounded-lg flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                      Explainable AI Delay Attribution (Why is this train delayed?)
                    </h5>
                    <p className="text-sm text-slate-200 mt-0.5">
                      {selectedTrain.dynamic_etas[0].delay_reason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Downstream Stations ETA Forecast Table */}
            <div className="bg-rail-card border border-rail-border rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-rail-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">Dynamic Downstream Arrival Forecasts</h3>
                  <p className="text-xs text-rail-muted">Comparing static timetable vs. official NTES vs. Dynamic ML Model</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Auto-updated live
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-rail-bg/70 text-xs uppercase text-rail-muted font-mono tracking-wider border-b border-rail-border">
                    <tr>
                      <th className="px-4 py-3">Station</th>
                      <th className="px-3 py-3">Platform</th>
                      <th className="px-3 py-3">Distance</th>
                      <th className="px-4 py-3">Scheduled</th>
                      <th className="px-4 py-3">NTES Baseline</th>
                      <th className="px-4 py-3 text-sky-400">Dynamic AI ETA</th>
                      <th className="px-4 py-3">90% Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rail-border/60">
                    {selectedTrain.dynamic_etas?.map((eta, idx) => {
                      const isSignificantDiff = Math.abs(eta.dynamic_ml_delay_min - eta.ntes_baseline_delay_min) > 5;

                      return (
                        <tr key={eta.station_code} className="hover:bg-rail-bg/40 transition">
                          <td className="px-4 py-3.5 font-medium text-white flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-rail-accent" />
                            <span>{eta.station_name} ({eta.station_code})</span>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                              P{eta.platform}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-rail-muted">
                            {eta.distance_km} km
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                            {eta.scheduled_arr}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-rose-300">
                            {eta.ntes_baseline_eta}
                            <span className="block text-[10px] text-rail-muted">+{Math.round(eta.ntes_baseline_delay_min)}m</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-sm font-bold text-sky-300">
                            {eta.dynamic_ml_eta}
                            <span className="block text-[10px] font-normal text-sky-400">
                              +{Math.round(eta.dynamic_ml_delay_min)}m delay
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-rail-bg border border-rail-border text-[11px]">
                              {eta.confidence_interval}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {(!selectedTrain.dynamic_etas || selectedTrain.dynamic_etas.length === 0) && (
                      <tr>
                        <td colSpan="7" className="px-4 py-6 text-center text-rail-muted text-sm">
                          Train has reached the terminal station (Kanpur Central).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-rail-muted bg-rail-card rounded-xl border border-rail-border">
            Select a train from the list to view live tracking and dynamic arrival forecasts.
          </div>
        )}
      </div>

    </div>
  );
}
