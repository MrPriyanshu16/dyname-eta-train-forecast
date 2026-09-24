import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap, ZoomControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Compass, Layers, ArrowRight, ArrowLeftRight, Navigation, X, Clock, Train, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Default Map Center & Zoom: Full Rajasthan Lifeline Corridor Overview (Jaipur ➔ Ajmer ➔ Jodhpur)
const CORRIDOR_CENTER = [26.58, 74.40];
const DEFAULT_ZOOM = 8.2;
const JODHPUR_CENTER = [26.2842, 73.0188];

// Quick Jump Landmark Presets across Rajasthan
const QUICK_NAV_TARGETS = [
  { id: 'corridor', name: 'Full Corridor (JP ➔ JU)', center: [26.58, 74.40], zoom: 8.2 },
  { id: 'ju', name: 'Jodhpur Hub', center: [26.2842, 73.0188], zoom: 12 },
  { id: 'jp', name: 'Jaipur', center: [26.9196, 75.7878], zoom: 12 },
  { id: 'aii', name: 'Ajmer', center: [26.4525, 74.6399], zoom: 12 },
  { id: 'raj', name: 'Full State', center: [26.50, 74.50], zoom: 7 },
];

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

// Calculate screen track tangent angle and orientation for train marker
const getTrainTrackAngle = (train, stations = [], sections = []) => {
  let fromCoord = null;
  let toCoord = null;

  // 1. Try to match train's current section ID to stations
  if (train.current_section_id && sections.length && stations.length) {
    const sec = sections.find(s => s.id === train.current_section_id);
    if (sec) {
      const sFrom = stations.find(s => s.code === sec.from);
      const sTo = stations.find(s => s.code === sec.to);
      if (sFrom && sTo) {
        fromCoord = [sFrom.lat, sFrom.lng];
        toCoord = [sTo.lat, sTo.lng];
      }
    }
  }

  // 2. If not matched by section, infer from current_km between consecutive stations
  if (!fromCoord && train.current_km != null && stations.length >= 2) {
    for (let i = 0; i < stations.length - 1; i++) {
      const s1 = stations[i];
      const s2 = stations[i + 1];
      if (train.current_km >= s1.km && train.current_km <= s2.km) {
        fromCoord = [s1.lat, s1.lng];
        toCoord = [s2.lat, s2.lng];
        break;
      }
    }
  }

  // 3. If section coordinates found, compute screen vector (dx, dy)
  if (fromCoord && toCoord) {
    const latAvg = ((fromCoord[0] + toCoord[0]) / 2) * Math.PI / 180;
    const dx = (toCoord[1] - fromCoord[1]) * Math.cos(latAvg);
    const dy = -(toCoord[0] - fromCoord[0]); // Negative because Leaflet screen Y increases downwards
    const theta = Math.atan2(dy, dx) * 180 / Math.PI;
    const isWestbound = dx < 0;
    // Calculate relative tilt angle so the train stays upright with wheels on the track
    const relAngle = isWestbound 
      ? (theta > 0 ? theta - 180 : theta + 180) 
      : theta;
    return { relAngle, isWestbound };
  }

  // 4. Fallback using train heading string (e.g. "242° SW")
  let headingAngle = 242;
  if (typeof train.heading === 'string') {
    const match = train.heading.match(/(\d+)/);
    if (match) headingAngle = parseInt(match[1], 10);
  }
  const isWestbound = headingAngle >= 180 && headingAngle <= 360;
  const relAngle = isWestbound ? -32 : 32;
  return { relAngle, isWestbound };
};

