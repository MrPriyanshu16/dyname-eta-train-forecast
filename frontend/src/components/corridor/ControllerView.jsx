import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CloudFog, Signal, Construction, RotateCcw, CheckCircle, ArrowRight, Layers } from 'lucide-react';

export default function ControllerView({
  sections = [],
  disruptions = {},
  onInjectDisruption,
  onResetDisruptions,
  platformConflicts = [],
  trains = []
}) {
  const [reassignedPlatforms, setReassignedPlatforms] = useState({});

  const handleReassign = (conflictKey, newPlatform) => {
    setReassignedPlatforms(prev => ({ ...prev, [conflictKey]: newPlatform }));
  };

  return (
    <div className="space-y-6">

      {/* Top Banner: The What-If Disruption Sandbox */}
      <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rail-border">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Viva Sandbox
              </span>
              <h3 className="font-bold text-lg text-white">"What-If" Dynamic Disruption Simulator</h3>
            </div>
            <p className="text-xs text-rail-muted mt-1">
              Trigger real-world Indian Railways disruptions live and watch all downstream ETAs dynamically adjust.
            </p>
          </div>

          <button
            onClick={onResetDisruptions}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-rail-border text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rail-accent" />
            <span>Reset All Disruptions</span>
          </button>
        </div>

        {/* Disruption Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          
          {/* Button 1: Fog */}
          <button
            onClick={() => onInjectDisruption('fog')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              disruptions.fog
                ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md'
                : 'bg-rail-bg border-rail-border hover:border-amber-500/50 text-slate-300'
            }`}
          >
            <CloudFog className={`w-5 h-5 shrink-0 mt-0.5 ${disruptions.fog ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <span className="font-semibold text-sm block text-white">
                {disruptions.fog ? '● Fog Active (MPS 60 km/h)' : '🌫️ Inject Winter Fog'}
              </span>
              <span className="text-xs text-rail-muted mt-0.5 block">
                Simulates North Indian fog; caps corridor MPS to 60 km/h.
              </span>
            </div>
          </button>

          {/* Button 2: Signal Failure */}
          <button
            onClick={() => onInjectDisruption('signal_halt', '12004')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              disruptions.signal_halt_train
                ? 'bg-rose-500/15 border-rose-500 text-rose-200 shadow-md'
                : 'bg-rail-bg border-rail-border hover:border-rose-500/50 text-slate-300'
            }`}
          >
            <Signal className={`w-5 h-5 shrink-0 mt-0.5 ${disruptions.signal_halt_train ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <span className="font-semibold text-sm block text-white">
                {disruptions.signal_halt_train ? '● Signal Red on Train 12004' : '🔴 Signal Halt at Tundla'}
              </span>
              <span className="text-xs text-rail-muted mt-0.5 block">
                Forces red signal aspect; demonstrates queuing delays.
              </span>
            </div>
          </button>

          {/* Button 3: Track Maintenance Block */}
          <button
            onClick={() => onInjectDisruption('maintenance_block', 'SEC-3')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              disruptions.maintenance_section
                ? 'bg-orange-500/15 border-orange-500 text-orange-200 shadow-md'
                : 'bg-rail-bg border-rail-border hover:border-orange-500/50 text-slate-300'
            }`}
          >
            <Construction className={`w-5 h-5 shrink-0 mt-0.5 ${disruptions.maintenance_section ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <span className="font-semibold text-sm block text-white">
                {disruptions.maintenance_section ? '● Block on ALJN-HRS' : '🚧 Track Maintenance Block'}
              </span>
              <span className="text-xs text-rail-muted mt-0.5 block">
                Closes 1 track; cuts section capacity in half.
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* Two Column Layout: Section Congestion + Platform Conflict Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section Congestion Monitor */}
        <div className="lg:col-span-7 bg-rail-card border border-rail-border rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-rail-border">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-rail-accent" />
              <h4 className="font-bold text-base text-white">Corridor Section Congestion Monitor</h4>
            </div>
            <span className="text-xs font-mono text-rail-muted">6 Block Sections</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {sections.map((sec) => {
              const pct = Math.round(sec.occupancy_ratio * 100);
              let barColor = 'bg-emerald-500';
              let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
              
              if (sec.occupancy_ratio > 0.85) {
                barColor = 'bg-rose-500';
                badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
              } else if (sec.occupancy_ratio > 0.60) {
                barColor = 'bg-amber-500';
                badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              }

              return (
                <div key={sec.id} className="p-3 bg-rail-bg/60 border border-rail-border rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{sec.from} ➔ {sec.to} ({sec.length_km} km)</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${badgeColor}`}>
                      {sec.status} ({pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-rail-muted font-mono">
                    <span>Tracks: {sec.tracks} line | MPS: {sec.mps_kmh} km/h</span>
                    <span>Max Capacity: {sec.capacity_trains} trains</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Conflict & Allocation Advisor */}
        <div className="lg:col-span-5 bg-rail-card border border-rail-border rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rail-border">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-base text-white">Platform Allocation Advisor</h4>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rail-bg border border-rail-border text-rail-muted">
              Kanpur Central
            </span>
          </div>

          {platformConflicts.length > 0 ? (
            <div className="space-y-3">
              {platformConflicts.map((c, idx) => {
                const key = `${c.platform}-${c.train_1.train_number}-${c.train_2.train_number}`;
                const reassigned = reassignedPlatforms[key];

                return (
                  <div key={idx} className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-3">
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                          Schedule Clash Warning on Platform {c.platform}
                        </span>
                        <p className="text-xs text-slate-200 mt-1">
                          Train <strong className="text-white">#{c.train_1.train_number}</strong> (ETA {c.train_1.eta}) and Train <strong className="text-white">#{c.train_2.train_number}</strong> (ETA {c.train_2.eta}) arrive within {c.time_difference_min} minutes.
                        </p>
                      </div>
                    </div>

                    {reassigned ? (
                      <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>Reassigned Train #{c.train_2.train_number} to Platform {reassigned}. Conflict resolved!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReassign(key, 4)}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center justify-center space-x-1.5"
                      >
                        <span>⚡ Auto-Reassign Train #{c.train_2.train_number} to Platform 4</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-rail-muted bg-rail-bg/50 rounded-xl border border-dashed border-rail-border space-y-1.5">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-sm text-slate-200">No Platform Conflicts</p>
              <p className="text-xs">All scheduled and dynamic ETAs at Kanpur Central maintain safe platform buffer spacing (&gt;15 mins).</p>
            </div>
          )}

          {/* Train Priority Dispatch Hierarchy */}
          <div className="pt-2 border-t border-rail-border">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Signaling Priority Matrix (Section Dispatch)
            </h5>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-sky-950/40 border border-sky-800/40 flex items-center justify-between">
                <span className="font-semibold text-sky-200">Tier 1: Super Priority</span>
                <span className="font-mono text-sky-300">Vande Bharat / Rajdhani</span>
              </div>
              <div className="p-2 rounded bg-amber-950/30 border border-amber-800/30 flex items-center justify-between">
                <span className="font-semibold text-amber-200">Tier 2: High Priority</span>
                <span className="font-mono text-amber-300">Shatabdi Express</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/20 flex items-center justify-between">
                <span className="font-semibold text-emerald-200">Tier 3: Standard Superfast</span>
                <span className="font-mono text-emerald-300">Gorakhdham SF</span>
              </div>
              <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
                <span className="font-semibold text-slate-300">Tier 4: Mail / Freight</span>
                <span className="font-mono text-slate-400">Brahmaputra Mail</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
