import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Focus, MapPin, Compass, Layers, Radio } from 'lucide-react';

// Strict Corridor boundary limits (Delhi to Kanpur corridor focus)
const CORRIDOR_BOUNDS = [
  [25.0, 75.5],   // Southwest (Agra / Gwalior sector)
  [30.0, 82.0]    // Northeast (Bareilly / Lucknow sector)
];

const CORRIDOR_CENTER = [27.55, 78.75]; // Centered between Aligarh and Tundla
const DEFAULT_ZOOM = 8;

// Soft Powder-Blue River Corridor (Matching river curve in RailSync reference image)
const YAMUNA_RIVER_PATH = [
  [28.75, 77.20], [28.62, 77.28], [28.35, 77.52], [28.00, 77.68],
  [27.58, 77.68], [27.18, 78.04], [26.92, 78.45], [26.65, 78.95],
  [26.42, 79.50], [26.15, 80.15], [25.43, 81.85]
];

// Secondary Commuter Rail Network (Emerald Green line in RailSync reference)
const COMMUTER_RAIL_LINES = [
  {
    id: 'commuter-delhi-jaipur',
    name: 'Commuter 201 • Delhi-Rewari-Jaipur',
    color: '#10B981', // Emerald Green
    positions: [
      [28.61, 77.20], [28.45, 77.02], [28.19, 76.61], [27.56, 76.61],
      [27.05, 76.57], [26.89, 76.33], [26.92, 75.78]
    ]
  },
  {
    id: 'commuter-kanpur-lucknow',
    name: 'Commuter 304 • Kanpur-Lucknow Chord',
    color: '#10B981', // Emerald Green
    positions: [
      [26.45, 80.35], [26.54, 80.49], [26.81, 80.89], [26.83, 80.92]
    ]
  },
  {
    id: 'commuter-delhi-meerut',
    name: 'Commuter 108 • Delhi-Meerut RapidX',
    color: '#10B981',
    positions: [
      [28.61, 77.20], [28.66, 77.43], [28.83, 77.58], [28.98, 77.70]
    ]
  }
];

// Orbital Metro Loop around Central Hub (Purple dashed ring in RailSync reference)
const ORBITAL_METRO_LOOP = [
  {
    id: 'skyrail-orbital-loop',
    name: 'SkyRail Metro Orbital • Loop 1',
    positions: [
      [27.35, 78.10], [27.38, 78.25], [27.32, 78.42], [27.18, 78.48],
      [27.08, 78.36], [27.06, 78.18], [27.15, 78.04], [27.28, 78.02],
      [27.35, 78.10]
    ]
  }
];

// Parallel Dashed Station Loop Sidings (From cyber-tactical snippet)
const STATION_LOOP_SIDINGS = [
  {
    id: 'loop-aljn',
    name: 'ALJN Passenger Siding Loop',
    positions: [
      [27.912, 78.070],
      [27.897, 78.094],
      [27.880, 78.110]
    ],
    color: '#00F0FF'
  },
  {
    id: 'loop-tdl',
    name: 'TDL Intermodal Bypass Siding',
    positions: [
      [27.228, 78.218],
      [27.208, 78.252],
      [27.185, 78.275]
    ],
    color: '#F59E0B'
  },
  {
    id: 'loop-etw',
    name: 'ETW Freight Siding Loop',
    positions: [
      [26.790, 79.010],
      [26.772, 79.042],
      [26.755, 79.060]
    ],
    color: '#10B981'
  }
];

