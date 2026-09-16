import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Marker, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Focus, MapPin, Layers, Radio, Shield, Check } from 'lucide-react';

// Strict Pan-India Boundary limits (User cannot pan outside of India)
const INDIA_BOUNDS = [
  [6.5, 68.0],   // Southwest (Southern Tip / Arabian Sea)
  [36.5, 97.5]   // Northeast (Kashmir / Arunachal Pradesh)
];

const CORRIDOR_CENTER = [27.55, 78.75]; // Centered between Aligarh and Tundla
const DEFAULT_ZOOM = 8;

// Accurate Simplified Perimeter of India (Lat, Lng)
const INDIA_BORDER_COORDS = [
  [37.05, 74.50], [36.80, 75.80], [35.50, 77.20], [35.20, 78.80], [34.50, 79.50],
  [33.20, 79.20], [32.50, 78.80], [31.80, 78.60], [31.00, 79.20], [30.40, 80.30],
  [30.20, 81.00], [29.00, 80.10], [28.40, 81.10], [27.70, 82.20], [27.30, 83.50],
  [26.90, 85.00], [26.60, 86.50], [26.40, 88.10], [27.10, 88.20], [27.80, 88.10],
  [28.10, 88.70], [27.30, 88.90], [26.90, 89.80], [27.30, 91.50], [26.80, 92.10],
  [27.50, 92.60], [28.20, 94.20], [28.90, 95.50], [28.50, 97.20], [28.00, 97.40],
  [27.00, 96.50], [26.00, 95.20], [24.50, 94.50], [23.50, 93.30], [22.00, 93.00],
  [21.80, 92.30], [23.00, 91.80], [24.00, 91.20], [25.10, 91.80], [25.20, 89.90],
  [26.10, 89.80], [26.00, 88.50], [24.70, 88.20], [23.80, 88.80], [22.30, 89.00],
  [21.60, 87.50], [20.80, 86.90], [19.80, 85.80], [18.80, 84.50], [17.70, 83.30],
  [16.90, 82.30], [15.80, 80.30], [14.80, 80.10], [13.40, 80.30], [12.00, 79.80],
  [10.80, 79.85], [10.30, 79.30], [9.30, 79.20], [8.70, 78.10], [8.08, 77.55],
  [8.40, 76.95], [9.50, 76.30], [10.80, 75.90], [11.80, 75.35], [13.00, 74.80],
  [14.20, 74.40], [15.30, 73.80], [16.50, 73.30], [17.80, 73.10], [19.00, 72.80],
  [20.10, 72.85], [20.90, 72.70], [21.10, 72.60], [21.70, 70.20], [22.30, 68.90],
  [22.80, 69.20], [23.20, 68.50], [23.80, 68.20], [24.50, 68.90], [24.10, 70.80],
  [24.50, 71.40], [24.80, 71.10], [25.70, 70.30], [27.00, 70.10], [28.00, 71.50],
  [29.20, 72.50], [30.10, 73.80], [31.50, 74.60], [32.40, 74.80], [33.20, 74.10],
  [34.40, 74.10], [35.20, 74.60], [36.20, 74.20], [37.05, 74.50]
];

// Inverted World Polygon Ring covering the globe, with a hole carved out for India
const WORLD_MASK_COORDS = [
  // Outer Ring: Entire World
  [
    [85.0, -180.0],
    [85.0, 180.0],
    [-85.0, 180.0],
    [-85.0, -180.0]
  ],
  // Inner Hole: India only
  INDIA_BORDER_COORDS
];

// Yamuna River Corridor coordinates (matching faint river path in Reference Image 2)
const YAMUNA_RIVER_PATH = [
  [28.75, 77.20], [28.62, 77.28], [28.35, 77.52], [28.00, 77.68],
  [27.58, 77.68], [27.18, 78.04], [26.92, 78.45], [26.65, 78.95],
  [26.42, 79.50], [26.15, 80.15], [25.43, 81.85]
];

