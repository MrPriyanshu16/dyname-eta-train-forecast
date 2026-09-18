import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { DEMO_SCENARIOS } from '../../data/scenarios';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  X,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Gauge
} from 'lucide-react';

interface SimulationDrawerProps {
  currentTrainId?: string;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({ currentTrainId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    simulatedTime,
    advanceSimulatedTime,
    activeScenarioId,
    applyScenario,
    updateTrainDelay,
    getTrainById,
    resetToDefaults
  } = useSimulation();

  const navigate = useNavigate();

  const activeTrain = currentTrainId ? getTrainById(currentTrainId) : undefined;
  const currentDelay = activeTrain?.currentStatus.delayMinutes ?? 0;

  const handleScenarioSelect = (scenarioId: string, trainId: string) => {
    applyScenario(scenarioId);
    navigate(`/train/${trainId}`);
  };

  return (
    <>
      {/* Floating trigger pill */}
      <aside aria-label="Demo Simulator Controls" className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-700/60 dark:border-slate-600 text-xs font-medium cursor-pointer group"
          title="Open Simulation & Demo Controls"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-300">{simulatedTime}</span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-200 group-hover:text-white">
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Lab</span>
          </span>
        </button>
      </aside>

      {/* Slide-over panel backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Prototype Demo Lab</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulated dynamic engine · Client-side prototype
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Simulated Clock Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Simulated Clock
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                {simulatedTime}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => advanceSimulatedTime(5)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-slate-500 dark:text-slate-400" /> +5 min
              </button>
              <button
                onClick={() => advanceSimulatedTime(15)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-slate-500 dark:text-slate-400" /> +15 min
              </button>
              <button
                onClick={() => advanceSimulatedTime(60)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-slate-500 dark:text-slate-400" /> +1 hour
              </button>
            </div>
          </div>

          {/* Preset Demo Scenarios */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Verified Demo Scenarios (Requirements §21)
            </span>
            <div className="space-y-2">
              {DEMO_SCENARIOS.map(scenario => {
                const isCurrent = activeScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioSelect(scenario.id, scenario.trainId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {scenario.name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {scenario.description}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                      <span>Jump to train {scenario.trainId}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Train Delay Adjustment */}
          {activeTrain && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Live Delay Adjustment
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  {currentDelay} min delay
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjusting delay for <span className="font-semibold text-slate-700 dark:text-slate-200">{activeTrain.name} ({activeTrain.number})</span>. All timeline stations and ETA estimates update dynamically.
              </p>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={currentDelay}
                onChange={e => updateTrainDelay(activeTrain.id, parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0m (On-time)</span>
                <span>30m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-2">
            <button
              onClick={resetToDefaults}
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Simulation States to Default
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Prototype Mode · No external API or real railway telemetry
        </div>
      </div>
    </>
  );
};