// Corridor Automatic Block Signals (Matching ml/corridor_data.py and snippet aspect markers)
const CORRIDOR_SIGNALS = [
  { id: 'S-25', name: 'S-25', km: 25.0, lat: 28.6670, lng: 77.4280, sectionId: 'SEC-1', aspect: 'CLR' },
  { id: 'S-48', name: 'S-48', km: 48.0, lat: 28.5120, lng: 77.5850, sectionId: 'SEC-2', aspect: 'CLR' },
  { id: 'S-94', name: 'S-94', km: 94.0, lat: 28.1830, lng: 77.8500, sectionId: 'SEC-2', aspect: 'CLR' },
  { id: 'S-126', name: 'S-126', km: 126.0, lat: 27.8970, lng: 78.0850, sectionId: 'SEC-2', aspect: 'CLR' },
  { id: 'S-142', name: 'S-142', km: 142.0, lat: 27.7550, lng: 78.0720, sectionId: 'SEC-3', aspect: 'CAUTION' },
  { id: 'S-180', name: 'S-180', km: 180.0, lat: 27.4250, lng: 78.1400, sectionId: 'SEC-4', aspect: 'CLR' },
  { id: 'S-204', name: 'S-204', km: 204.0, lat: 27.2080, lng: 78.2350, sectionId: 'SEC-4', aspect: 'HOLD' },
  { id: 'S-218', name: 'S-218', km: 218.0, lat: 27.1580, lng: 78.3850, sectionId: 'SEC-5', aspect: 'CLR' },
  { id: 'S-260', name: 'S-260', km: 260.0, lat: 26.9800, lng: 78.7500, sectionId: 'SEC-6', aspect: 'CLR' },
  { id: 'S-297', name: 'S-297', km: 297.0, lat: 26.7720, lng: 79.0280, sectionId: 'SEC-6', aspect: 'CLR' },
  { id: 'S-304', name: 'S-304', km: 304.0, lat: 26.7350, lng: 79.1100, sectionId: 'SEC-7', aspect: 'CLR' },
  { id: 'S-355', name: 'S-355', km: 355.0, lat: 26.5610, lng: 79.4600, sectionId: 'SEC-7', aspect: 'CLR' },
  { id: 'S-390', name: 'S-390', km: 390.0, lat: 26.5050, lng: 79.8200, sectionId: 'SEC-8', aspect: 'CLR' },
  { id: 'S-428', name: 'S-428', km: 428.0, lat: 26.4650, lng: 80.2200, sectionId: 'SEC-9', aspect: 'CLR' }
];

// Signal Node Icon Generator (Aspect markers matching user snippet: S-xx [CLR], S-142 [CAUTION], S-150 [HOLD])
const createSignalIcon = (signal) => {
  let aspectBg = '#10B981'; // CLR (Green)
  let aspectText = signal.aspect || 'CLR';
  let textColor = '#10B981';

  if (aspectText === 'HOLD') {
    aspectBg = '#EF4444';
    textColor = '#EF4444';
  } else if (aspectText === 'CAUTION') {
    aspectBg = '#F59E0B';
    textColor = '#D97706';
  }

  const html = `
    <div class="pointer-events-auto flex items-center space-x-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer group select-none">
      <div class="relative w-3.5 h-3.5 flex items-center justify-center">
        ${aspectText === 'HOLD' ? `<div class="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>` : ''}
        ${aspectText === 'CAUTION' ? `<div class="absolute -inset-0.5 rounded-full border border-amber-400 opacity-80"></div>` : ''}
        <div class="w-2 h-2 rounded-full shadow-xs border border-white" style="background-color: ${aspectBg};"></div>
      </div>
      <span class="px-1 py-0.5 rounded text-[7.5px] font-mono font-bold bg-white/95 shadow-xs border border-slate-200" style="color: ${textColor};">
        ${signal.name} [${aspectText}]
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'signal-aspect-node',
    iconSize: [68, 18],
    iconAnchor: [6, 9]
  });
};