// Passing Loops & Bypass Sidings around major stations (matching dashed loop curves in Reference Image 2)
const STATION_PASSING_LOOPS = [
  {
    id: 'loop-aljn',
    name: 'Aligarh Goods Avoidance Line',
    positions: [[27.93, 78.06], [27.91, 78.12], [27.87, 78.11], [27.85, 78.07]]
  },
  {
    id: 'loop-hrs-tdl',
    name: 'Hathras - Tundla Chord Siding',
    positions: [[27.60, 78.05], [27.52, 78.15], [27.35, 78.18], [27.21, 78.24]]
  },
  {
    id: 'loop-etw',
    name: 'Etawah Bypass Loop',
    positions: [[26.80, 79.00], [26.78, 79.06], [26.75, 79.05], [26.73, 79.01]]
  },
  {
    id: 'loop-phd',
    name: 'Phaphund Freight Siding',
    positions: [[26.58, 79.44], [26.56, 79.49], [26.54, 79.47], [26.53, 79.43]]
  }
];

// Fallback Regional Railway Lines if telemetry nationwideRoutes is loading
const FALLBACK_REGIONAL_LINES = [
  {
    id: 'delhi-mathura-jhansi',
    name: 'Delhi - Agra - Jhansi Mainline',
    positions: [
      [28.61, 77.20], [28.40, 77.31], [28.14, 77.32], [27.79, 77.43],
      [27.49, 77.67], [27.15, 77.99], [26.70, 77.89], [26.50, 77.99],
      [26.21, 78.18], [25.44, 78.56]
    ]
  },
  {
    id: 'delhi-rewari-jaipur',
    name: 'Delhi - Jaipur Line',
    positions: [
      [28.61, 77.20], [28.45, 77.02], [28.19, 76.61], [27.56, 76.61],
      [27.05, 76.57], [26.89, 76.33], [26.92, 75.78]
    ]
  },
  {
    id: 'cnb-lucknow',
    name: 'Kanpur - Lucknow Chord',
    positions: [
      [26.45, 80.35], [26.54, 80.49], [26.81, 80.89], [26.83, 80.92]
    ]
  },
  {
    id: 'cnb-prayagraj-varanasi',
    name: 'Kanpur - Prayagraj - Varanasi Mainline',
    positions: [
      [26.45, 80.35], [26.05, 80.59], [25.92, 80.81], [25.65, 81.31],
      [25.43, 81.84], [25.14, 82.56], [25.28, 83.12]
    ]
  }
];

