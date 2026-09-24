import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Gauge,
  CloudFog,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Cpu,
  BarChart3
} from 'lucide-react';
import {
  checkMLBackendHealth,
  injectSimulatorDisruption,
  stepRTISSimulator,
  fetchModelMetrics,
  ModelMetricsResponse
} from '../../utils/mlApi';

interface SimulationDrawerProps {
  currentTrainId?: string;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({ currentTrainId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMLConnected, setIsMLConnected] = useState(false);
  const [activeDisruption, setActiveDisruption] = useState<string | null>(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [metricsData, setMetricsData] = useState<ModelMetricsResponse | null>(null);

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

  // Check ML backend connection on mount & drawer open
  useEffect(() => {
    async function checkHealth() {
      const ok = await checkMLBackendHealth();
      setIsMLConnected(ok);
      if (ok) {
        const metrics = await fetchModelMetrics();
        if (metrics) setMetricsData(metrics);
      }
    }
    checkHealth();
  }, [isOpen]);

  const handleScenarioSelect = (scenarioId: string, trainId: string) => {
    applyScenario(scenarioId);
    navigate(`/train/${trainId}`);
  };

  const handleDisruption = async (type: string, severity?: number) => {
    const res = await injectSimulatorDisruption(type, severity);
    if (res) {
      setActiveDisruption(res.active_disruption);
      // Also adjust local train delay to visually reflect disruption
      if (activeTrain) {
        if (type === 'FOG') updateTrainDelay(activeTrain.id, currentDelay + 25);
        if (type === 'SIGNAL_RED') updateTrainDelay(activeTrain.id, currentDelay + 15);
        if (type === 'MAINTENANCE') updateTrainDelay(activeTrain.id, currentDelay + 35);
        if (type === 'RESET') updateTrainDelay(activeTrain.id, 0);
      }
    }
  };

  const handleStepSimulator = async (minutes: number) => {
    advanceSimulatedTime(minutes);
    if (isMLConnected) {
      await stepRTISSimulator(minutes);
    }
  };

  return (
    <>
      {/* Floating trigger pill */}
      <aside aria-label="Demo Simulator Controls" className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all text-xs font-medium cursor-pointer group"
          title="Open Simulation & Demo Controls"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-white/90">{simulatedTime}</span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-1 text-white">
            <Sliders className="w-3.5 h-3.5 text-indigo-400 dark:text-sky-300" />
            <span className="hidden sm:inline">Transit Lab</span>
          </span>
          {isMLConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-1" title="ML Backend Connected" />
          )}
        </button>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 z-50 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col text-slate-900 dark:text-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Simulation Lab & ML Engine
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* ML Backend Connection Pill */}
          <div className="p-3 rounded-xl border flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {isMLConnected ? 'ML Engine Online (Port 8000)' : 'Local Simulation Fallback'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMLConnected ? 'XGBoost v1.0 · MAE 17.9m (vs NTES 76.6m)' : 'Start FastAPI backend for live predictions'}
                </div>
              </div>
            </div>
            {isMLConnected ? (
              <button
                onClick={() => setShowMetricsModal(true)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-sky-500/20 hover:bg-indigo-100 dark:hover:bg-sky-500/30 text-indigo-700 dark:text-sky-300 border border-indigo-200 dark:border-sky-400/30 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <BarChart3 className="w-3 h-3" /> Metrics
              </button>
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>

          {/* Real-time Disruption Sandbox */}
          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
                Live Disruption Sandbox (PS-26028)
              </span>
              {activeDisruption && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 animate-pulse">
                  {activeDisruption}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Inject real-world railway disruptions to observe the ML model dynamically recalculating the downstream station arrival forecast:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleDisruption('FOG', 0.85)}
                className="px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <CloudFog className="w-3.5 h-3.5 text-sky-500" />
                <span>Inject Dense Fog</span>
              </button>
              <button
                onClick={() => handleDisruption('SIGNAL_RED')}
                className="px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Inject Red Signal</span>
              </button>
              <button
                onClick={() => handleDisruption('MAINTENANCE')}
                className="px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Track Work Block</span>
              </button>
              <button
                onClick={() => handleDisruption('RESET')}
                className="px-2.5 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-400/30 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Clear Disruptions</span>
              </button>
            </div>
          </div>

          {/* Time controls */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                RTIS Replay Clock
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-sky-300 bg-indigo-50 dark:bg-sky-500/20 px-2 py-0.5 rounded border border-indigo-100 dark:border-sky-400/30">
                {simulatedTime}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleStepSimulator(5)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Play className="w-3 h-3 text-slate-500 dark:text-slate-400" /> +5 min
              </button>
              <button
                onClick={() => handleStepSimulator(15)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Play className="w-3 h-3 text-slate-500 dark:text-slate-400" /> +15 min
              </button>
              <button
                onClick={() => handleStepSimulator(60)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
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
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-indigo-500 dark:border-sky-400 bg-indigo-50/80 dark:bg-sky-500/20 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {scenario.name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
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
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
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
                Adjusting delay for <span className="font-semibold text-slate-700 dark:text-slate-200">{activeTrain.name} ({activeTrain.number})</span>.
              </p>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={currentDelay}
                onChange={e => updateTrainDelay(activeTrain.id, parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 dark:accent-sky-400 cursor-pointer"
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
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Simulation States to Default
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-between">
          <span>Backend: {isMLConnected ? 'Connected (FastAPI 8000)' : 'Offline'}</span>
          <span>SIH 2026 PS-26028</span>
        </div>
      </div>

      {/* Model Benchmark Metrics Modal */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                <h3 className="font-bold text-sm">
                  Model Evaluation & Scientific Benchmark
                </h3>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tested on <strong>5,850 unseen future trip observations</strong> across the Jaipur - Ajmer - Jodhpur (412 km) Rajasthan corridor under strict chronological separation:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="pb-2">Model / Baseline</th>
                    <th className="pb-2 text-right">MAE</th>
                    <th className="pb-2 text-right">RMSE</th>
                    <th className="pb-2 text-right">R²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Timetable Baseline</td>
                    <td className="py-2 text-right">64.66m</td>
                    <td className="py-2 text-right">90.58m</td>
                    <td className="py-2 text-right">0.693</td>
                  </tr>
                  <tr className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                    <td className="py-2 font-sans font-medium">NTES Delay Propagation</td>
                    <td className="py-2 text-right font-bold">76.62m</td>
                    <td className="py-2 text-right">97.11m</td>
                    <td className="py-2 text-right">0.647</td>
                  </tr>
                  <tr className="bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 font-bold">
                    <td className="py-2 font-sans flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      Dynamic XGBoost ML
                    </td>
                    <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">17.90m</td>
                    <td className="py-2 text-right">25.61m</td>
                    <td className="py-2 text-right">0.976</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
              🎯 <strong>76.6% Error Reduction:</strong> Dynamic ML achieves 17.90 minutes Mean Absolute Error compared to 76.62 minutes in the standard railway NTES baseline.
            </div>

            <button
              onClick={() => setShowMetricsModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close Benchmark
            </button>
          </div>
        </div>
      )}
    </>
  );
};
