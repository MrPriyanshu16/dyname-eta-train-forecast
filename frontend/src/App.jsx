import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CorridorMap from './components/CorridorMap';
import PassengerView from './components/PassengerView';
import ControllerView from './components/ControllerView';
import AnalyticsView from './components/AnalyticsView';
import AboutView from './components/AboutView';
import { Map, Layers } from 'lucide-react';

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/telemetry";

export default function App() {
  const [activeTab, setActiveTab] = useState('passenger');
  const [telemetry, setTelemetry] = useState(null);
  const [stations, setStations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedTrainId, setSelectedTrainId] = useState('12004');
  const [wsConnected, setWsConnected] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const wsRef = useRef(null);

  // 1. Initial REST fetch for stations and metrics
  useEffect(() => {
    fetch(`${API_BASE}/api/stations`)
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(err => console.log("Stations fetch error:", err));

    fetch(`${API_BASE}/api/metrics`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.log("Metrics fetch error:", err));

    fetch(`${API_BASE}/api/state`)
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(err => console.log("Initial state fetch error:", err));
  }, []);

  // 2. Real-time WebSocket connection
  useEffect(() => {
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection established with telemetry stream.");
        setWsConnected(true);
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
        console.log("WebSocket disconnected. Retrying in 2 seconds...");
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
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
      setTelemetry(prev => prev ? ({ ...prev, is_running: nextState }) : prev);
    } catch (e) {
      console.error("Simulation toggle error:", e);
    }
  };

  const handleChangeSpeed = async (speed) => {
    try {
      await fetch(`${API_BASE}/api/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_multiplier: speed })
      });
      setTelemetry(prev => prev ? ({ ...prev, sim_speed: speed }) : prev);
    } catch (e) {
      console.error("Speed change error:", e);
    }
  };

  const handleInjectDisruption = async (type, value = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/disruptions/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value })
      });
      const data = await res.json();
      if (data.disruptions) {
        setTelemetry(prev => prev ? ({ ...prev, disruptions: data.disruptions }) : prev);
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
        setTelemetry(prev => prev ? ({ ...prev, disruptions: data.disruptions }) : prev);
      }
    } catch (e) {
      console.error("Disruption reset error:", e);
    }
  };

  const currentTrains = telemetry?.trains || [];
  const currentSections = telemetry?.sections || [];
  const currentSignals = telemetry?.signals || [];
  const currentNationwideRoutes = telemetry?.nationwide_routes || [];
  const currentNationwideStations = telemetry?.nationwide_stations || [];
  const currentDisruptions = telemetry?.disruptions || {};
  const currentPlatformConflicts = telemetry?.platform_conflicts || [];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-200">
      
      {/* Floating App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={telemetry}
        wsConnected={wsConnected}
        onTogglePlay={handleTogglePlay}
        onChangeSpeed={handleChangeSpeed}
      />

      {/* Main Content Area */}
      {activeTab === 'passenger' ? (
        <main className="relative w-full h-full flex-1 overflow-hidden">
          <PassengerView
            trains={currentTrains}
            selectedTrainId={selectedTrainId}
            onSelectTrain={setSelectedTrainId}
            stations={stations}
            sections={currentSections}
            signals={currentSignals}
            nationwideRoutes={currentNationwideRoutes}
            nationwideStations={currentNationwideStations}
            disruptions={currentDisruptions}
          />
        </main>
      ) : (
        <main className="relative w-full h-full flex-1 overflow-y-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          
          {/* Map View for Controller Tab */}
          {activeTab === 'controller' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Map className="w-4 h-4 text-sky-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 font-mono">
                    Live Geospatial Corridor Track (NDLS ➔ CNB 440 km)
                  </h3>
                </div>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 transition"
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {showMap && (
                <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <CorridorMap
                    stations={stations}
                    sections={currentSections}
                    trains={currentTrains}
                    selectedTrainId={selectedTrainId}
                    onSelectTrain={setSelectedTrainId}
                    disruptions={currentDisruptions}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'controller' && (
            <ControllerView
              sections={currentSections}
              disruptions={currentDisruptions}
              onInjectDisruption={handleInjectDisruption}
              onResetDisruptions={handleResetDisruptions}
              platformConflicts={currentPlatformConflicts}
              trains={currentTrains}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView metrics={metrics} />
          )}

          {activeTab === 'about' && (
            <AboutView />
          )}

          {/* Footer for Scrollable Tabs */}
          <footer className="border-t border-white/10 bg-[#121318]/80 backdrop-blur-md py-4 mt-8 text-center text-xs text-zinc-500 rounded-2xl">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-medium text-zinc-400">Smart India Hackathon (SIH 26028) • Dynamic Train ETA System</span>
              <span className="text-zinc-500">Developed by Priyanshu Prajapat & Keshav Solanki</span>
            </div>
          </footer>
        </main>
      )}

    </div>
  );
}