// Custom Train Marker Generator (Cyber HUD card + on-track badge matching Reference Image 2)
const createCyberTrainIcon = (train, isSelected, isCorridorZoom) => {
  const isDelayed = (train.current_delay_min || 0) > 5;
  const delayMin = Math.round(train.current_delay_min || 0);
  const speedKmh = Math.round(train.current_speed_kmh || 0);
  const locoClass = train.loco || 'WAP-7';
  const headingStr = train.heading || '118° SE';
  const trainNum = train.train_number;
  const trainName = (train.train_name || '').toUpperCase();

  if (isSelected && isCorridorZoom) {
    // SELECTED TRAIN AT CORRIDOR ZOOM: Full Cyber HUD Card (100% Image 2)
    const hudHtml = `
      <div class="relative pointer-events-auto cursor-pointer" style="width: 280px; height: 120px;">
        
        <!-- Directional Diamond Motion Cursor on the track -->
        <div class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
          <div class="w-6 h-6 rotate-45 border-2 border-cyan-400 bg-cyan-950/90 shadow-[0_0_15px_rgba(0,242,254,0.9)] flex items-center justify-center animate-pulse">
            <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <!-- Target Concentric Ripple Arc -->
          <div class="absolute w-12 h-12 rounded-full border border-cyan-400/40 animate-ping"></div>
        </div>

        <!-- Connecting Dotted Guide Line -->
        <div class="absolute left-1/2 bottom-3 w-0.5 h-7 border-l-2 border-dashed border-cyan-400 -translate-x-1/2 opacity-80"></div>

        <!-- Cyber HUD Card (Exact match to Reference Image 2) -->
        <div class="absolute top-0 left-0 right-0 p-3 rounded-2xl bg-[#070b12]/95 backdrop-blur-2xl border-2 border-[#00f2fe] shadow-[0_0_30px_rgba(0,242,254,0.35)] text-white space-y-2">
          
          <!-- Top Row: Train Name + Delay Badge -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,242,254,1)] shrink-0"></span>
              <span class="font-extrabold text-xs sm:text-sm tracking-wide text-white truncate font-mono">
                #${trainNum} ${trainName}
              </span>
            </div>
            
            <div class="shrink-0">
              <span class="px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                isDelayed 
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              }">
                ${isDelayed ? `+${delayMin}m DELAY` : `ON TIME`}
              </span>
            </div>
          </div>

          <!-- Bottom Row: Speed Box & Locomotive/Heading Box -->
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <div class="px-2.5 py-1 rounded-xl bg-zinc-950/90 border border-emerald-500/50 flex items-center justify-center">
              <span class="font-mono font-bold text-xs text-emerald-400 tracking-wider">
                ${speedKmh} km/h
              </span>
            </div>
            <div class="px-2.5 py-1 rounded-xl bg-zinc-950/90 border border-cyan-500/50 flex items-center justify-center">
              <span class="font-mono text-[10px] text-cyan-300 font-semibold tracking-tight truncate">
                ${headingStr} • ${locoClass}
              </span>
            </div>
          </div>

        </div>

      </div>
    `;

    return L.divIcon({
      html: hudHtml,
      className: 'cyber-selected-train-hud',
      iconSize: [280, 120],
      iconAnchor: [140, 110]
    });
  } else {
    // AT NATIONWIDE ZOOM OR NON-SELECTED: Sleek compact track pill
    const pillBorder = isSelected 
      ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.8)] ring-2 ring-cyan-400' 
      : (isDelayed ? 'border-rose-500/80 bg-rose-950/90 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'border-emerald-500/80 bg-emerald-950/90 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.6)]');
    
    const otherHtml = `
      <div class="group cursor-pointer pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 px-2.5 py-1 rounded-full border ${pillBorder} backdrop-blur-md text-[10px] font-mono font-bold whitespace-nowrap transition-transform hover:scale-125">
        <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-pulse' : (isDelayed ? 'bg-rose-400' : 'bg-emerald-400')}"></span>
        <span>#${trainNum}</span>
        ${isSelected ? `<span class="text-[9px] text-cyan-300 font-normal">(${speedKmh}k)</span>` : ''}
      </div>
    `;

    return L.divIcon({
      html: otherHtml,
      className: 'cyber-track-train-pill',
      iconSize: [80, 26],
      iconAnchor: [40, 13]
    });
  }
};

// Signal Aspect Marker Generator (Traffic Lights: S-48, S-94, S-142 [CAUTION], etc.)
const createSignalIcon = (signal) => {
  const aspect = (signal.aspect || signal.default_aspect || 'GREEN').toUpperCase();
  const isRed = aspect === 'RED';
  const isYellow = aspect === 'YELLOW';
  const isGreen = aspect === 'GREEN';

  let dotColor = '#10b981';
  let labelText = signal.name;
  let textColor = 'text-emerald-400';
  let glowColor = 'rgba(16,185,129,0.8)';

  if (isRed) {
    dotColor = '#ef4444';
    labelText = `${signal.name} [HALT]`;
    textColor = 'text-rose-400';
    glowColor = 'rgba(239,68,68,0.9)';
  } else if (isYellow) {
    dotColor = '#f59e0b';
    labelText = `${signal.name} [CAUTION]`;
    textColor = 'text-amber-300';
    glowColor = 'rgba(245,158,11,0.9)';
  }

  const signalHtml = `
    <div class="pointer-events-auto flex items-center space-x-1.5 -translate-x-2 -translate-y-2 cursor-pointer group">
      <!-- Signal Aspect Lamp -->
      <div class="relative w-3.5 h-3.5 rounded-full border border-black/60 shadow-[0_0_10px_${glowColor}] flex items-center justify-center shrink-0" style="background-color: ${dotColor};">
        ${!isGreen ? '<div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ' + dotColor + '"></div>' : ''}
      </div>
      <!-- Signal Monospace Label (matching S-142 [CAUTION] in Image 2) -->
      <span class="font-mono text-[9px] font-bold ${textColor} drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap opacity-90 group-hover:opacity-100 transition">
        ${labelText}
      </span>
    </div>
  `;

  return L.divIcon({
    html: signalHtml,
    className: 'cyber-rail-signal',
    iconSize: [90, 20],
    iconAnchor: [6, 10]
  });
};