// Cyber-Tactical Moving Train Tracking Marker (Light/Dark adaptive pill, GPS radar waves, puck)
const createUberTrainIcon = (train, isSelected, isDark, extra = {}) => {
  const isDelayed = (train.current_delay_min || 0) > 5;
  const delayMin = Math.round(train.current_delay_min || 0);
  const speed = Math.round(train.current_speed_kmh || 110);
  const { destinationEta, isRouteActive, isOnRoute, stations = [], sections = [] } = extra;
  
  // Calculate exact track tangent angle and travel orientation
  const { relAngle, isWestbound } = getTrainTrackAngle(train, stations, sections);

  // Category Theme Colors (Used ONLY for selected train)
  const cat = (train.category || '').toLowerCase();
  let vehicleColor = '#0284C7'; // Electric Sky Blue default

  if (cat.includes('vande')) {
    vehicleColor = isDark ? '#00F0FF' : '#0284C7'; // High-Speed Cyan
  } else if (cat.includes('shatabdi')) {
    vehicleColor = isDark ? '#38BDF8' : '#0284C7'; // Electric Cyan / Blue
  } else if (cat.includes('rajdhani')) {
    vehicleColor = isDark ? '#FB7185' : '#E11D48'; // Rose Red
  } else if (cat.includes('superfast')) {
    vehicleColor = isDark ? '#34D399' : '#10B981'; // Commuter Emerald Green
  } else if (cat.includes('mail') || cat.includes('express')) {
    vehicleColor = isDark ? '#A78BFA' : '#8B5CF6'; // Purple
  } else if (train.color) {
    vehicleColor = train.color;
  }

  const delayText = isDelayed ? `+${delayMin}m` : 'On Time';
  const statusDotColor = isDelayed ? '#EF4444' : '#10B981';
  
  // Adaptive light/dark pill styling
  const pillBgClass = isDark
    ? 'bg-slate-900 border-slate-700 shadow-md text-white'
    : 'bg-white border-slate-200 shadow-sm text-slate-800';

  const containerOpacity = (isRouteActive && !isOnRoute) ? 'opacity: 0.35;' : 'opacity: 1.0;';

  // REQUIREMENT: Only change the color of the train icon which is selected by the user in the left side panel
  // REQUIREMENT: Rich Dark Blue livery for selected train ("add the dark blue in the selected train , because light blue is not looking good")
  const neutralTrainFill = isDark ? '#64748B' : '#475569';
  const neutralWindowFill = isDark ? '#94A3B8' : '#CBD5E1';
  const neutralStripeFill = isDark ? '#475569' : '#94A3B8';

  const activeTrainFill = isDark ? '#1D4ED8' : '#1E3A8A'; // Deep Dark Royal Blue
  const activeStripeFill = isDark ? '#60A5FA' : '#93C5FD'; // Clean Contrasting Blue Stripe
  
  const trainFill = isSelected ? activeTrainFill : neutralTrainFill;
  const windowFill = isSelected ? (isDark ? '#FEF08A' : '#FFFFFF') : neutralWindowFill;
  const accentStripeFill = isSelected ? activeStripeFill : neutralStripeFill;
  
  const railFill = isDark ? '#94A3B8' : '#334155';
  const strokeColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.3)';
  
  // Crisp cartographic elevation shadow with NO glow aura on the train body (edges remain razor sharp)
  const shadowFilter = isDark
    ? 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));'
    : 'filter: drop-shadow(0 1px 3px rgba(15,23,42,0.3));';

  // REQUIREMENT: Show 5 to 7 passenger carriages ONLY for the selected train
  // When unselected, render only the single high-speed locomotive
  const coachesSvg = isSelected ? `
    <!-- Coupler 1 -->
    <rect x="-2" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 1 (Executive Chair Car) -->
    <rect x="-16.5" y="10.5" width="14.5" height="10.5" rx="1.5" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-15" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-11.2" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-7.4" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-16.5" y="17" width="14.5" height="0.9" fill="${accentStripeFill}" />
    <circle cx="-13" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-5.5" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Coupler 2 -->
    <rect x="-18.5" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 2 (AC Chair Car) -->
    <rect x="-33" y="10.5" width="14.5" height="10.5" rx="1.5" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-31.5" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-27.7" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-23.9" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-33" y="17" width="14.5" height="0.9" fill="${accentStripeFill}" />
    <circle cx="-29.5" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-22" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Coupler 3 -->
    <rect x="-35" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 3 (AC Chair Car) -->
    <rect x="-49.5" y="10.5" width="14.5" height="10.5" rx="1.5" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-48" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-44.2" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-40.4" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-49.5" y="17" width="14.5" height="0.9" fill="${accentStripeFill}" />
    <circle cx="-46" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-38.5" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Coupler 4 -->
    <rect x="-51.5" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 4 (AC Chair Car) -->
    <rect x="-66" y="10.5" width="14.5" height="10.5" rx="1.5" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-64.5" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-60.7" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-56.9" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-66" y="17" width="14.5" height="0.9" fill="${accentStripeFill}" />
    <circle cx="-62.5" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-55" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Coupler 5 -->
    <rect x="-68" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 5 (AC Chair Car) -->
    <rect x="-82.5" y="10.5" width="14.5" height="10.5" rx="1.5" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-81" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-77.2" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-73.4" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-82.5" y="17" width="14.5" height="0.9" fill="${accentStripeFill}" />
    <circle cx="-79" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-71.5" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Coupler 6 -->
    <rect x="-84.5" y="13.5" width="2" height="5" rx="0.5" fill="#334155" />
    <!-- Coach 6 (Tail Coach / End Car) -->
    <path d="M-100,21 h15.5 c0.6,0 1,-0.4 1,-1 v-8.5 c0,-0.6 -0.4,-1 -1,-1 h-12.5 c-2.2,0 -4,1.8 -4,4 v5.5 c0,0.6 0.4,1 1,1 z" fill="${trainFill}" stroke="${strokeColor}" stroke-width="0.5" />
    <rect x="-96.5" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-92.7" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <rect x="-88.9" y="12.5" width="2.8" height="3" rx="0.5" fill="${windowFill}" />
    <circle cx="-98.8" cy="16" r="1" fill="#EF4444" />
    <path d="M-100,17 h15.5" stroke="${accentStripeFill}" stroke-width="0.9" />
    <circle cx="-95" cy="22.5" r="1.2" fill="${railFill}" />
    <circle cx="-87.5" cy="22.5" r="1.2" fill="${railFill}" />

    <!-- Continuous Undercarriage Rail -->
    <rect x="-100" y="21" width="128" height="1.2" rx="0.6" fill="${railFill}" />
  ` : `
    <!-- Single Engine Chassis & Bogie Wheels -->
    <rect x="0" y="21" width="30" height="1.2" rx="0.6" fill="${railFill}" />
    <circle cx="6" cy="22.5" r="1.3" fill="${railFill}" />
    <circle cx="10" cy="22.5" r="1.3" fill="${railFill}" />
    <circle cx="21" cy="22.5" r="1.3" fill="${railFill}" />
    <circle cx="25" cy="22.5" r="1.3" fill="${railFill}" />
  `;

  // Dynamic layout metrics: compact for unselected locomotive, extended for selected express rake
  const svgHeight = 38;
  const svgWidth = isSelected ? 202 : 46;
  const svgViewBox = isSelected ? "-104 0 170 32" : "-2 0 38 32";

  const containerWidth = isSelected ? 224 : 86;
  const containerHeight = isSelected ? 78 : 74;
  const trainCenterY = isSelected ? 48 : 46;

  const anchorX = Math.round(containerWidth / 2);
  // Wheels sit at y = 23.8 in viewBox (32h). At 38px height, wheel contact point is ~9.3px below SVG center.
  // Setting anchorY = trainCenterY + 9 anchors wheels directly to the rail track line.
  const anchorY = trainCenterY + 9;

  const html = `
    <div class="relative pointer-events-auto cursor-pointer group" style="width: ${containerWidth}px; height: ${containerHeight}px; ${containerOpacity}">
      
      <!-- Sleek Micro Train Badges (Positioned cleanly ABOVE the train roof) -->
      <div class="absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-auto whitespace-nowrap">
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${pillBgClass} text-[10px] font-mono font-bold whitespace-nowrap shadow-sm transition-transform duration-150 group-hover:scale-105 ${isSelected ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/40 scale-105' : ''}">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${statusDotColor};"></span>
          <span class="font-extrabold tracking-tight">#${train.train_number}</span>
          <span class="text-[9px] opacity-75">${speed}k</span>
          ${destinationEta ? `
            <span class="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-sans font-black text-[8.5px] leading-tight shadow-xs tracking-tight">
              ETA ${destinationEta}
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Train Marker: Wheels stuck directly on rail track line + track angle aligned -->
      <div 
        class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 group-hover:scale-110 pointer-events-auto flex items-center justify-center" 
        style="top: ${trainCenterY}px; ${shadowFilter}" 
        title="${train.train_name} (#${train.train_number})"
      >
        <div style="transform: rotate(${relAngle.toFixed(1)}deg); transform-origin: center center; display: inline-flex;">
          <div style="transform: scaleX(${isWestbound ? -1 : 1}); transform-origin: center center; display: inline-flex;">
            <svg width="${svgWidth}" height="${svgHeight}" viewBox="${svgViewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" class="overflow-visible">
              <defs>
                <!-- Headlight Projection Beam Gradient -->
                <linearGradient id="headlight-beam-${train.train_number}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${isDark ? '#FFFFFF' : '#FFFBEB'}" stop-opacity="${isDark ? '0.95' : '0.85'}" />
                  <stop offset="25%" stop-color="${isDark ? '#FEF08A' : '#FDE047'}" stop-opacity="${isDark ? '0.65' : '0.5'}" />
                  <stop offset="65%" stop-color="${isDark ? '#38BDF8' : '#F59E0B'}" stop-opacity="${isDark ? '0.25' : '0.15'}" />
                  <stop offset="100%" stop-color="${isDark ? '#38BDF8' : '#F59E0B'}" stop-opacity="0" />
                </linearGradient>
                
                <!-- Volumetric Headlight Flare Radial Gradient -->
                <radialGradient id="headlight-lens-${train.train_number}" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
                  <stop offset="45%" stop-color="${isDark ? '#FEF08A' : '#FDE047'}" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="${isDark ? '#38BDF8' : '#F59E0B'}" stop-opacity="0" />
                </radialGradient>
              </defs>

              <!-- Dedicated Train Headlight: Rendered ONLY on the selected train -->
              ${isSelected ? `
                <g style="filter: drop-shadow(0 0 6px ${isDark ? '#FDE047' : '#F59E0B'}) drop-shadow(0 0 2px #FFFFFF); pointer-events: none;">
                  <!-- Headlight Atmospheric Cone -->
                  <polygon 
                    points="29.5,18.5 62,6 62,31" 
                    fill="url(#headlight-beam-${train.train_number})" 
                    opacity="${isDark ? '0.45' : '0.3'}" 
                    style="mix-blend-mode: ${isDark ? 'screen' : 'normal'};"
                  />

                  <!-- High-Intensity Concentrated Headlight Forward Beam Cone -->
                  <polygon 
                    points="30.5,18.5 56,11 56,26" 
                    fill="url(#headlight-beam-${train.train_number})" 
                    opacity="${isDark ? '0.9' : '0.75'}" 
                    style="mix-blend-mode: ${isDark ? 'screen' : 'normal'};"
                  />

                  <!-- Headlight Halo Flare Disc -->
                  <circle cx="30.5" cy="18.5" r="4.2" fill="${isDark ? '#FEF08A' : '#FDE047'}" opacity="0.65" />

                  <!-- Headlight Lens Flare (Locomotive nose) -->
                  <circle cx="30.5" cy="18.5" r="3.2" fill="url(#headlight-lens-${train.train_number})" />
                  <circle cx="30.5" cy="18.5" r="1.3" fill="#FFFFFF" />
                </g>
              ` : `
                <!-- Unlit nose light fixture for unselected locomotive (no beam or glow) -->
                <circle cx="30.5" cy="18.5" r="1" fill="${isDark ? '#94A3B8' : '#64748B'}" opacity="0.6" style="pointer-events: none;" />
              `}

              <!-- Passenger Carriages (Rendered ONLY when selected by user) -->
              ${coachesSvg}

              <!-- Lead Locomotive Engine -->
              <rect x="2" y="11.5" width="27" height="4" rx="0.5" fill="${windowFill}" />
              <path 
                d="M2,21h26.7c1.1,0,2.1-0.5,2.7-1.4c0.6-0.9,0.8-1.9,0.4-2.9c-1.4-4-5.2-6.7-9.6-6.7H2c-0.6,0-1,0.4-1,1v9 C1,20.6,1.4,21,2,21z M15,15v-3h4v3H15z M13,15H9v-3h4V15z M28.6,15H21v-3h1.3C24.8,12,27.1,13.1,28.6,15z M7,12v3H3v-3H7z"
                fill="${trainFill}"
                stroke="${strokeColor}"
                stroke-width="0.5"
              />
            </svg>
          </div>
        </div>
      </div>

    </div>
  `;

  return L.divIcon({
    html,
    className: 'tactical-train-marker',
    iconSize: [containerWidth, containerHeight],
    iconAnchor: [anchorX, anchorY]
  });
};

// Station Node Generator (Clean, non-occluding cartographic nodes)
const createStationNodeIcon = (station, isDark, routeStatus = {}) => {
  const { isOrigin, isDestination, isOnRoute, isRouteActive } = routeStatus;
  const isMajor = station.is_junction || station.tier === 1;
  const isJodhpurHub = station.code === 'JU';

  const cardBgClass = isDark
    ? 'bg-slate-900 border-slate-700 shadow-md text-white'
    : 'bg-white border-slate-200 shadow-sm text-slate-800';

  const nodeTargetBg = isDark ? 'bg-[#070B14]' : 'bg-white';
  const opacityStyle = (isRouteActive && !isOnRoute) ? 'opacity: 0.35;' : '';

  if (isOrigin || isDestination) {
    const isOrig = isOrigin;
    const badgeColor = isOrig ? 'emerald' : 'amber';
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-50">
        <div class="relative w-6 h-6 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-${badgeColor}-400 animate-ping opacity-75"></div>
          <div class="w-4.5 h-4.5 rounded-full border-2 border-${badgeColor}-500 ${nodeTargetBg} flex items-center justify-center shadow-md">
            <div class="w-2 h-2 rounded-full bg-${badgeColor}-500"></div>
          </div>
        </div>
        <div class="mt-0.5 px-2 py-0.5 rounded-md border border-${badgeColor}-500/60 ${cardBgClass} text-center whitespace-nowrap shadow-md">
          <span class="font-extrabold text-[9.5px] text-${badgeColor}-500 dark:text-${badgeColor}-400">${isOrig ? 'ORIGIN' : 'DEST'}: ${station.name}</span>
        </div>
      </div>
    `;
    return L.divIcon({ html, className: 'station-endpoint-node', iconSize: [130, 42], iconAnchor: [65, 12] });
  }

  if (isJodhpurHub) {
    // Primary Interchange Hub (Jodhpur Junction)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="${opacityStyle}">
        <div class="relative w-6 h-6 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-sky-400/50 animate-ping opacity-50"></div>
          <div class="w-4.5 h-4.5 rounded-full border-2 border-[#0284C7] ${nodeTargetBg} flex items-center justify-center shadow-md shadow-sky-500/20">
            <div class="w-2 h-2 rounded-full bg-[#0284C7]"></div>
          </div>
        </div>
        <div class="mt-0.5 px-2 py-0.5 rounded-md border ${cardBgClass} text-center whitespace-nowrap shadow-xs">
          <div class="flex items-center space-x-1 justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span class="font-bold text-[10px] tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}">Jodhpur Jn (JU)</span>
          </div>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'station-hub-node',
      iconSize: [110, 36],
      iconAnchor: [55, 12]
    });
  } else if (isMajor) {
    // Major Rajasthan Junctions (JP, AII, FL, MJ)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="${opacityStyle}">
        <div class="w-4 h-4 rounded-full border-2 border-[#0284C7] ${nodeTargetBg} flex items-center justify-center shadow-xs group-hover:scale-125 transition">
          <div class="w-1.5 h-1.5 rounded-full bg-[#0284C7]"></div>
        </div>
        <div class="mt-0.5 px-1.5 py-0.5 rounded border ${cardBgClass} text-center whitespace-nowrap">
          <span class="font-bold text-[9.5px] font-mono ${isDark ? 'text-white' : 'text-slate-800'}">${station.name} (${station.code})</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'station-major-node',
      iconSize: [95, 30],
      iconAnchor: [47, 8]
    });
  } else {
    // Intermediate / Small Stations (KSG, BER, PMY)
    const html = `
      <div class="pointer-events-auto flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="${opacityStyle}">
        <div class="w-3 h-3 rounded-full border-1.5 border-emerald-500 ${nodeTargetBg} flex items-center justify-center shadow-xs group-hover:scale-125 transition">
          <div class="w-1 h-1 rounded-full bg-emerald-500"></div>
        </div>
        <div class="mt-0.5 px-1 py-0.5 rounded border ${cardBgClass} text-center whitespace-nowrap opacity-85 group-hover:opacity-100">
          <span class="font-bold text-[8.5px] font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}">${station.code}</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'station-small-node',
      iconSize: [40, 24],
      iconAnchor: [20, 6]
    });
  }
};

function ChangeMapView({ center, zoom, bounds, onMapChange }) {
  const map = useMap();
  const isProgrammaticMoveRef = useRef(false);
  const prevCommandRef = useRef({ centerKey: '', zoom: null, boundsKey: '' });

  // Sync React state when user zooms or pans manually, so zoom level is never overridden by background re-renders
  useEffect(() => {
    const handleMoveEnd = () => {
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        return;
      }
      const c = map.getCenter();
      const z = map.getZoom();
      prevCommandRef.current.centerKey = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
      prevCommandRef.current.zoom = z;
      if (onMapChange) {
        onMapChange([c.lat, c.lng], z);
      }
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMapChange]);

  // Execute camera navigation ONLY when explicit command coordinates or bounds change
  useEffect(() => {
    if (bounds) {
      const boundsKey = JSON.stringify(bounds);
      if (boundsKey !== prevCommandRef.current.boundsKey) {
        prevCommandRef.current.boundsKey = boundsKey;
        isProgrammaticMoveRef.current = true;
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
      }
    } else if (center) {
      const centerKey = `${Number(center[0]).toFixed(4)},${Number(center[1]).toFixed(4)}`;
      const zoomChanged = zoom != null && Math.abs(zoom - (prevCommandRef.current.zoom ?? -1)) > 0.05;
      const centerChanged = centerKey !== prevCommandRef.current.centerKey;

      if (centerChanged || zoomChanged) {
        prevCommandRef.current.centerKey = centerKey;
        if (zoom != null) prevCommandRef.current.zoom = zoom;
        isProgrammaticMoveRef.current = true;
        const targetZoom = zoom != null ? zoom : map.getZoom();
        map.setView(center, targetZoom, { animate: true });
      }
    }
  }, [center, zoom, bounds, map]);

  return null;
}

function CorridorMap({ 
  stations = [], 
  sections = [], 
  trains = [], 
  selectedTrainId, 
  onSelectTrain,
  disruptions = {},
  hideInternalHeader = false
}) {
  // Read dark/light theme state
  let isDark = false;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx?.theme === 'dark';
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  const [mapCenterState, setMapCenterState] = useState(CORRIDOR_CENTER);
  const [mapZoomState, setMapZoomState] = useState(DEFAULT_ZOOM);
  const [mapBoundsState, setMapBoundsState] = useState(null);
  const [rajasthanTracks, setRajasthanTracks] = useState(null);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const handleMapChange = useCallback((newCenter, newZoom) => {
    setMapCenterState(newCenter);
    setMapZoomState(newZoom);
  }, []);

  // Memoized GeoJSON track style to avoid re-computations
  const osmTracksStyle = useMemo(() => ({
    color: isDark ? '#38BDF8' : '#64748B',
    weight: 1.4,
    opacity: isDark ? 0.45 : 0.55,
    lineCap: 'round',
    lineJoin: 'round'
  }), [isDark]);

  // Interactive Route & Destination Tracker State
  const [fromStationCode, setFromStationCode] = useState('JP');
  const [toStationCode, setToStationCode] = useState('JU');
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/rajasthan_tracks.geojson')
      .then(res => res.json())
      .then(data => setRajasthanTracks(data))
      .catch(err => console.error("Error loading Rajasthan rail geojson:", err));
  }, []);

  // Auto-pan camera to selected train ONLY when a user actively changes/selects a train
  const prevSelectedTrainIdRef = useRef(selectedTrainId);
  useEffect(() => {
    if (selectedTrainId && selectedTrainId !== prevSelectedTrainIdRef.current) {
      prevSelectedTrainIdRef.current = selectedTrainId;
      const tr = trains?.find(t => t.train_number === selectedTrainId);
      if (tr && tr.lat && tr.lng) {
        setMapBoundsState(null);
        setMapCenterState([tr.lat, tr.lng]);
        setMapZoomState(prev => (prev < 11 ? 12 : prev));
      }
    }
  }, [selectedTrainId, trains]);

  // Compute route metadata, active distance, section IDs, and trains between Origin and Destination
  const selectedRouteInfo = useMemo(() => {
    if (!stations.length || !fromStationCode || !toStationCode) return null;
    const fromSt = stations.find(s => s.code === fromStationCode);
    const toSt = stations.find(s => s.code === toStationCode);
    if (!fromSt || !toSt) return null;

    const minKm = Math.min(fromSt.km, toSt.km);
    const maxKm = Math.max(fromSt.km, toSt.km);
    const distanceKm = Math.abs(toSt.km - fromSt.km).toFixed(1);

    // Stations along the route
    const routeStations = stations.filter(s => s.km >= minKm && s.km <= maxKm);

    // Section IDs along the route
    const routeSectionIds = new Set();
    sections.forEach(sec => {
      const sFrom = stations.find(s => s.code === sec.from);
      const sTo = stations.find(s => s.code === sec.to);
      if (sFrom && sTo) {
        const secMin = Math.min(sFrom.km, sTo.km);
        const secMax = Math.max(sFrom.km, sTo.km);
        if (secMin >= minKm - 0.5 && secMax <= maxKm + 0.5) {
          routeSectionIds.add(sec.id);
        }
      }
    });

    // Trains currently running on this segment
    const trainsOnRoute = trains.filter(t => {
      const tKm = t.current_km || 0;
      return tKm >= minKm && tKm <= maxKm;
    });

    // Nearest train arrival to destination
    let nearestArrival = null;
    trainsOnRoute.forEach(t => {
      const etaObj = t.dynamic_etas?.find(e => e.station_code === toStationCode);
      if (etaObj) {
        if (!nearestArrival || (etaObj.delay_minutes < nearestArrival.delay_minutes)) {
          nearestArrival = {
            train_number: t.train_number,
            train_name: t.train_name,
            eta: etaObj.dynamic_ml_eta || etaObj.scheduled_arrival || 'On Time',
            delay_minutes: etaObj.delay_minutes || 0
          };
        }
      } else {
        const distRemaining = Math.abs(toSt.km - (t.current_km || 0));
        const speed = t.current_speed_kmh || 90;
        const minsRemaining = Math.max(1, Math.round((distRemaining / Math.max(speed, 30)) * 60));
        if (!nearestArrival) {
          nearestArrival = {
            train_number: t.train_number,
            train_name: t.train_name,
            eta: `in ~${minsRemaining}m`,
            delay_minutes: 0
          };
        }
      }
    });

    // Bounding box for camera framing
    const lats = routeStations.map(s => s.lat);
    const lngs = routeStations.map(s => s.lng);
    const bounds = [
      [Math.min(...lats) - 0.18, Math.min(...lngs) - 0.18],
      [Math.max(...lats) + 0.18, Math.max(...lngs) + 0.18]
    ];

    return {
      fromSt,
      toSt,
      fromName: fromSt.name,
      toName: toSt.name,
      distanceKm,
      routeStations,
      routeSectionIds,
      trainsOnRoute,
      nearestArrival,
      bounds
    };
  }, [stations, sections, trains, fromStationCode, toStationCode]);

  // Build coordinate lines for each section
  const sectionPolylines = useMemo(() => {
    if (!stations.length || !sections.length) return [];
    
    const stationMap = new Map(stations.map(s => [s.code, s]));
    
    return sections.map(sec => {
      const sFrom = stationMap.get(sec.from);
      const sTo = stationMap.get(sec.to);
      if (!sFrom || !sTo) return null;

      let color = isDark ? "#38BDF8" : "#0284C7"; // High Speed Blue
      if (sec.occupancy_ratio > 0.85) {
        color = "#EF4444"; // Congested Rose Red
      } else if (sec.occupancy_ratio > 0.60) {
        color = "#F59E0B"; // Caution Warm Amber
      }

      if (disruptions.maintenance_section === sec.id) {
        color = "#F97316";
      } else if (disruptions.tsr_section === sec.id) {
        color = "#A855F7";
      } else if (disruptions.rain) {
        color = "#06B6D4";
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
  }, [stations, sections, disruptions, isDark]);

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

  const handleSwapStations = () => {
    const prevFrom = fromStationCode;
    const prevTo = toStationCode;
    setFromStationCode(prevTo);
    setToStationCode(prevFrom);
  };

  const handleToggleRoute = () => {
    if (!isRouteActive) {
      setIsRouteActive(true);
      if (selectedRouteInfo?.bounds) {
        setMapBoundsState(selectedRouteInfo.bounds);
      }
    } else {
      setIsRouteActive(false);
      setMapBoundsState(null);
    }
  };

  const handleClearRoute = () => {
    setIsRouteActive(false);
    setMapBoundsState(null);
    setMapCenterState(CORRIDOR_CENTER);
    setMapZoomState(DEFAULT_ZOOM);
  };

  const handleResetCorridor = () => {
    setIsRouteActive(false);
    setMapBoundsState(null);
    setMapCenterState(CORRIDOR_CENTER);
    setMapZoomState(DEFAULT_ZOOM);
  };

  const handleFocusTrain = useCallback((trNumber) => {
    if (onSelectTrain) onSelectTrain(trNumber);
    prevSelectedTrainIdRef.current = trNumber;
    const tr = trains?.find(t => t.train_number === trNumber);
    if (tr && tr.lat && tr.lng) {
      setMapBoundsState(null);
      setMapCenterState([tr.lat, tr.lng]);
      setMapZoomState(prev => (prev < 11 ? 12 : prev));
    }
  }, [onSelectTrain, trains]);

  return (
    <div className={`relative w-full h-full corridor-fullscreen-map overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#070B14]' : 'bg-[#F8FAFC]'}`}>
      <style>{`
        .corridor-fullscreen-map .leaflet-top.leaflet-right {
          top: 3.75rem !important;
          right: 0.875rem !important;
        }
        .corridor-fullscreen-map .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.25) !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
        }
        .corridor-fullscreen-map .leaflet-control-zoom a {
          background-color: ${isDark ? '#0A0F1D' : '#FFFFFF'} !important;
          color: ${isDark ? '#38BDF8' : '#0F172A'} !important;
          border-bottom: 1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'} !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          transition: all 0.15s ease !important;
        }
        .corridor-fullscreen-map .leaflet-control-zoom a:hover {
          background-color: ${isDark ? '#1E293B' : '#F1F5F9'} !important;
          color: #0284C7 !important;
        }
        .corridor-fullscreen-map .leaflet-control-zoom a.leaflet-disabled {
          opacity: 0.35 !important;
          cursor: not-allowed !important;
        }
      `}</style>
      
      {/* 1. Left Command Side Box (Sidebar) */}
      {isSidebarOpen ? (
        <aside
          aria-label="Corridor Command & Trains Sidebar"
          className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-3 bottom-2.5 sm:bottom-3 w-[330px] sm:w-[360px] max-w-[calc(100vw-24px)] z-[930] pointer-events-auto flex flex-col rounded-2xl shadow-xl overflow-hidden animate-fadeIn transition-colors duration-200 border ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 text-white'
              : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-slate-300/40'
          }`}
        >
          {/* Header: Corridor Identification & Collapse */}
          <div className={`p-3.5 border-b shrink-0 flex items-center justify-between gap-2 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/90'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-sky-500/15 border-sky-400/30' : 'bg-sky-50 border-sky-200'
              }`}>
                <Train className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Rajasthan Corridor
                  </span>
                  <span className={`px-1.5 py-0.5 text-[9.5px] font-mono font-bold rounded border ${
                    isDark ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' : 'bg-sky-100 text-sky-700 border-sky-300'
                  }`}>
                    JP ➔ JU
                  </span>
                </div>
                <p className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  412 km · Dynamic ML ETA Engine
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              title="Collapse Side Box"
              className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Route & Segment Tracker Module */}
          <div className={`p-3 border-b shrink-0 space-y-2.5 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Navigation className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                <span>Route Tracker</span>
              </span>
              {isRouteActive ? (
                <button
                  onClick={handleClearRoute}
                  className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              ) : (
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Direct Path</span>
              )}
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-end">
              <div className="min-w-0">
                <label className={`text-[9px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Origin</label>
                <select
                  value={fromStationCode}
                  onChange={(e) => {
                    setFromStationCode(e.target.value);
                    if (!isRouteActive) setIsRouteActive(true);
                  }}
                  className={`w-full text-xs font-semibold rounded-xl px-2 py-1.5 outline-none cursor-pointer truncate transition-colors border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  {stations.map(st => (
                    <option key={`from-${st.code}`} value={st.code} disabled={st.code === toStationCode} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSwapStations}
                title="Swap Origin & Destination"
                className={`p-2 rounded-xl transition active:scale-95 cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-sky-600 shadow-2xs'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>

              <div className="min-w-0">
                <label className={`text-[9px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Destination</label>
                <select
                  value={toStationCode}
                  onChange={(e) => {
                    setToStationCode(e.target.value);
                    if (!isRouteActive) setIsRouteActive(true);
                  }}
                  className={`w-full text-xs font-semibold rounded-xl px-2 py-1.5 outline-none cursor-pointer truncate transition-colors border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  {stations.map(st => (
                    <option key={`to-${st.code}`} value={st.code} disabled={st.code === fromStationCode} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Highlight Route Action Button */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                onClick={handleToggleRoute}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRouteActive
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isRouteActive ? 'Route Active' : 'Highlight Route on Track'}</span>
              </button>
            </div>

            {/* Telemetry info when active */}
            {isRouteActive && selectedRouteInfo && (
              <div className={`p-2 rounded-xl border text-[11px] font-mono space-y-1 ${
                isDark ? 'bg-sky-950/40 border-sky-800/60 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold">{selectedRouteInfo.fromSt.code} ➔ {selectedRouteInfo.toSt.code}</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{selectedRouteInfo.distanceKm} km</span>
                </div>
                <div className={`text-[10px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>En-route: {selectedRouteInfo.trainsOnRoute.length} trains</span>
                  {selectedRouteInfo.nearestArrival && (
                    <span className="text-amber-500 font-sans font-semibold">Next: #{selectedRouteInfo.nearestArrival.train_number}</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Jump Landmark Navigation Presets */}
            <div className="pt-0.5">
              <div className={`text-[9px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Jump Presets</div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                {QUICK_NAV_TARGETS.map(target => {
                  const isActive = !isRouteActive && Math.abs(mapCenterState[0] - target.center[0]) < 0.05 && Math.abs(mapCenterState[1] - target.center[1]) < 0.05;
                  return (
                    <button
                      key={target.id}
                      onClick={() => {
                        setIsRouteActive(false);
                        setMapBoundsState(null);
                        setMapCenterState(target.center);
                        setMapZoomState(target.zoom);
                      }}
                      className={`px-2 py-1 text-[10.5px] font-bold rounded-lg transition-colors active:scale-95 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-xs'
                          : isDark
                            ? 'bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
                      }`}
                    >
                      {target.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Corridor Trains Header */}
          <div className={`p-2.5 px-3 border-b shrink-0 flex items-center justify-between transition-colors ${
            isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-100/70'
          }`}>
            <div className="flex items-center gap-1.5">
              <Train className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Corridor Trains ({trains.length})</span>
            </div>
            <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
              Live Telemetry
            </span>
          </div>

          {/* Scrollable List of Trains */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
            {trains.map((train) => {
              const isSelected = selectedTrainId === train.train_number;
              const isDelayed = (train.current_delay_min || 0) > 5;
              return (
                <div
                  key={train.train_number}
                  onClick={() => handleFocusTrain(train.train_number)}
                  className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-2xs ${
                    isSelected
                      ? isDark
                        ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-400/40 text-white'
                        : 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-500/30 text-slate-900'
                      : isDark
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600 text-slate-200 hover:text-white'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Train className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      <span className={`font-mono text-xs font-bold tracking-tight truncate ${
                        isDark ? 'text-sky-400' : 'text-sky-600'
                      }`}>
                        #{train.train_number}
                      </span>
                      <span className={`text-[10px] truncate hidden sm:inline ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        · {train.category || 'Express'}
                      </span>
                    </div>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                      isDelayed
                        ? isDark
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                        : isDark
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isDelayed ? `+${Math.round(train.current_delay_min)}m Late` : 'On Time'}
                    </span>
                  </div>

                  <div className={`font-bold text-xs mt-1 truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {train.train_name}
                  </div>

                  <div className={`flex items-center justify-between text-[10.5px] mt-1.5 font-mono pt-1 border-t ${
                    isDark ? 'border-slate-700/50 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span>Speed: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{Math.round(train.current_speed_kmh || 0)} km/h</strong></span>
                    <span>Pos: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{Math.round(train.current_km || 0)} km</strong></span>
                    <span className={`font-sans font-semibold text-[10px] ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Track ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      ) : (
        /* Collapsed Floating Trigger */
        <button
          onClick={() => setIsSidebarOpen(true)}
          title="Open Corridor Side Box"
          className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-3 z-[930] pointer-events-auto px-3 py-2 border rounded-xl shadow-xl flex items-center gap-2 transition cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 text-white hover:border-slate-600'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-slate-300/40'
          }`}
        >
          <Train className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
          <span className="text-xs font-bold font-mono">JP ➔ AII ➔ JU</span>
          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({trains.length} Trains)</span>
          <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      )}

      {/* Active Environmental & Operational Conditions Alert Pill */}
      {(disruptions.fog || disruptions.rain || disruptions.heatwave || disruptions.signal_halt_train || disruptions.maintenance_section || disruptions.tsr_section) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[930] pointer-events-auto max-w-[90vw] animate-fadeIn">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg border text-xs font-semibold backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-amber-500/50 text-slate-800 dark:text-slate-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
            <span className="truncate">
              {disruptions.rain ? "🌧️ Monsoon Rain: Track waterlogging caution (MPS 30 km/h)" :
               disruptions.fog ? "🌪️ Thar Sandstorm: Visibility drop (MPS 60 km/h)" :
               disruptions.heatwave ? `☀️ Extreme Heat (${Math.round(disruptions.ambient_temp_c || 47)}°C): Rail expansion alert (MPS 50 km/h)` :
               disruptions.tsr_section ? `⚠️ TSR Caution Order (${disruptions.tsr_speed_kmh || 40} km/h on ${disruptions.tsr_section})` :
               disruptions.signal_halt_train ? `🔴 Signal Failure: Train #${disruptions.signal_halt_train} held at Red Aspect` :
               disruptions.maintenance_section ? `🚧 Maintenance Block: Single-line working on ${disruptions.maintenance_section}` : ""}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-3 sm:bottom-3.5 right-14 sm:right-16 z-[910] pointer-events-auto flex items-center gap-1.5">
        <button
          onClick={() => setShowAllTracks(!showAllTracks)}
          title={showAllTracks ? "Hide Full Rajasthan Rail Network (4,594 tracks)" : "Show Full Rajasthan Rail Network (4,594 tracks)"}
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors active:scale-95 shadow-md cursor-pointer ${
            showAllTracks
              ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/20'
              : isDark
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">{showAllTracks ? "4,594 Tracks: ON" : "Tracks"}</span>
        </button>

        <button
          onClick={handleResetCorridor}
          title="Re-Center Full Rajasthan Corridor (JP ➔ AII ➔ JU)"
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-colors active:scale-95 shadow-md cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* The Leaflet Map Canvas */}
      <MapContainer
        key={isDark ? 'map-dark' : 'map-light'}
        center={CORRIDOR_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom={true}
        wheelDebounceTime={40}
        wheelPxPerZoomLevel={60}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
        preferCanvas={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: isDark ? '#070B14' : '#F8FAFC' }}
        attributionControl={false}
      >
        <ZoomControl position="bottomright" />
        <ChangeMapView center={mapCenterState} zoom={mapZoomState} bounds={mapBoundsState} onMapChange={handleMapChange} />

        {/* Vector Base Canvas (Light Gray for Light Theme, Dark Canvas for Dark Theme) */}
        <TileLayer
          key={isDark ? 'tiles-base-dark' : 'tiles-base-light'}
          url={
            isDark
              ? "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              : "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          }
          maxNativeZoom={16}
          maxZoom={18}
          minZoom={6}
        />
        {/* Subtle Labels Overlay */}
        <TileLayer
          key={isDark ? 'tiles-ref-dark' : 'tiles-ref-light'}
          url={
            isDark
              ? "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              : "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          }
          maxNativeZoom={16}
          maxZoom={18}
          minZoom={6}
          opacity={isDark ? 0.75 : 0.65}
        />

        {/* Real Rajasthan 4,594 OpenStreetMap Railway Tracks (From Overpass Turbo export.geojson) */}
        {showAllTracks && rajasthanTracks && (
          <GeoJSON
            key={`rajasthan-osm-tracks-${isDark ? 'dark' : 'light'}`}
            data={rajasthanTracks}
            style={osmTracksStyle}
          />
        )}

        {/* 4. DYNAMIC ILLUMINATED RAILWAY TRACK CORRIDOR (uber-track-system) */}
        
        {/* Layer 4a: Foundation Ballast Bed (Authentic railway stone ballast casing) */}
        {sectionPolylines.map((line) => {
          const isPartOfRoute = isRouteActive && selectedRouteInfo?.routeSectionIds.has(line.id);
          const isDimmed = isRouteActive && !isPartOfRoute;
          return (
            <Polyline
              key={`bed-${line.id}`}
              positions={line.positions}
              pathOptions={{
                color: isPartOfRoute 
                  ? (isDark ? '#1C1917' : '#D6D3D1') 
                  : (isDark ? '#0A1122' : '#CBD5E1'),
                weight: isPartOfRoute ? 12 : (isDark ? 12 : 9),
                opacity: isDimmed ? (isDark ? 0.2 : 0.08) : (isPartOfRoute ? (isDark ? 0.95 : 0.85) : (isDark ? 0.75 : 0.45)),
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          );
        })}

        {/* Layer 4b: Bottleneck / Disruption Contention Aura */}
        {sectionPolylines.filter(l => l.status === 'CONGESTED' || disruptions.maintenance_section === l.id).map((line) => (
          <Polyline
            key={`alert-${line.id}`}
            positions={line.positions}
            pathOptions={{
              color: '#EF4444',
              weight: 16,
              opacity: isDark ? 0.55 : 0.4,
              lineCap: 'round'
            }}
          />
        ))}

        {/* Layer 4c: Active & Standard Railway Sleeper Ties (Crossbars) */}
        {sectionPolylines.map((line) => {
          const isPartOfRoute = isRouteActive && selectedRouteInfo?.routeSectionIds.has(line.id);
          const isDimmed = isRouteActive && !isPartOfRoute;
          const activeTrain = activeSectionMap.get(line.id);
          
          let trackThemeColor = activeTrain?.color || line.color;
          if (activeTrain) {
            const cat = (activeTrain.category || '').toLowerCase();
            if (cat.includes('vande')) trackThemeColor = isDark ? '#00F0FF' : '#0284C7';
            else if (cat.includes('shatabdi')) trackThemeColor = isDark ? '#38BDF8' : '#0284C7';
            else if (cat.includes('rajdhani')) trackThemeColor = isDark ? '#FB7185' : '#E11D48';
            else if (cat.includes('superfast')) trackThemeColor = isDark ? '#34D399' : '#10B981';
            else if (cat.includes('mail') || cat.includes('express')) trackThemeColor = isDark ? '#A78BFA' : '#8B5CF6';
          }

          return (
            <React.Fragment key={`sleeper-group-${line.id}`}>
              {/* Highlight background glow on active block sections where trains are present or route is active */}
              {(activeTrain || isPartOfRoute) && (
                <Polyline
                  positions={line.positions}
                  pathOptions={{
                    color: isPartOfRoute ? (isDark ? '#F59E0B' : '#D97706') : trackThemeColor,
                    weight: isPartOfRoute ? 10 : 10,
                    opacity: isDimmed ? 0.15 : (isPartOfRoute ? (isDark ? 0.35 : 0.25) : (isDark ? 0.55 : 0.4)),
                    lineCap: 'round'
                  }}
                />
              )}
              {/* Perpendicular railroad tie crossbars (Real timber/concrete sleepers) */}
              <Polyline
                positions={line.positions}
                pathOptions={{
                  color: isPartOfRoute 
                    ? (isDark ? '#292524' : '#44403C') 
                    : (activeTrain ? (isDark ? '#070B14' : '#0F172A') : (isDark ? '#334155' : '#94A3B8')),
                  weight: isPartOfRoute ? 8 : (activeTrain ? 8 : 5),
                  opacity: isDimmed ? 0.15 : (isPartOfRoute ? 0.95 : (activeTrain ? 0.9 : (isDark ? 0.55 : 0.35))),
                  dashArray: isPartOfRoute ? '2.5, 4.5' : (activeTrain ? '3, 6' : '2, 7'),
                  className: 'sleeper-track'
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Layer 4d: Main High-Speed Trunk Rails & Dual Steel Rails for Highlighted Route */}
        {sectionPolylines.map((line) => {
          const isPartOfRoute = isRouteActive && selectedRouteInfo?.routeSectionIds.has(line.id);
          const isDimmed = isRouteActive && !isPartOfRoute;
          const routeRailColor = isDark ? '#FBBF24' : '#D97706';
          const routeBallastFill = isDark ? '#1C1917' : '#D6D3D1';

          return (
            <React.Fragment key={`trunk-group-${line.id}`}>
              {/* When part of route: REAL DUAL PARALLEL STEEL RAILS in Golden Amber */}
              {isPartOfRoute ? (
                <>
                  {/* Outer Steel Rail Band (Width 5) */}
                  <Polyline
                    positions={line.positions}
                    pathOptions={{
                      color: routeRailColor,
                      weight: 5,
                      opacity: 1.0,
                      lineCap: 'round'
                    }}
                  />
                  {/* Hollow Center Gap (Width 2) - Leaves TWO distinct parallel steel rails! */}
                  <Polyline
                    positions={line.positions}
                    pathOptions={{
                      color: routeBallastFill,
                      weight: 2,
                      opacity: 1.0,
                      lineCap: 'round'
                    }}
                  />
                </>
              ) : (
                <Polyline
                  key={`trunk-${line.id}`}
                  positions={line.positions}
                  pathOptions={{
                    color: isDimmed ? (isDark ? '#1E293B' : '#CBD5E1') : line.color,
                    weight: isDimmed ? 2 : 3,
                    opacity: isDimmed ? 0.25 : 0.95,
                    lineCap: 'round'
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs font-sans p-1">
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{line.from} ➔ {line.to}</p>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        Occupancy: <span className="font-mono text-sky-400 font-bold">{Math.round(line.occupancy * 100)}%</span> ({line.status})
                      </p>
                      {isPartOfRoute && (
                        <p className="text-amber-500 font-bold text-[10px] pt-0.5">🎯 Active Tracked Route</p>
                      )}
                    </div>
                  </Tooltip>
                </Polyline>
              )}
            </React.Fragment>
          );
        })}

        {/* Layer 4e: Dynamic Route Flow (Animated Signal Pulse along center of track) */}
        {sectionPolylines.map((line) => {
          const isPartOfRoute = isRouteActive && selectedRouteInfo?.routeSectionIds.has(line.id);
          if (isRouteActive && !isPartOfRoute) return null;
          return (
            <Polyline
              key={`flow-${line.id}`}
              positions={line.positions}
              pathOptions={{
                color: isPartOfRoute ? (isDark ? '#FEF08A' : '#F59E0B') : (isDark ? '#00F0FF' : '#38BDF8'),
                weight: isPartOfRoute ? 1.5 : 3,
                opacity: isDark ? 0.95 : 0.85,
                dashArray: isPartOfRoute ? '6, 12' : '8, 8',
                className: 'animated-route-flow'
              }}
            />
          );
        })}


        {/* 5. STATIONS: CONCENTRIC RINGS & INTERCHANGE HUBS */}
        {stations.map((st) => {
          const isOrigin = isRouteActive && st.code === fromStationCode;
          const isDestination = isRouteActive && st.code === toStationCode;
          const isOnRoute = !isRouteActive || selectedRouteInfo?.routeStations.some(s => s.code === st.code);
          return (
            <Marker
              key={`st-${st.code}`}
              position={[st.lat, st.lng]}
              icon={createStationNodeIcon(st, isDark, { isOrigin, isDestination, isOnRoute, isRouteActive })}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>{st.name} ({st.code})</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">Corridor KM: <span className="font-mono font-bold text-slate-900 dark:text-white">{st.km} km</span></p>
                  <p className="text-slate-600 dark:text-slate-300">Platforms: <span className="font-mono font-bold text-slate-900 dark:text-white">{st.platforms}</span></p>
                  {isOrigin && <p className="text-emerald-500 font-bold">🟢 Selected Route Origin</p>}
                  {isDestination && <p className="text-amber-500 font-bold">🎯 Selected Route Destination</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 6. CYBER-TACTICAL TRAIN VEHICLES (Locomotive puck with GPS radar waves & headlight cone) */}
        {trains.map((train) => {
          const isSelected = selectedTrainId === train.train_number;
          const isOnRoute = !isRouteActive || selectedRouteInfo?.trainsOnRoute.some(t => t.train_number === train.train_number);
          const routeEta = isRouteActive && selectedRouteInfo?.toSt && train.dynamic_etas?.find(e => e.station_code === toStationCode);
          return (
            <Marker
              key={train.train_number}
              position={[train.lat, train.lng]}
              icon={createUberTrainIcon(train, isSelected, isDark, {
                isRouteActive,
                isOnRoute,
                destinationEta: routeEta?.dynamic_ml_eta,
                stations,
                sections
              })}
              eventHandlers={{
                click: () => handleFocusTrain(train.train_number)
              }}
            >
              <Popup>
                <div className="p-2 font-sans text-xs space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{train.train_name}</h4>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">#{train.train_number} • {train.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Velocity</span>
                      <span className="font-mono font-bold text-sky-500">{Math.round(train.current_speed_kmh)} km/h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Status</span>
                      <span className={`font-mono font-bold ${train.current_delay_min > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {train.current_delay_min > 5 ? `+${Math.round(train.current_delay_min)}m` : 'On Time'}
                      </span>
                    </div>
                  </div>
                  {isRouteActive && selectedRouteInfo && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-amber-500 font-bold block">
                        🎯 ETA to {selectedRouteInfo.toName}:
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {routeEta?.dynamic_ml_eta || 'En-route'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => handleFocusTrain(train.train_number)}
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
export default React.memo(CorridorMap);
