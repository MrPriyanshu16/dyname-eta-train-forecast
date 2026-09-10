import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Train, AlertTriangle, ShieldAlert } from 'lucide-react';

// Custom Train Icon generator using Leaflet DivIcon
const createTrainIcon = (train, isSelected) => {
  const isSuper = train.priority_tier === 1;
  const isDelayed = train.current_delay_min > 10;
  
  const pulseClass = isSelected ? 'ring-4 ring-white shadow-xl scale-125' : '';
  const bgColor = train.color || '#0284c7';

  const htmlString = `
    <div class="relative flex items-center justify-center transition-all duration-300 ${pulseClass}" style="transform: translate(-50%, -50%);">
      <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 font-bold text-[11px] text-white" style="background-color: ${bgColor};">
        🚆
      </div>
      <div class="absolute -bottom-4 bg-slate-900/90 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-slate-700 text-white whitespace-nowrap shadow">
        ${train.train_number}
      </div>
      ${isDelayed ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-ping"></div>' : ''}
    </div>
  `;

  return L.divIcon({
    html: htmlString,
    className: 'custom-train-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
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
  disruptions = {}
}) {
  const mapCenter = [27.55, 78.75]; // Centered between Aligarh and Tundla
  const zoomLevel = 8;

  // Build coordinate lines for each section
  const sectionPolylines = useMemo(() => {
    if (!stations.length || !sections.length) return [];
    
    const stationMap = new Map(stations.map(s => [s.code, s]));
    
    return sections.map(sec => {
      const sFrom = stationMap.get(sec.from);
      const sTo = stationMap.get(sec.to);
      if (!sFrom || !sTo) return null;

      let color = "#10B981"; // Clear Green
      if (sec.occupancy_ratio > 0.85) color = "#EF4444"; // Congested Red
      else if (sec.occupancy_ratio > 0.60) color = "#F59E0B"; // Caution Amber

      if (disruptions.maintenance_section === sec.id) {
        color = "#F97316"; // Orange for track maintenance
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

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-rail-border shadow-inner bg-rail-bg">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-rail-card/90 backdrop-blur-md px-3 py-2 rounded-lg border border-rail-border shadow-lg text-xs space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
          <span>Corridor Track Status</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Clear (&lt;60% density)</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Caution (60-85% density)</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Bottleneck (&gt;85% density)</span>
        </div>
        {disruptions.fog && (
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold pt-1 border-t border-rail-border">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Dense Fog Active (MPS 60 km/h)</span>
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Railway Track Polylines */}
        {sectionPolylines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: 5,
              opacity: 0.9,
              dashArray: line.status === 'CONGESTED' ? '8, 8' : undefined
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-sans">
                <p className="font-bold">{line.from} ➔ {line.to}</p>
                <p>Occupancy: {Math.round(line.occupancy * 100)}% ({line.status})</p>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Station Markers */}
        {stations.map((st) => (
          <CircleMarker
            key={st.code}
            center={[st.lat, st.lng]}
            radius={st.is_junction ? 7 : 5}
            pathOptions={{
              fillColor: '#FFFFFF',
              color: '#0284C7',
              weight: 2.5,
              fillOpacity: 1
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} permanent>
              <span className="font-mono text-[10px] font-bold text-slate-800 bg-white/90 px-1 py-0.5 rounded shadow">
                {st.code}
              </span>
            </Tooltip>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-bold text-base text-slate-100">{st.name} ({st.code})</p>
                <p className="text-slate-300">Kilometer: {st.km} km</p>
                <p className="text-slate-300">Platforms: {st.platforms}</p>
                <p className="text-slate-400 mt-1 italic">{st.is_junction ? 'Major Junction Hub' : 'Intermediate Block Post'}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Live Moving Trains */}
        {trains.map((train) => {
          const isSelected = selectedTrainId === train.train_number;
          return (
            <Marker
              key={train.train_number}
              position={[train.lat, train.lng]}
              icon={createTrainIcon(train, isSelected)}
              eventHandlers={{
                click: () => onSelectTrain(train.train_number)
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-sm text-slate-100">
                    <span>{train.train_name}</span>
                    <span className="font-mono text-xs px-1 rounded bg-slate-800 text-sky-400">#{train.train_number}</span>
                  </div>
                  <p className="text-slate-300">Speed: <span className="font-bold font-mono text-emerald-400">{train.current_speed_kmh} km/h</span></p>
                  <p className="text-slate-300">Status: <span className="font-semibold text-amber-300">{train.current_status}</span></p>
                  <p className="text-slate-300">Current Delay: <span className="font-bold text-rose-400">{Math.round(train.current_delay_min)} mins</span></p>
                  <button
                    onClick={() => onSelectTrain(train.train_number)}
                    className="w-full mt-2 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-center"
                  >
                    View Dynamic ETA Forecast
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