// Station Marker Generator (Target Concentric Rings for Junctions + 2-line labels for smaller stations)
const createStationIcon = (station, isCorridorZoom) => {
  const isJunction = station.is_junction || station.tier === 1;
  const isTundla = station.code === 'TDL';

  if (isTundla && isCorridorZoom) {
    // TUNDLA JN: Signature concentric red/cyan target rings matching Reference Image 2
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <!-- Target Rings & Orbital Radar Sweep -->
        <div class="relative w-10 h-10 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-rose-500/80 animate-ping opacity-40"></div>
          <div class="w-7 h-7 rounded-full border-2 border-rose-400 bg-rose-950/40 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.7)]">
            <div class="w-3 h-3 rounded-full bg-rose-500"></div>
          </div>
          <!-- Dashed Orbital Arc -->
          <div class="absolute -inset-1 rounded-full border border-dashed border-cyan-400/50 animate-[spin_10s_linear_infinite]"></div>
        </div>

        <!-- Two-line Station Text below node -->
        <div class="mt-1 text-center whitespace-nowrap">
          <p class="font-bold text-xs text-rose-300 font-mono tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            TUNDLA JN (TDL)
          </p>
          <p class="text-[9px] font-mono text-cyan-300/90 drop-shadow">
            km ${station.km} • Platform Cleared: Pf_3
          </p>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-tundla-marker',
      iconSize: [160, 60],
      iconAnchor: [80, 20]
    });
  } else if (isJunction) {
    // Major Junction (NDLS, GZB, ALJN, ETW, CNB)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <!-- Glowing Double Ring Circle -->
        <div class="w-5 h-5 rounded-full border-2 border-cyan-400 bg-zinc-950 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-transform group-hover:scale-125">
          <div class="w-2 h-2 rounded-full bg-cyan-300"></div>
        </div>
        <!-- Monospace Tag -->
        <div class="mt-1 text-center whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
          <span class="font-bold text-[10px] font-mono text-white block">${station.code}</span>
          ${isCorridorZoom ? `<span class="text-[8px] font-mono text-zinc-400 block">km ${station.km}</span>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-major-marker',
      iconSize: [70, 45],
      iconAnchor: [35, 10]
    });
  } else {
    // Intermediate / Small Stations (HRS km 157, PHD km 355, SKB, RURA)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <!-- Crisp Circular Node with dark center and cyan ring -->
        <div class="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 bg-zinc-950 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.7)] group-hover:scale-125 transition">
          <div class="w-1 h-1 rounded-full bg-emerald-400"></div>
        </div>
        <!-- 2-Line Monospace Label matching Reference Image 2 (HRS / km 157) -->
        <div class="mt-0.5 text-center whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
          <span class="font-bold text-[9px] font-mono text-emerald-300 block">${station.code}</span>
          <span class="text-[8px] font-mono text-zinc-400 block">km ${station.km}</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-small-marker',
      iconSize: [50, 35],
      iconAnchor: [25, 7]
    });
  }
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

function MapZoomTracker({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
}

export default function CorridorMap({ 
  stations = [], 
  sections = [], 
  trains = [], 
  signals = [],
  nationwideRoutes = [],
  nationwideStations = [],
  selectedTrainId, 
  onSelectTrain,
  disruptions = {},
  hideInternalHeader = false
}) {
  const [mapCenterState, setMapCenterState] = useState(CORRIDOR_CENTER);
  const [mapZoomState, setMapZoomState] = useState(DEFAULT_ZOOM);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  const isCorridorZoom = currentZoom >= 7;

  // Layer Toggles matching Reference Image 2 top-left layer control
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [layersConfig, setLayersConfig] = useState({
    signals: true,
    smallStations: true,
    nationwide: true,
    river: true,
    loops: true,
    mask: true
  });

  const toggleLayer = (key) => {
    setLayersConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build coordinate lines for each section
  const sectionPolylines = useMemo(() => {
    if (!stations.length || !sections.length) return [];
    
    const stationMap = new Map(stations.map(s => [s.code, s]));
    
    return sections.map(sec => {
      const sFrom = stationMap.get(sec.from);
      const sTo = stationMap.get(sec.to);
      if (!sFrom || !sTo) return null;

      let color = "#10B981"; // Clear Green
      let isBottleneck = false;

      if (sec.occupancy_ratio > 0.85) {
        color = "#EF4444"; // Congested Red
        isBottleneck = true;
      } else if (sec.occupancy_ratio > 0.60) {
        color = "#F59E0B"; // Caution Amber
      }

      if (disruptions.maintenance_section === sec.id) {
        color = "#F97316"; // Orange for track maintenance
        isBottleneck = true;
      }

      // Midpoint coordinate for floating contention pill
      const midLat = (sFrom.lat + sTo.lat) / 2;
      const midLng = (sFrom.lng + sTo.lng) / 2;

      return {
        id: sec.id,
        from: sFrom.name,
        to: sTo.name,
        positions: [
          [sFrom.lat, sFrom.lng],
          [sTo.lat, sTo.lng]
        ],
        midpoint: [midLat, midLng],
        color,
        isBottleneck,
        occupancy: sec.occupancy_ratio,
        status: sec.status
      };
    }).filter(Boolean);
  }, [stations, sections, disruptions]);

  const handleResetCorridor = () => {
    setMapCenterState([...CORRIDOR_CENTER]);
    setMapZoomState(DEFAULT_ZOOM);
    setCurrentZoom(DEFAULT_ZOOM);
  };

  const handleZoomAllIndia = () => {
    setMapCenterState([22.5, 79.5]);
    setMapZoomState(5);
    setCurrentZoom(5);
  };

  const allNationwideTracks = nationwideRoutes && nationwideRoutes.length > 0 ? nationwideRoutes : FALLBACK_REGIONAL_LINES;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b12] select-none font-sans">
      
      {/* 1. LAYER TOGGLE BUTTON (Matching Reference Image 2 Top-Left Layer Icon) */}
      <div className="absolute top-20 left-4 z-[950] pointer-events-auto">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          title="Map Layer Controls"
          className="w-10 h-10 rounded-2xl bg-[#121318]/90 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/50 flex items-center justify-center text-zinc-300 hover:text-cyan-400 shadow-2xl transition active:scale-95"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Dropdown Layer Menu */}
        {showLayerMenu && (
          <div className="mt-2 w-64 p-3.5 rounded-2xl bg-[#121318]/95 backdrop-blur-2xl border border-white/10 shadow-2xl text-xs space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span>Display Layers</span>
              <span className="text-cyan-400 font-normal">Active</span>
            </div>

            {[
              { id: 'mask', label: 'Blackout Foreign Countries (India Only)' },
              { id: 'signals', label: 'Traffic Signals (ABS 🟢🟡🔴)' },
              { id: 'smallStations', label: 'Intermediate Stations' },
              { id: 'nationwide', label: 'All-India Rail Network' },
              { id: 'loops', label: 'Passing Siding Loops' },
              { id: 'river', label: 'Yamuna River Corridor' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => toggleLayer(item.id)}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition text-zinc-200"
              >
                <span>{item.label}</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                  layersConfig[item.id] ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-zinc-700 bg-zinc-900'
                }`}>
                  {layersConfig[item.id] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. FLOATING RIGHT CONTROLS: Focus Corridor & All-India Quick Buttons */}
      <div className="absolute top-[256px] right-4 z-[900] pointer-events-auto space-y-2 flex flex-col items-end">
        <button
          onClick={handleResetCorridor}
          title="Focus on NDLS - CNB Corridor"
          className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-[#121318]/90 backdrop-blur-2xl text-zinc-200 hover:text-white border border-white/10 hover:border-cyan-400/40 text-xs font-semibold shadow-2xl transition active:scale-95"
        >
          <Focus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Focus Corridor</span>
        </button>

        <button
          onClick={handleZoomAllIndia}
          title="View All-India Rail Network"
          className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-[#121318]/90 backdrop-blur-2xl text-zinc-200 hover:text-white border border-white/10 hover:border-cyan-400/40 text-xs font-semibold shadow-2xl transition active:scale-95"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">All-India View</span>
        </button>
      </div>

      {/* 3. THE LEAFLET MAP CANVAS */}
      <MapContainer
        center={CORRIDOR_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={14}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#070b12' }}
        attributionControl={false}
      >
        <ZoomControl position="topright" />
        <ChangeMapView center={mapCenterState} zoom={mapZoomState} />
        <MapZoomTracker onZoomChange={setCurrentZoom} />

        {/* Clean Matte-Black Base Canvas (Image 1: No Watermarks, Dark Charcoal Street/City Cartography) */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {/* Subtle Labels Overlay */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          opacity={0.65}
        />

        {/* 4. BLACKOUT MASK FOR ALL FOREIGN COUNTRIES (Hides Pakistan, China, Middle East, etc.) */}
        {layersConfig.mask && (
          <Polygon
            positions={WORLD_MASK_COORDS}
            pathOptions={{
              fillColor: '#070b12',
              fillOpacity: 0.99,
              color: '#38bdf8',
              weight: 1.5,
              opacity: 0.6
            }}
          />
        )}

        {/* 5. YAMUNA RIVER CORRIDOR (Faint Blue/Teal Path matching Reference Image 2) */}
        {layersConfig.river && (
          <Polyline
            positions={YAMUNA_RIVER_PATH}
            pathOptions={{
              color: '#0d2836',
              weight: 18,
              opacity: 0.5,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-cyan-400">
                🌊 YAMUNA RIVER CORRIDOR
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* 6. NATIONWIDE ALL-INDIA TRUNK RAILWAY NETWORK (Golden Quadrilateral & Diagonals) */}
        {layersConfig.nationwide && allNationwideTracks.map((trk) => (
          <Polyline
            key={`route-${trk.id}`}
            positions={trk.positions}
            pathOptions={{
              color: '#2a2e3b',
              weight: 2,
              opacity: 0.75,
              dashArray: '3, 5'
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-zinc-300">
                🚆 {trk.name}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* 7. PASSING LOOPS & BYPASS TRACKS (Dashed curves matching Reference Image 2) */}
        {layersConfig.loops && STATION_PASSING_LOOPS.map((loop) => (
          <Polyline
            key={loop.id}
            positions={loop.positions}
            pathOptions={{
              color: '#00f2fe',
              weight: 2,
              opacity: 0.45,
              dashArray: '4, 6'
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-cyan-300">
                🔀 {loop.name}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* 8. OUTER NEON GLOW FOR ACTIVE NDLS-CNB CORRIDOR */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={`glow-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: isCorridorZoom ? 10 : 6,
              opacity: 0.35,
            }}
          />
        ))}

        {/* 9. FOREGROUND CRISP NEON RAILWAY TRACK */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: isCorridorZoom ? 4 : 3,
              opacity: 0.98,
              dashArray: line.status === 'CONGESTED' ? '6, 6' : undefined
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-sans p-1">
                <p className="font-bold text-white">{line.from} ➔ {line.to}</p>
                <p className="text-zinc-400">Occupancy: <span className="font-mono text-zinc-200">{Math.round(line.occupancy * 100)}%</span> ({line.status})</p>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* 10. BOTTLENECK / CONTENTION FLOATING BADGE (Visible at corridor zoom) */}
        {isCorridorZoom && sectionPolylines.filter(l => l.isBottleneck).map((line) => (
          <Marker
            key={`contention-${line.id}`}
            position={line.midpoint}
            icon={L.divIcon({
              html: `
                <div class="pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/90 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] text-white whitespace-nowrap animate-pulse">
                  <span class="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span class="font-mono text-[9px] font-bold tracking-wider uppercase text-rose-200">
                    INTERLOCK CAPACITY CONTENTION
                  </span>
                </div>
              `,
              className: 'contention-badge',
              iconSize: [220, 24],
              iconAnchor: [110, 12]
            })}
          />
        ))}

        {/* 11. TRAIN TRAFFIC LIGHTS / AUTOMATIC BLOCK SIGNALS (Visible at corridor zoom) */}
        {layersConfig.signals && isCorridorZoom && signals.map((sig) => (
          <Marker
            key={`sig-${sig.id}`}
            position={[sig.lat, sig.lng]}
            icon={createSignalIcon(sig)}
          >
            <Tooltip>
              <div className="text-[10px] font-mono text-white p-1">
                🚦 Signal {sig.name} • Aspect: <strong className="uppercase">{sig.aspect}</strong> (KM {sig.km})
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 12. STATIONS: BIG & SMALL HIERARCHY */}
        {stations.map((st) => {
          // At nationwide zoom, show only major junctions to avoid text clumping
          if (!isCorridorZoom && !st.is_junction && st.tier !== 1) return null;
          // If small stations toggled off in layer menu, show only junctions
          if (!layersConfig.smallStations && !st.is_junction && st.tier !== 1) return null;

          return (
            <Marker
              key={`st-${st.code}`}
              position={[st.lat, st.lng]}
              icon={createStationIcon(st, isCorridorZoom)}
            >
              <Popup>
                <div className="p-1.5 font-sans text-xs space-y-1.5">
                  <p className="font-bold text-sm text-white flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{st.name} ({st.code})</span>
                  </p>
                  <p className="text-zinc-400">Corridor KM: <span className="font-mono text-zinc-200">{st.km} km</span></p>
                  <p className="text-zinc-400">Platforms: <span className="font-mono text-zinc-200">{st.platforms}</span></p>
                  <p className="text-cyan-400/90 text-[11px] pt-1 border-t border-zinc-800">
                    {st.is_junction || st.tier === 1 ? '★ Major Junction Hub' : 'Intermediate Block Post'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 13. NATIONWIDE HUB STATIONS (Visible at nationwide zoom level) */}
        {layersConfig.nationwide && (nationwideStations || []).map((hub) => (
          <CircleMarker
            key={`hub-${hub.code}`}
            center={[hub.lat, hub.lng]}
            radius={isCorridorZoom ? 3 : 4.5}
            pathOptions={{
              fillColor: '#070b12',
              color: '#38bdf8',
              weight: 1.5,
              fillOpacity: 1
            }}
          >
            <Tooltip direction="top">
              <span className="font-mono text-[9px] font-bold text-zinc-300 bg-zinc-950/95 border border-zinc-800 px-1.5 py-0.5 rounded shadow">
                {hub.name} ({hub.code})
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* 14. LIVE COACHING TRAINS */}
        {trains.map((train) => {
          const isSelected = selectedTrainId === train.train_number;
          return (
            <Marker
              key={`trn-${train.train_number}`}
              position={[train.lat, train.lng]}
              icon={createCyberTrainIcon(train, isSelected, isCorridorZoom)}
              eventHandlers={{
                click: () => onSelectTrain(train.train_number)
              }}
            >
              <Popup>
                <div className="p-2 font-sans text-xs space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                    <div>
                      <h4 className="font-bold text-sm text-white">{train.train_name}</h4>
                      <span className="font-mono text-[11px] text-zinc-400">#{train.train_number} • {train.category}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-zinc-300 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Speed</span>
                      <span className="font-mono font-bold text-emerald-400">{train.current_speed_kmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Loco & Heading</span>
                      <span className="font-mono font-bold text-cyan-400">{train.loco || 'WAP-7'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectTrain(train.train_number)}
                    className="w-full mt-2 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-center transition text-xs shadow-md"
                  >
                    Track Live In HUD
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
