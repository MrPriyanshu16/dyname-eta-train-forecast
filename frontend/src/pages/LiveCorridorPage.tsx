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
  MapPin,
  X,
  ChevronUp,
  ChevronDown,
  Train,
  Activity,
  ArrowRight
} from 'lucide-react';

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/telemetry";

export const LiveCorridorPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'controller' | 'analytics' | 'about'>('map');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('20978');
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

  // Escape key closes modal subtabs back to full-screen map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSubTab !== 'map') {
        setActiveSubTab('map');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab]);

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
    <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-[#070B14] select-none transition-colors">
      
      {/* 1. DOCKED TOP SUB-HEADER BAR (Directly beneath main navbar - Anchored, not floating) */}
      <div className="w-full h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-40 transition-colors shadow-2xs">
        
        {/* Left: Corridor Identification */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-400/30 flex items-center gap-1.5 shrink-0">
            <Train className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-mono text-xs font-extrabold text-sky-700 dark:text-sky-300">JP ➔ JU</span>
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
              Rajasthan Lifeline Corridor
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              412 km · Dynamic ML ETA Engine
            </span>
          </div>
        </div>

        {/* Center: View Switcher Tabs (Docked, NOT floating) */}
        <nav aria-label="Corridor Views" className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
          {[
            { id: 'map', label: 'Live Map', icon: Layers },
            { id: 'controller', label: 'Sandbox & Controls', icon: Sliders },
            { id: 'analytics', label: 'ML Proof', icon: BarChart3 },
            { id: 'about', label: 'About & Team', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Simulation Telemetry & Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Status Pill */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] font-bold ${
            wsConnected
              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}>
            {wsConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="hidden lg:inline font-mono">FastAPI Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="hidden lg:inline">Offline</span>
              </>
            )}
          </div>

          {/* Sim Play/Pause */}
          {telemetry && (
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleTogglePlay}
                title={telemetry.is_running ? "Pause Simulation" : "Resume Simulation"}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                {telemetry.is_running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
              <button
                onClick={() => handleChangeSpeed(telemetry.speed_multiplier === 5 ? 1 : 5)}
                title="Toggle 5x Speed Multiplier"
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  telemetry.speed_multiplier > 1
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {telemetry.speed_multiplier || 1}x
              </button>
            </div>
          )}

          <button
            onClick={fetchInitialData}
            title="Refresh Live Corridor State"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE CONTENT AREA */}
      <div className="flex-1 relative w-full overflow-hidden">
        {/* Layer A: Live Map View */}
        <div className={`w-full h-full relative ${activeSubTab === 'map' ? 'block' : 'hidden'}`}>
          <CorridorMap
            stations={stations}
            sections={currentSections}
            trains={currentTrains}
            selectedTrainId={selectedTrainId}
            onSelectTrain={setSelectedTrainId}
            disruptions={currentDisruptions}
          />
        </div>

        {/* Layer B: Dedicated Full-Page Dashboards (NO POPUPS) */}
        {activeSubTab !== 'map' && (
          <main className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-white transition-colors">
            <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
              {/* Dedicated View Header */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-400/30 flex items-center justify-center shrink-0">
                    {activeSubTab === 'controller' && <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                    {activeSubTab === 'analytics' && <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                    {activeSubTab === 'about' && <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                  </div>
                  <div>
                    <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeSubTab === 'controller' && 'Control Room & Disruption Sandbox'}
                      {activeSubTab === 'analytics' && 'ML Model Benchmark & Proof Engine'}
                      {activeSubTab === 'about' && 'SIH 26028 Background & Team'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeSubTab === 'controller' && 'Inject live track disruptions and simulate real-time controller intervention.'}
                      {activeSubTab === 'analytics' && 'Comparative accuracy evaluation: Dynamic XGBoost ML vs Static NTES Heuristics.'}
                      {activeSubTab === 'about' && 'Smart India Hackathon 2024 • Ministry of Railways Problem Statement 26028.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab('map')}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Switch to Live Map</span>
                </button>
              </div>

              {/* View Body Content */}
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
          </main>
        )}

        {/* Floating Backend Offline Alert */}
        {backendOffline && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[930] pointer-events-auto px-4 py-2 bg-amber-950 border border-amber-600 rounded-xl shadow-2xl text-amber-200 text-xs flex items-center gap-3 animate-bounce">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold">FastAPI backend is offline. Run <code className="px-1 py-0.5 bg-amber-900/60 rounded font-mono font-bold">run_backend.bat</code> for live ML streaming.</span>
            </div>
            <button
              onClick={fetchInitialData}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCorridorPage;
