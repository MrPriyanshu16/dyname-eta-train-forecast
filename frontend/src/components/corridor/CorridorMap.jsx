import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Focus, MapPin, Compass, Layers } from 'lucide-react';

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

// Calculate bearing angle between two coordinates (for Uber-style vehicle orientation)
const calculateHeading = (fromLat, fromLng, toLat, toLng) => {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

// Uber-Style Moving Train Vehicle Icon Generator
const createUberTrainIcon = (train, isSelected) => {
  const isDelayed = (train.current_delay_min || 0) > 5;
  const delayMin = Math.round(train.current_delay_min || 0);
  const speed = Math.round(train.current_speed_kmh || 110);
  
  // Angle along corridor (Delhi -> Kanpur runs ~125° SE)
  const headingAngle = 126;

  // Category Theme Colors matching RailSync reference
  const cat = (train.category || '').toLowerCase();
  let vehicleColor = '#0284C7'; // Sky Blue (High Speed)
  let badgeLabel = `${train.train_name.split(' ')[0]} ${train.train_number}`;

  if (cat.includes('vande')) {
    vehicleColor = '#0284C7'; // High-Speed Electric Blue
  } else if (cat.includes('shatabdi')) {
    vehicleColor = '#0369A1'; // Deep Electric Cyan
  } else if (cat.includes('rajdhani')) {
    vehicleColor = '#E11D48'; // Rose Red
  } else if (cat.includes('superfast')) {
    vehicleColor = '#10B981'; // Commuter Emerald Green
  } else {
    vehicleColor = '#8B5CF6'; // Purple
  }

  const delayText = isDelayed ? `+${delayMin}m` : 'On Time';
  const delayBadgeBg = isDelayed ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';

  const html = `
    <div class="relative pointer-events-auto cursor-pointer group -translate-x-1/2 -translate-y-1/2">
      
      <!-- Floating Label Pill (Matching 'HST-401 • 315 kph' & 'Commuter 201 • On Time' in RailSync reference) -->
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md shadow-slate-200/50 text-[10px] font-mono font-bold whitespace-nowrap transition-transform duration-200 group-hover:scale-105">
        <span class="w-2 h-2 rounded-full" style="background-color: ${vehicleColor};"></span>
        <span class="text-slate-800 font-extrabold">#${train.train_number}</span>
        <span class="text-slate-400">•</span>
        <span class="text-slate-600 font-medium">${speed} km/h</span>
        <span class="text-slate-400">•</span>
        <span class="px-1.5 py-0.2 rounded border text-[9px] ${delayBadgeBg}">${delayText}</span>
      </div>

      <!-- Rotating Uber-Style Vehicle Body (Oriented along track direction) -->
      <div class="relative flex items-center justify-center transition-transform duration-300" style="transform: rotate(${headingAngle}deg);">
        
        <!-- Forward Headlight Projection Beam (Fanning ahead on the track like an Uber ride) -->
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 w-8 h-8 pointer-events-none opacity-40">
          <div class="w-full h-full headlight-cone"></div>
        </div>

        <!-- Selection Halo Ring -->
        ${isSelected ? `
          <div class="absolute -inset-2 rounded-2xl border-2 border-sky-400 bg-sky-400/10 animate-pulse shadow-[0_0_15px_rgba(2,132,199,0.4)]"></div>
        ` : ''}

        <!-- Top-Down Streamlined Train Capsule Body -->
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none" class="drop-shadow-md">
          <!-- Main Chassis with aerodynamic pointed front nose -->
          <path d="M4 2C1.79 2 0 3.79 0 6V10C0 12.21 1.79 14 4 14H32C36.42 14 40 10.42 40 8C40 5.58 36.42 2 32 2H4Z" fill="${vehicleColor}"/>
          <!-- Roof Gradient Overlay -->
          <path d="M4 3C2.34 3 1 4.34 1 6V10C1 11.66 2.34 13 4 13H31C34.87 13 38 9.87 38 8C38 6.13 34.87 3 31 3H4Z" fill="white" fill-opacity="0.25"/>
          <!-- Front Driver Windshield -->
          <path d="M28 4.5H33C35.21 4.5 37 6.07 37 8C37 9.93 35.21 11.5 33 11.5H28V4.5Z" fill="#0F172A"/>
          <!-- Passenger Coach Windows -->
          <rect x="5" y="4.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="11" y="4.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="17" y="4.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="23" y="4.5" width="3" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="5" y="9.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="11" y="9.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="17" y="9.5" width="4" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <rect x="23" y="9.5" width="3" height="2" rx="0.5" fill="#0F172A" fill-opacity="0.85"/>
          <!-- Dual LED Headlights at the front tip -->
          <circle cx="38" cy="5.5" r="1" fill="#FEF08A"/>
          <circle cx="38" cy="10.5" r="1" fill="#FEF08A"/>
        </svg>

      </div>

    </div>
  `;

  return L.divIcon({
    html,
    className: 'uber-train-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
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
        <div class="mt-0.5 px-1.5 py-0.2 rounded bg-white/90 border border-slate-200 shadow-xs text-center whitespace-nowrap">
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

  const handleResetCorridor = () => {
    setMapCenterState([...CORRIDOR_CENTER]);
    setMapZoomState(DEFAULT_ZOOM);
  };

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#F8FAFC]">
      
      {/* Floating Right Controls Stack (Matching RailSync reference icons) */}
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

        {/* 4. MAIN HIGH-SPEED TRUNK TRACK (Electric Blue Line with subtle ties in RailSync reference) */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={`glow-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: '#38BDF8',
              weight: 8,
              opacity: 0.35,
            }}
          />
        ))}

        {sectionPolylines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: 4.5,
              opacity: 0.98,
              dashArray: line.status === 'CONGESTED' ? '6, 6' : undefined
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-sans p-1">
                <p className="font-bold text-slate-900">{line.from} ➔ {line.to}</p>
                <p className="text-slate-500">Occupancy: <span className="font-mono text-sky-600 font-bold">{Math.round(line.occupancy * 100)}%</span> ({line.status})</p>
              </div>
            </Tooltip>
          </Polyline>
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

        {/* 6. UBER-STYLE MOVING TRAIN VEHICLES (Oriented capsules with headlight beams) */}
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
