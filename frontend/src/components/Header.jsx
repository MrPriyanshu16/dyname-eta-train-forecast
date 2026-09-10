import React from 'react';
import { Train, Radio, Play, Pause, FastForward, Activity, ShieldCheck } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  telemetry, 
  wsConnected,
  onTogglePlay,
  onChangeSpeed
}) {
  const isRunning = telemetry?.is_running ?? true;
  const simSpeed = telemetry?.sim_speed ?? 1.0;
  const timeStr = telemetry?.timestamp || '--:--:--';

  return (
    <header className="bg-rail-card border-b border-rail-border sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rail-accent/15 border border-rail-accent/30 rounded-lg text-rail-accent">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">Dynamic Rail ETA</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rail-accent/20 text-rail-accent border border-rail-accent/40">
                  SIH 26028
                </span>
              </div>
              <p className="text-xs text-rail-muted">Indian Railways Coaching Train Forecast System</p>
            </div>
          </div>

          {/* Simulation Time & Speed Controls */}
          <div className="hidden md:flex items-center space-x-4 bg-rail-bg px-4 py-1.5 rounded-lg border border-rail-border">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-rail-accent" />
              <span className="text-xs text-rail-muted">Sim Time:</span>
              <span className="font-mono text-sm font-semibold text-white tracking-wider">{timeStr}</span>
            </div>

            <div className="h-4 w-px bg-rail-border" />

            <button
              onClick={onTogglePlay}
              title={isRunning ? "Pause Telemetry Clock" : "Resume Telemetry Clock"}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center transition ${
                isRunning 
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center space-x-1">
              {[1.0, 2.0, 5.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition ${
                    simSpeed === spd
                      ? 'bg-rail-accent text-white font-bold'
                      : 'text-rail-muted hover:text-slate-200 hover:bg-rail-card'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              wsConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              <span>{wsConnected ? 'Live Feed' : 'Connecting...'}</span>
            </div>
          </div>

        </div>

        {/* View Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-rail-border/60 py-2 overflow-x-auto">
          {[
            { id: 'passenger', label: '👤 Passenger Portal' },
            { id: 'controller', label: '🚉 Control Room Hub' },
            { id: 'analytics', label: '📊 Model Analytics & Viva' },
            { id: 'about', label: 'ℹ️ About & Architecture' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rail-accent text-white shadow-sm font-semibold'
                  : 'text-rail-muted hover:text-white hover:bg-rail-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
