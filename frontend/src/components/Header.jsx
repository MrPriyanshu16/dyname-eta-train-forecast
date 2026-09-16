import React from 'react';
import { Train, Radio, Play, Pause, Activity, User, Sliders, BarChart3, Info } from 'lucide-react';

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

  const navTabs = [
    { id: 'passenger', label: 'Passenger Portal', icon: User },
    { id: 'controller', label: 'Control Room Hub', icon: Sliders },
    { id: 'analytics', label: 'Model Analytics & Viva', icon: BarChart3 },
    { id: 'about', label: 'Architecture & Team', icon: Info },
  ];

  return (
    <header className="absolute top-3 left-3 right-3 z-[1000] max-w-7xl mx-auto pointer-events-none">
      <div className="bg-[#121318]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl px-3.5 sm:px-4 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pointer-events-auto">
        
        {/* Left: Logo & Project Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-zinc-900 shadow-md">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Dynamic Rail ETA</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                SIH 26028
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden xl:block">Indian Railways Coaching Train Forecast System</p>
          </div>
        </div>

        {/* Center: Simulation Time & Live Controls */}
        <div className="flex items-center space-x-3 bg-zinc-900/80 px-3 py-1 rounded-xl border border-white/5 shadow-inner self-start lg:self-auto">
          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs text-zinc-400">Sim Time:</span>
            <span className="font-mono text-xs font-bold text-zinc-100 tracking-wider">{timeStr}</span>
          </div>

          <div className="h-3.5 w-px bg-zinc-700/60" />

          <button
            onClick={onTogglePlay}
            title={isRunning ? "Pause Telemetry Clock" : "Resume Telemetry Clock"}
            className={`p-1 rounded-lg text-xs font-medium flex items-center transition ${
              isRunning 
                ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30' 
                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <div className="flex items-center space-x-1">
            {[1.0, 2.0, 5.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 text-[11px] font-mono rounded-md transition ${
                  simSpeed === spd
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-zinc-700/60" />

          {/* Real-time Status Badge */}
          <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            wsConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <Radio className={`w-3 h-3 ${wsConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span className="font-mono">{wsConnected ? 'Live' : 'Connecting'}</span>
          </div>
        </div>

        {/* Right: View Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-0.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20 shadow-sm font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
