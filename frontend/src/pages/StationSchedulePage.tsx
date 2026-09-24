import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { MOCK_STATIONS, getStationByCode } from '../data/mockStations';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { parseTimeToMinutes } from '../utils/time';
import {
  Building2,
  Clock,
  ArrowRight,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Train as TrainIcon,
  Wifi,
  Coffee,
  Accessibility
} from 'lucide-react';

export const StationSchedulePage: React.FC = () => {
  const { stationId = 'JU' } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { trains, simulatedTime } = useSimulation();

  const [activeTab, setActiveTab] = useState<'DEPARTURES' | 'ARRIVALS'>('DEPARTURES');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '2_HOURS' | '6_HOURS' | 'DELAYED'>('ALL');

  const currentStation = getStationByCode(stationId) || MOCK_STATIONS[0];

  // Extract all arrivals and departures for this station from mock trains
  const stationServices = useMemo(() => {
    const list: Array<{
      trainId: string;
      trainNumber: string;
      trainName: string;
      trainType: string;
      origin: string;
      destination: string;
      scheduledTime: string;
      estimatedTime: string;
      delayMinutes: number;
      platform: string;
      status: any;
      type: 'DEPARTURE' | 'ARRIVAL';
      isOriginOrTerminus: boolean;
    }> = [];

    trains.forEach(t => {
      const stopIndex = t.stops.findIndex(s => s.stationCode === currentStation.code);
      if (stopIndex !== -1) {
        const stop = t.stops[stopIndex];
        const isOrigin = stopIndex === 0;
        const isDestination = stopIndex === t.stops.length - 1;

        // Departure entry (if not terminal)
        if (!isDestination) {
          list.push({
            trainId: t.id,
            trainNumber: t.number,
            trainName: t.name,
            trainType: t.type,
            origin: t.origin.name,
            destination: t.destination.name,
            scheduledTime: stop.scheduledDeparture !== '--' ? stop.scheduledDeparture : stop.scheduledArrival,
            estimatedTime: stop.estimatedDeparture !== '--' ? stop.estimatedDeparture : stop.estimatedArrival,
            delayMinutes: stop.delayDepartureMinutes,
            platform: stop.platform,
            status: t.currentStatus.state,
            type: 'DEPARTURE',
            isOriginOrTerminus: isOrigin
          });
        }

        // Arrival entry (if not origin)
        if (!isOrigin) {
          list.push({
            trainId: t.id,
            trainNumber: t.number,
            trainName: t.name,
            trainType: t.type,
            origin: t.origin.name,
            destination: t.destination.name,
            scheduledTime: stop.scheduledArrival !== '--' ? stop.scheduledArrival : stop.scheduledDeparture,
            estimatedTime: stop.estimatedArrival !== '--' ? stop.estimatedArrival : stop.estimatedDeparture,
            delayMinutes: stop.delayArrivalMinutes,
            platform: stop.platform,
            status: t.currentStatus.state,
            type: 'ARRIVAL',
            isOriginOrTerminus: isDestination
          });
        }
      }
    });

    return list;
  }, [trains, currentStation.code]);

  // Filter based on active tab and time filter
  const filteredServices = useMemo(() => {
    return stationServices
      .filter(s => (activeTab === 'DEPARTURES' ? s.type === 'DEPARTURE' : s.type === 'ARRIVAL'))
      .filter(s => {
        if (timeFilter === 'DELAYED') return s.delayMinutes > 0;
        return true;
      })
      .sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime));
  }, [stationServices, activeTab, timeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors">
      {/* Station Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-bold text-base px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                {currentStation.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {currentStation.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentStation.zone} Zone
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
              <span>{currentStation.city}, {currentStation.state}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{currentStation.platforms} Platforms</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Station Clock: <strong className="font-mono text-slate-700 dark:text-slate-300">{simulatedTime}</strong>
              </span>
            </div>

            {/* Station Facilities */}
            {currentStation.facilities && (
              <div className="flex items-center gap-2 pt-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px]">Amenities:</span>
                {currentStation.facilities.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Station Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-auto">
            <div className="relative">
              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1">
                Switch Station
              </span>
              <div className="relative inline-block">
                <select
                  value={currentStation.code}
                  onChange={e => navigate(`/station/${e.target.value}`)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {MOCK_STATIONS.map(st => (
                    <option key={st.code} value={st.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Departures vs Arrivals Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DEPARTURES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DEPARTURES'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 dark:text-blue-500" />
            <span>Departures</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-200 text-slate-300 dark:text-slate-800">
              {stationServices.filter(s => s.type === 'DEPARTURE').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARRIVALS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ARRIVALS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-500" />
            <span>Arrivals</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-200 text-slate-300 dark:text-slate-800">
              {stationServices.filter(s => s.type === 'ARRIVAL').length}
            </span>
          </button>
        </div>

        {/* Time & Delay Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] uppercase font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> View:
          </span>
          <button
            onClick={() => setTimeFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              timeFilter === 'ALL'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setTimeFilter('DELAYED')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              timeFilter === 'DELAYED'
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Delayed Only
          </button>
        </div>
      </div>

      {/* Station Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        {filteredServices.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredServices.map(service => {
              const isDelayed = service.delayMinutes > 0;
              return (
                <div
                  key={`${service.trainId}-${service.type}`}
                  onClick={() => navigate(`/train/${service.trainId}`)}
                  className="group content-auto p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors grid grid-cols-1 lg:grid-cols-12 items-center gap-4 cursor-pointer"
                >
                  {/* Left: Train Identity & Service Details (5 cols) */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {service.trainNumber}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {service.trainName}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {service.trainType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{service.origin}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {service.destination}
                      </span>
                      {service.isOriginOrTerminus && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded ml-1">
                          {service.type === 'DEPARTURE' ? 'Originating Train' : 'Terminating Train'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Timing & Platform (4 cols, centered on desktop) */}
                  <div className="lg:col-span-4 flex items-center justify-start lg:justify-center gap-6 text-xs border-y lg:border-y-0 py-3 lg:py-0 border-slate-100 dark:border-slate-800">
                    <div className="min-w-[64px]">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                        Scheduled
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                        {service.scheduledTime}
                      </div>
                    </div>

                    <div className="min-w-[64px]">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                        Estimated
                      </div>
                      <div
                        className={`font-mono font-bold text-sm ${
                          isDelayed ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {service.estimatedTime}
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-center border border-slate-200 dark:border-slate-700 shrink-0">
                      <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">
                        Platform
                      </div>
                      <div className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        {service.platform || 'TBA'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Action (3 cols, right-aligned) */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3 shrink-0">
                    <TrainStatusBadge
                      state={service.status}
                      delayMinutes={service.delayMinutes}
                      size="sm"
                    />

                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Track →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <TrainIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              No services found for the selected view.
            </p>
            <button
              onClick={() => setTimeFilter('ALL')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Show all services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
