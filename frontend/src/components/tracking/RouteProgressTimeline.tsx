import React, { useState, useRef } from 'react';
import { Train, StationStop } from '../../types/train';
import {
  CheckCircle2,
  Circle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Info,
  Clock,
  Compass
} from 'lucide-react';

interface RouteProgressTimelineProps {
  train: Train;
  selectedStationCode: string;
  onSelectStation: (stationCode: string) => void;
}

export const RouteProgressTimelineComponent: React.FC<RouteProgressTimelineProps> = ({
  train,
  selectedStationCode,
  onSelectStation
}) => {
  const [expandedStationCode, setExpandedStationCode] = useState<string | null>(null);
  const currentStationRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (stationCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStationCode(prev => (prev === stationCode ? null : stationCode));
  };

  const jumpToCurrentLocation = () => {
    currentStationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
      {/* Timeline Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Route Progress & Station Timeline</span>
            <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
              ({train.stops.length} stations · {train.distanceKm} km)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any station to calculate custom arrival estimate or expand details.
          </p>
        </div>

        <button
          onClick={jumpToCurrentLocation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Jump to Current Position</span>
        </button>
      </div>
      {/* Vertical Station Timeline */}
      <div className="p-4 sm:p-6 relative">
        <div className="space-y-1.5 relative z-10">
          {train.stops.map((stop, idx) => {
            const isCompleted = stop.status === 'COMPLETED';
            const isCurrent = stop.status === 'CURRENT';
            const isNext = stop.status === 'NEXT';
            const isSelected = stop.stationCode === selectedStationCode;
            const isExpanded = expandedStationCode === stop.stationCode;
            const isDelayed = stop.delayArrivalMinutes > 0;
            const isOrigin = idx === 0;
            const isDestination = idx === train.stops.length - 1;

            return (
              <div
                key={stop.stationCode}
                ref={isCurrent ? currentStationRef : null}
                onClick={() => onSelectStation(stop.stationCode)}
                className={`group content-auto relative flex items-start gap-3.5 sm:gap-4 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 ring-1 ring-indigo-300 dark:ring-indigo-700 shadow-2xs'
                    : isCurrent
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-900/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Node & Dedicated Track Spine Column (Guaranteed Dead-Center Alignment & Zero Gap) */}
                <div className="relative shrink-0 flex flex-col items-center justify-start w-8 sm:w-9 -my-3.5 py-3.5 self-stretch">
                  {/* Top Incoming Track Segment */}
                  {!isOrigin && (
                    <div
                      className={`absolute top-0 h-[32px] w-0.5 left-1/2 -translate-x-1/2 ${
                        isCompleted || isCurrent
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                  {/* Bottom Outgoing Track Segment (Reaches -bottom-1.5 across the space-y-1.5 gap to seamlessly touch next stop) */}
                  {!isDestination && (
                    <div
                      className={`absolute top-[32px] -bottom-1.5 w-0.5 left-1/2 -translate-x-1/2 ${
                        isCompleted
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}

                  {/* Station Node Marker */}
                  <div className="relative z-10 flex items-center justify-center pt-1.5">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75" />
                        <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 text-white flex items-center justify-center shadow-xs">
                          <MapPin className="w-3 h-3" />
                        </div>
                      </div>
                    ) : isNext ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 text-white flex items-center justify-center shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-850 border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 flex items-center justify-center shadow-2xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Station Info Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-3">
                    {/* Station Name, Code & Badges */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {stop.stationName}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                        {stop.stationCode}
                      </span>

                      {isOrigin && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Origin
                        </span>
                      )}
                      {isDestination && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                          Destination
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 animate-pulse">
                          Current Location
                        </span>
                      )}
                      {isNext && (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300">
                          Next Stop
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                          Selected for ETA
                        </span>
                      )}
                    </div>

                    {/* Time & Expand Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isCompleted ? (
                        <div className="text-right flex flex-col items-end min-w-[70px]">
                          <div className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans uppercase font-medium">Departed</span>
                            <span>{stop.estimatedDeparture !== '--' ? stop.estimatedDeparture : stop.scheduledDeparture}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-end gap-1 leading-none mt-0.5">
                            <span>STD:</span>
                            <span>{stop.scheduledDeparture !== '--' ? stop.scheduledDeparture : stop.scheduledArrival}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right flex flex-col items-end min-w-[70px]">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-xs flex items-center justify-end gap-1.5">
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 font-sans uppercase">ETA</span>
                            <span>{stop.estimatedArrival !== '--' ? stop.estimatedArrival : stop.estimatedDeparture}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-end gap-1 leading-none mt-0.5">
                            <span>STA:</span>
                            <span>{stop.scheduledArrival !== '--' ? stop.scheduledArrival : stop.scheduledDeparture}</span>
                          </div>
                        </div>
                      )}

                      {/* Expand Button */}
                      <button
                        type="button"
                        onClick={e => toggleExpand(stop.stationCode, e)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="View station details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subline: Distance, Platform, Halt & Delays */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span>{stop.distanceFromOriginKm} km from start</span>
                    {stop.platform && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>Platform {stop.platform}</span>
                      </>
                    )}
                    {stop.haltMinutes > 0 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>Halt: {stop.haltMinutes}m</span>
                      </>
                    )}
                    {isDelayed && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono text-[11px]">
                          +{stop.delayArrivalMinutes}m delay
                        </span>
                      </>
                    )}
                  </div>

                  {/* Expanded Station Card */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2 animate-in fade-in-50 duration-150">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                            Scheduled Arrival
                          </span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {stop.scheduledArrival}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                            Scheduled Departure
                          </span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {stop.scheduledDeparture}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                            Platform
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Platform {stop.platform || 'TBA'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                            Section Delay
                          </span>
                          <span
                            className={`font-semibold font-mono ${
                              stop.delayArrivalMinutes > 0
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {stop.delayArrivalMinutes > 0
                              ? `+${stop.delayArrivalMinutes} min`
                              : 'On Time'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Click to set {stop.stationName} as the primary ETA tracker.
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectStation(stop.stationCode)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Target for ETA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const RouteProgressTimeline = React.memo(RouteProgressTimelineComponent);
