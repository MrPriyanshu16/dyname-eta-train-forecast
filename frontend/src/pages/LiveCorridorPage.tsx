import React, { useState, useEffect, useRef } from 'react';
import CorridorMap from '../components/corridor/CorridorMap';
import ControllerView from '../components/corridor/ControllerView';
import AnalyticsView from '../components/corridor/AnalyticsView';
import AboutView from '../components/corridor/AboutView';
import {
  Layers,
  Sliders,
  BarChart3,
  Info,
  Play,
  Pause,
  FastForward,
  Wifi,
  WifiOff,
  RefreshCw,
  Radio,
  Cpu,
  MapPin
} from 'lucide-react';

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/telemetry";

export const LiveCorridorPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'controller' | 'analytics' | 'about'>('map');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('22436');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [backendOffline, setBackendOffline] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial REST fetch
  const fetchInitialData = () => {
    fetch(`${API_BASE}/api/stations`)
      .then(res => res.json())
      .then(data => {
        setStations(data);
        setBackendOffline(false);
      })
      .catch(() => setBackendOffline(true));

    fetch(`${API_BASE}/api/metrics`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(() => {});

    fetch(`${API_BASE}/api/state`)
      .then(res => res.json())
      .then(data => {
        setTelemetry(data);
        setBackendOffline(false);
      })
      .catch(() => setBackendOffline(true));
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Real-time WebSocket connection
  useEffect(() => {
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          setBackendOffline(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data);
          } catch (e) {
            console.error("Error parsing telemetry message:", e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Simulation Controls
  const handleTogglePlay = async () => {
    if (!telemetry) return;
    const nextState = !telemetry.is_running;
    try {
      await fetch(`${API_BASE}/api/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_running: nextState })
      });
      setTelemetry((prev: any) => prev ? ({ ...prev, is_running: nextState }) : prev);
    } catch (e) {
      console.error("Simulation toggle error:", e);
    }
  };

  const handleChangeSpeed = async (speed: number) => {
    try {
      await fetch(`${API_BASE}/api/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_multiplier: speed })
      });
      setTelemetry((prev: any) => prev ? ({ ...prev, speed_multiplier: speed }) : prev);
    } catch (e) {
      console.error("Simulation speed error:", e);
    }
  };

  const handleInjectDisruption = async (type: string, value: any = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/disruptions/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value })
      });
      const data = await res.json();
      if (data.disruptions) {
        setTelemetry((prev: any) => prev ? ({ ...prev, disruptions: data.disruptions }) : prev);
      }
    } catch (e) {
      console.error("Disruption inject error:", e);
    }
  };

  const handleResetDisruptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/disruptions/reset`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.disruptions) {
        setTelemetry((prev: any) => prev ? ({ ...prev, disruptions: data.disruptions }) : prev);
      }
    } catch (e) {
      console.error("Disruption reset error:", e);
    }
  };

  const currentTrains = telemetry?.trains || [];
  const currentSections = telemetry?.sections || [];
  const currentDisruptions = telemetry?.disruptions || {};
  const currentPlatformConflicts = telemetry?.platform_conflicts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / Telemetry Status */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                NDLS ➔ CNB 440 KM
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                SIH Problem Statement ID: 26028
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live Geospatial Corridor & ML Prediction Engine
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Real-time Indian Railways dynamic arrival forecasting benchmarked against static NTES heuristics.
            </p>
          </div>

          {/* Engine Status & Simulation Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Status Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              wsConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300'
            }`}>
              {wsConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>FastAPI Live Stream</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Backend Offline</span>
                </>
              )}
            </div>

            {/* Sim Play/Pause */}
            {telemetry && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                <button
                  onClick={handleTogglePlay}
                  title={telemetry.is_running ? "Pause Simulation" : "Resume Simulation"}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                >
                  {telemetry.is_running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </button>
                <button
                  onClick={() => handleChangeSpeed(telemetry.speed_multiplier === 5 ? 1 : 5)}
                  title="Toggle 5x Speed"
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                    telemetry.speed_multiplier > 1
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'
                  }`}
                >
                  {telemetry.speed_multiplier || 1}x
                </button>
              </div>
            )}

            <button
              onClick={fetchInitialData}
              title="Refresh telemetry"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Offline Warning banner if FastAPI isn't running */}
        {backendOffline && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">Notice:</span>
              <span>FastAPI backend is offline. Run <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono font-semibold">run_backend.bat</code> to connect live ML telemetry.</span>
            </div>
            <button
              onClick={fetchInitialData}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'map', label: 'Geospatial Corridor Map', icon: Layers },
            { id: 'controller', label: 'Control Room & Sandbox', icon: Sliders },
            { id: 'analytics', label: 'ML Benchmark Proof', icon: BarChart3 },
            { id: 'about', label: 'SIH Background & Team', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Views */}
      {activeSubTab === 'map' && (
        <div className="space-y-4">
          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-md">
            <CorridorMap
              stations={stations}
              sections={currentSections}
              trains={currentTrains}
              selectedTrainId={selectedTrainId}
              onSelectTrain={setSelectedTrainId}
              disruptions={currentDisruptions}
            />
          </div>

          {/* Quick Active Trains Strip below map */}
          {currentTrains.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentTrains.map((train: any) => {
                const isSelected = selectedTrainId === train.train_number;
                const isDelayed = (train.current_delay_min || 0) > 5;
                return (
                  <button
                    key={train.train_number}
                    onClick={() => setSelectedTrainId(train.train_number)}
                    className={`p-3.5 text-left rounded-xl border transition ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/20'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        #{train.train_number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isDelayed
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {isDelayed ? `+${Math.round(train.current_delay_min)}m Late` : 'On Time'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white mt-1 truncate">
                      {train.train_name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span>Speed: {Math.round(train.current_speed_kmh || 0)} km/h</span>
                      <span>Pos: {Math.round(train.current_km || 0)} km</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'controller' && (
        <ControllerView
          sections={currentSections}
          disruptions={currentDisruptions}
          onInjectDisruption={handleInjectDisruption}
          onResetDisruptions={handleResetDisruptions}
          platformConflicts={currentPlatformConflicts}
          trains={currentTrains}
        />
      )}

      {activeSubTab === 'analytics' && (
        <AnalyticsView metrics={metrics} />
      )}

      {activeSubTab === 'about' && (
        <AboutView />
      )}

    </div>
  );
};

export default LiveCorridorPage;