// Calculate bearing angle between two coordinates (for orientation)
const calculateHeading = (fromLat, fromLng, toLat, toLng) => {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

// Cyber-Tactical Moving Train Tracking Marker (Concentric GPS ripple radar waves, locomotive puck, headlight cone, status pill)
const createUberTrainIcon = (train, isSelected) => {
  const isDelayed = (train.current_delay_min || 0) > 5;
  const delayMin = Math.round(train.current_delay_min || 0);
  const speed = Math.round(train.current_speed_kmh || 110);
  
  // Angle along corridor (Delhi -> Kanpur runs ~126° SE)
  let headingAngle = 126;
  if (typeof train.heading === 'string') {
    const match = train.heading.match(/(\d+)/);
    if (match) headingAngle = parseInt(match[1], 10);
  }

  // Category Theme Colors matching user snippet and reference screenshot
  const cat = (train.category || '').toLowerCase();
  let vehicleColor = '#0284C7'; // Electric Sky Blue (High Speed default)

  if (cat.includes('vande')) {
    vehicleColor = '#00F0FF'; // High-Speed Cyan
  } else if (cat.includes('shatabdi')) {
    vehicleColor = '#0284C7'; // Electric Cyan / Blue
  } else if (cat.includes('rajdhani')) {
    vehicleColor = '#E11D48'; // Rose Red
  } else if (cat.includes('superfast')) {
    vehicleColor = '#10B981'; // Commuter Emerald Green
  } else if (cat.includes('mail') || cat.includes('express')) {
    vehicleColor = '#8B5CF6'; // Purple
  } else if (train.color) {
    vehicleColor = train.color;
  }

  const delayText = isDelayed ? `+${delayMin}m` : 'On Time';
  const delayBadgeBg = isDelayed ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';

  const html = `
    <div class="relative pointer-events-auto cursor-pointer group" style="width: 120px; height: 120px; margin-left: -60px; margin-top: -60px;">
      
      <!-- 1. Floating Label Pill (#number • speed km/h • status) matching reference screenshot -->
      <div class="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md shadow-slate-200/50 text-[10px] font-mono font-bold whitespace-nowrap transition-transform duration-200 group-hover:scale-105 pointer-events-auto">
        <span class="w-2 h-2 rounded-full" style="background-color: ${vehicleColor};"></span>
        <span class="text-slate-800 font-extrabold">#${train.train_number}</span>
        <span class="text-slate-400">•</span>
        <span class="text-slate-600 font-medium">${speed} km/h</span>
        <span class="text-slate-400">•</span>
        <span class="px-1.5 py-0.5 rounded border text-[9px] ${delayBadgeBg}">${delayText}</span>
      </div>

      <!-- 2. Concentric GPS RTIS Ripple Radar Rings (gps-radar-wave from snippet) -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 gps-radar-wave pointer-events-none" style="border-color: ${vehicleColor};"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border gps-radar-wave-delayed pointer-events-none" style="border-color: ${vehicleColor}; opacity: 0.65;"></div>

      <!-- 3. Selection Halo Ring -->
      ${isSelected ? `
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-sky-400 bg-sky-400/20 animate-pulse shadow-[0_0_20px_rgba(2,132,199,0.7)] pointer-events-none"></div>
      ` : ''}

      <!-- 4. Rotating Directional Group with Uber Headlight Beam Cone & Speed Vector Line -->
      <div class="absolute left-1/2 top-1/2 w-0 h-0 pointer-events-none transition-transform duration-300" style="transform: rotate(${headingAngle}deg);">
        <svg width="60" height="40" viewBox="-30 -20 60 40" class="overflow-visible" style="transform: translate(0, 0);">
          <!-- Forward Headlight Beam Cone -->
          <path d="M 0,0 L 26,-9 A 28,28 0 0,1 26,9 Z" fill="${vehicleColor}" opacity="0.32"></path>
          <!-- Direction Vector Line & Arrowhead -->
          <line x1="0" y1="0" x2="20" y2="0" stroke="${vehicleColor}" stroke-width="2.2" stroke-linecap="round" />
          <polygon points="24,0 18,-3.5 18,3.5" fill="${vehicleColor}" />
        </svg>
      </div>

      <!-- 5. Central Locomotive Puck (Tactical vehicle icon with train glyph) -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-115 pointer-events-auto" style="background-color: ${vehicleColor}; box-shadow: 0 0 10px ${vehicleColor}80;">
        <div class="w-4.5 h-4.5 rounded-full bg-[#0A0F1D] flex items-center justify-center">
          <!-- Clean Train Locomotive Icon -->
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="15" rx="3" />
            <line x1="4" y1="11" x2="20" y2="11" />
            <line x1="8" y1="7" x2="8" y2="7.01" />
            <line x1="16" y1="7" x2="16" y2="7.01" />
            <path d="m9 18-2 3" />
            <path d="m15 18 2 3" />
          </svg>
        </div>
      </div>

    </div>
  `;

  return L.divIcon({
    html,
    className: 'tactical-train-marker',
    iconSize: [120, 120],
    iconAnchor: [60, 60]
  });
};

// Station Node Generator (Concentric rings matching 'Union Intermodal Hub / SkyRail Central' in reference)
const createStationNodeIcon = (station) => {
  const isMajor = station.is_junction || station.tier === 1;
  const isTundlaHub = station.code === 'TDL';

  if (isTundlaHub) {
    // Center Interchange Hub (Matching SkyRail Central in RailSync reference)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <!-- Concentric Circular Target Node -->
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-sky-400/40 animate-ping opacity-60"></div>
          <div class="w-6 h-6 rounded-full border-2 border-[#0284C7] bg-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <div class="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></div>
          </div>
        </div>

        <!-- Floating Card Label (Matching 'SkyRail Central / Union Intermodal Hub' in reference) -->
        <div class="mt-1 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-center whitespace-nowrap">
          <div class="flex items-center space-x-1 justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span class="font-bold text-xs text-slate-800 tracking-tight">SkyRail Central (TDL)</span>
          </div>
          <span class="text-[9px] font-mono text-sky-600 font-semibold block">
            INTERMODAL HUB • PLATFORM 3 • LIVE
          </span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-hub-node',
      iconSize: [180, 56],
      iconAnchor: [90, 16]
    });
  } else if (isMajor) {
    // Major Junction (NDLS, GZB, ALJN, ETW, CNB)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <!-- Concentric Target Ring -->
        <div class="w-5 h-5 rounded-full border-2 border-[#0284C7] bg-white flex items-center justify-center shadow-sm group-hover:scale-125 transition">
          <div class="w-2 h-2 rounded-full bg-[#0284C7]"></div>
        </div>
        <!-- Light Clean Label -->
        <div class="mt-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 shadow-sm text-center whitespace-nowrap">
          <span class="font-extrabold text-[10px] font-mono text-slate-800">${station.name}</span>
          <span class="text-[9px] font-mono text-slate-400 block">km ${station.km}</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-major-node',
      iconSize: [100, 40],
      iconAnchor: [50, 10]
    });
  } else {
    // Intermediate / Small Station (HRS, PHD, RURA, SKB)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <div class="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center shadow-sm group-hover:scale-125 transition">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        </div>
        <div class="mt-0.5 px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-xs text-center whitespace-nowrap">
          <span class="font-bold text-[9px] font-mono text-slate-700">${station.code}</span>
          <span class="text-[8px] font-mono text-slate-400 block">${station.km}km</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-small-node',
      iconSize: [60, 32],
      iconAnchor: [30, 7]
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

export default function CorridorMap({ 
  stations = [], 
  sections = [], 
  trains = [], 
  selectedTrainId, 
  onSelectTrain,
  disruptions = {},
  hideInternalHeader = false
}) {
  const [mapCenterState, setMapCenterState] = useState(CORRIDOR_CENTER);
  const [mapZoomState, setMapZoomState] = useState(DEFAULT_ZOOM);

  // Build coordinate lines for each section
  const sectionPolylines = useMemo(() => {
    if (!stations.length || !sections.length) return [];
    
    const stationMap = new Map(stations.map(s => [s.code, s]));
    
    return sections.map(sec => {
      const sFrom = stationMap.get(sec.from);
      const sTo = stationMap.get(sec.to);
      if (!sFrom || !sTo) return null;

      let color = "#0284C7"; // Vivid Sky Blue (High Speed)
      if (sec.occupancy_ratio > 0.85) {
        color = "#EF4444"; // Congested Rose Red
      } else if (sec.occupancy_ratio > 0.60) {
        color = "#F59E0B"; // Caution Warm Amber
      }

      if (disruptions.maintenance_section === sec.id) {
        color = "#F97316";
      }

      return {
        id: sec.id,
        from: sFrom.name,
        to: sTo.name,
        positions: [
          [sFrom.lat, sFrom.lng],
          [sTo.lat, sTo.lng]
        ],
        color,
        occupancy: sec.occupancy_ratio,
        status: sec.status
      };
    }).filter(Boolean);
  }, [stations, sections, disruptions]);

  // Map active sections to trains present for dynamic track illumination and colored sleepers
  const activeSectionMap = useMemo(() => {
    const map = new Map();
    trains.forEach(t => {
      let secId = t.current_section_id;
      if (!secId && t.current_km != null) {
        for (const sec of sections) {
          const sFrom = stations.find(s => s.code === sec.from);
          const sTo = stations.find(s => s.code === sec.to);
          if (sFrom && sTo && t.current_km >= sFrom.km && t.current_km <= sTo.km) {
            secId = sec.id;
            break;
          }
        }
      }
      if (secId) {
        map.set(secId, t);
      }
    });
    return map;
  }, [trains, sections, stations]);

  const handleResetCorridor = () => {
    setMapCenterState([...CORRIDOR_CENTER]);
    setMapZoomState(DEFAULT_ZOOM);
  };

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#F8FAFC]">
      
      {/* Floating Right Controls Stack (Matching reference icons) */}
      <div className="absolute top-20 right-4 z-[900] pointer-events-auto flex flex-col space-y-2">
        <button
          onClick={handleResetCorridor}
          title="Re-Center Corridor"
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:border-sky-500/50 shadow-md shadow-slate-200/50 flex items-center justify-center text-slate-700 hover:text-sky-600 transition active:scale-95"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* The Leaflet Map Canvas */}
      <MapContainer
        center={CORRIDOR_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={7}
        maxZoom={14}
        maxBounds={CORRIDOR_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#F8FAFC' }}
        attributionControl={false}
      >
        <ZoomControl position="topright" />
        <ChangeMapView center={mapCenterState} zoom={mapZoomState} />

        {/* Crisp Pristine Light Gray Vector Base Canvas (Zero Watermarks) */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {/* Subtle Light Labels Overlay */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          opacity={0.65}
        />

        {/* 1. SOFT POWDER-BLUE RIVER CORRIDOR (Matching river in RailSync reference) */}
        <Polyline
          positions={YAMUNA_RIVER_PATH}
          pathOptions={{
            color: '#BAE6FD',
            weight: 22,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        >
          <Tooltip sticky>
            <div className="text-[10px] font-mono text-sky-700 font-bold">
              🌊 YAMUNA RIVER CORRIDOR
            </div>
          </Tooltip>
        </Polyline>

        {/* 2. SECONDARY COMMUTER RAIL LINES (Emerald Green tracks in RailSync reference) */}
        {COMMUTER_RAIL_LINES.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: 3.5,
              opacity: 0.85
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-emerald-800 font-bold">
                🚆 {line.name}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* 3. ORBITAL METRO LOOP (Dashed Purple Ring around Tundla Hub in RailSync reference) */}
        {ORBITAL_METRO_LOOP.map((loop) => (
          <Polyline
            key={loop.id}
            positions={loop.positions}
            pathOptions={{
              color: '#8B5CF6',
              weight: 2,
              opacity: 0.8,
              dashArray: '5, 6'
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-purple-700 font-bold">
                🔄 {loop.name}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* 4. DYNAMIC ILLUMINATED RAILWAY TRACK CORRIDOR (uber-track-system from snippet) */}
        
        {/* Layer 4a: Foundation Ballast Bed (Dark casing along full corridor) */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={`bed-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: '#0F172A',
              weight: 12,
              opacity: 0.18,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        ))}

        {/* Layer 4b: Bottleneck / Disruption Contention Aura */}
        {sectionPolylines.filter(l => l.status === 'CONGESTED' || disruptions.maintenance_section === l.id).map((line) => (
          <Polyline
            key={`alert-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: '#EF4444',
              weight: 18,
              opacity: 0.4,
              lineCap: 'round'
            }}
          />
        ))}

        {/* Layer 4c: Active & Standard Railway Sleeper Ties (Matching user snippet & reference screenshot) */}
        {sectionPolylines.map((line) => {
          const activeTrain = activeSectionMap.get(line.id);
          
          let trackThemeColor = activeTrain?.color || line.color;
          if (activeTrain) {
            const cat = (activeTrain.category || '').toLowerCase();
            if (cat.includes('vande')) trackThemeColor = '#00F0FF';
            else if (cat.includes('shatabdi')) trackThemeColor = '#0284C7';
            else if (cat.includes('rajdhani')) trackThemeColor = '#E11D48';
            else if (cat.includes('superfast')) trackThemeColor = '#10B981';
            else if (cat.includes('mail') || cat.includes('express')) trackThemeColor = '#8B5CF6';
          }

          return (
            <React.Fragment key={`sleeper-group-${line.id}`}>
              {/* Highlight background glow on active block sections where trains are present */}
              {activeTrain && (
                <Polyline
                  positions={line.positions}
                  pathOptions={{
                    color: trackThemeColor,
                    weight: 12,
                    opacity: 0.45,
                    lineCap: 'round'
                  }}
                />
              )}
              {/* Perpendicular railroad tie crossbars (ladder sleepers) */}
              <Polyline
                positions={line.positions}
                pathOptions={{
                  color: activeTrain ? '#0F172A' : '#475569',
                  weight: activeTrain ? 10 : 6,
                  opacity: activeTrain ? 0.9 : 0.45,
                  dashArray: activeTrain ? '3, 6' : '2, 7',
                  className: 'sleeper-track'
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Layer 4d: Main High-Speed Trunk Rails */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={`trunk-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: 3.5,
              opacity: 0.95,
              lineCap: 'round'
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-sans p-1">
                <p className="font-bold text-slate-900">{line.from} ➔ {line.to}</p>
                <p className="text-slate-500">
                  Occupancy: <span className="font-mono text-sky-600 font-bold">{Math.round(line.occupancy * 100)}%</span> ({line.status})
                </p>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Layer 4e: Dynamic Route Flow (Animated marching dashed path from user snippet) */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={`flow-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: '#38BDF8',
              weight: 3,
              opacity: 0.85,
              dashArray: '8, 8',
              className: 'animated-route-flow'
            }}
          />
        ))}

        {/* Layer 4f: Parallel Station Loop Sidings (From cyber-tactical snippet) */}
        {STATION_LOOP_SIDINGS.map((loop) => (
          <Polyline
            key={loop.id}
            positions={loop.positions}
            pathOptions={{
              color: loop.color,
              weight: 2,
              opacity: 0.8,
              dashArray: '4, 4'
            }}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono text-slate-700 font-bold">
                🔀 {loop.name}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Layer 4g: Corridor Automatic Block Signals (From cyber-tactical snippet) */}
        {CORRIDOR_SIGNALS.map((sig) => (
          <Marker
            key={`sig-${sig.id}`}
            position={[sig.lat, sig.lng]}
            icon={createSignalIcon(sig)}
          >
            <Tooltip sticky>
              <div className="text-[10px] font-mono p-0.5 space-y-0.5">
                <p className="font-bold text-slate-800">Signal {sig.name}</p>
                <p className="text-slate-500">Section: {sig.sectionId} • km {sig.km}</p>
                <p className="font-bold" style={{ color: sig.aspect === 'HOLD' ? '#EF4444' : sig.aspect === 'CAUTION' ? '#F59E0B' : '#10B981' }}>
                  Aspect: {sig.aspect}
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 5. STATIONS: CONCENTRIC RINGS & INTERCHANGE HUBS */}
        {stations.map((st) => (
          <Marker
            key={`st-${st.code}`}
            position={[st.lat, st.lng]}
            icon={createStationNodeIcon(st)}
          >
            <Popup>
              <div className="p-1 font-sans text-xs space-y-1">
                <p className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>{st.name} ({st.code})</span>
                </p>
                <p className="text-slate-600">Corridor KM: <span className="font-mono font-bold text-slate-900">{st.km} km</span></p>
                <p className="text-slate-600">Platforms: <span className="font-mono font-bold text-slate-900">{st.platforms}</span></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. CYBER-TACTICAL TRAIN VEHICLES (Locomotive puck with GPS radar waves & headlight cone) */}
        {trains.map((train) => {
          const isSelected = selectedTrainId === train.train_number;
          return (
            <Marker
              key={train.train_number}
              position={[train.lat, train.lng]}
              icon={createUberTrainIcon(train, isSelected)}
              eventHandlers={{
                click: () => onSelectTrain(train.train_number)
              }}
            >
              <Popup>
                <div className="p-2 font-sans text-xs space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{train.train_name}</h4>
                      <span className="font-mono text-[11px] text-slate-500">#{train.train_number} • {train.category}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-700 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Velocity</span>
                      <span className="font-mono font-bold text-sky-600">{Math.round(train.current_speed_kmh)} km/h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                      <span className={`font-mono font-bold ${train.current_delay_min > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {train.current_delay_min > 5 ? `+${Math.round(train.current_delay_min)}m` : 'On Time'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectTrain(train.train_number)}
                    className="w-full mt-2 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-lg text-center transition text-xs shadow-md"
                  >
                    Track in Live Timetable
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
