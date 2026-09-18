import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { MOCK_STATIONS } from '../data/mockStations';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { calculateJourneyDuration } from '../utils/time';
import {
  Compass,
  ArrowRightLeft,
  ArrowRight,
  Calendar,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronDown,
  Train as TrainIcon
} from 'lucide-react';

export const JourneyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { trains } = useSimulation();

  const [fromStationCode, setFromStationCode] = useState<string>('NDLS');
  const [toStationCode, setToStationCode] = useState<string>('MMCT');
  const [travelDate, setTravelDate] = useState<string>('Today');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const handleSwapStations = () => {
    const temp = fromStationCode;
    setFromStationCode(toStationCode);
    setToStationCode(temp);
  };

  // Find all trains that connect From station to To station in sequence
  const matchingTrains = useMemo(() => {
    return trains
      .map(train => {
        const fromIndex = train.stops.findIndex(
          s => s.stationCode.toUpperCase() === fromStationCode.toUpperCase()
        );
        const toIndex = train.stops.findIndex(
          s => s.stationCode.toUpperCase() === toStationCode.toUpperCase()
        );

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
          const fromStop = train.stops[fromIndex];
          const toStop = train.stops[toIndex];
          const stopsCount = toIndex - fromIndex - 1;
          const sectionDistance = toStop.distanceFromOriginKm - fromStop.distanceFromOriginKm;
          const depTime = fromStop.scheduledDeparture !== '--' ? fromStop.scheduledDeparture : fromStop.scheduledArrival;
          const arrTime = toStop.scheduledArrival !== '--' ? toStop.scheduledArrival : toStop.scheduledDeparture;
          const duration = calculateJourneyDuration(depTime, arrTime, toStop.day - fromStop.day);

          return {
            train,
            fromStop,
            toStop,
            stopsCount,
            sectionDistance,
            depTime,
            arrTime,
            duration
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [trains, fromStationCode, toStationCode]);

  const toggleCompare = (trainId: string) => {
    setSelectedForCompare(prev =>
      prev.includes(trainId)
        ? prev.filter(id => id !== trainId)
        : prev.length < 3
        ? [...prev, trainId]
        : prev
    );
  };

  const comparedTrains = matchingTrains.filter(m =>
    selectedForCompare.includes(m.train.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Point-to-Point Route Comparison</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Journey Planner
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
          Find and compare direct train services between two stations. Compare schedules, stops, running delays, and transit times.
        </p>
      </div>

      {/* Route Search Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-2xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* From Station */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">From Station</label>
            <div className="relative">
              <select
                value={fromStationCode}
                onChange={e => setFromStationCode(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-9 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {MOCK_STATIONS.map(st => (
                  <option key={st.code} value={st.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {st.name} ({st.code}) — {st.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={handleSwapStations}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Swap origin and destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To Station */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">To Station</label>
            <div className="relative">
              <select
                value={toStationCode}
                onChange={e => setToStationCode(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-9 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {MOCK_STATIONS.map(st => (
                  <option key={st.code} value={st.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {st.name} ({st.code}) — {st.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Travel Window</label>
            <div className="relative">
              <select
                value={travelDate}
                onChange={e => setTravelDate(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-9 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Today" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Today (Simulated Live)</option>
                <option value="Tomorrow" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tomorrow</option>
                <option value="Weekend" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">This Weekend</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Corridor Shortcut Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Popular Routes:</span>
          <button
            onClick={() => {
              setFromStationCode('NDLS');
              setToStationCode('MMCT');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-[11px] cursor-pointer"
          >
            New Delhi ↔ Mumbai Central
          </button>
          <button
            onClick={() => {
              setFromStationCode('NDLS');
              setToStationCode('BSB');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-[11px] cursor-pointer"
          >
            New Delhi ↔ Varanasi
          </button>
          <button
            onClick={() => {
              setFromStationCode('NDLS');
              setToStationCode('LKO');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-[11px] cursor-pointer"
          >
            New Delhi ↔ Lucknow
          </button>
          <button
            onClick={() => {
              setFromStationCode('MYS');
              setToStationCode('MAS');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-[11px] cursor-pointer"
          >
            Mysuru ↔ Chennai Central
          </button>
        </div>
      </div>

      {/* Compared Trains Matrix (when user checks compare boxes) */}
      {comparedTrains.length > 0 && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Side-by-Side Comparison ({comparedTrains.length} selected)
            </h2>
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparedTrains.map(({ train, depTime, arrTime, duration, stopsCount }) => (
              <div
                key={train.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">
                    {train.number}
                  </span>
                  <TrainStatusBadge
                    state={train.currentStatus.state}
                    delayMinutes={train.currentStatus.delayMinutes}
                    size="sm"
                  />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{train.name}</div>
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Departure:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{depTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Arrival:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{arrTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Intermediate Stops:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{stopsCount} stops</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/train/${train.id}`)}
                  className="w-full py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  Track Live Status →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Available Direct Services ({matchingTrains.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select up to 3 services to compare journey parameters side by side.
          </p>
        </div>
      </div>

      {/* Results List */}
      {matchingTrains.length > 0 ? (
        <div className="space-y-3">
          {matchingTrains.map(({ train, depTime, arrTime, duration, stopsCount, sectionDistance }) => {
            const isCompared = selectedForCompare.includes(train.id);
            return (
              <div
                key={train.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all p-5 ${
                  isCompared
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Train Identity */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {train.number}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{train.name}</h3>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {train.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Runs: {train.daysOfOperation.join(', ')} · Classes: {train.classes.join(', ')}
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-center gap-6 text-xs border-y md:border-y-0 py-3 md:py-0 border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Depart {fromStationCode}
                      </div>
                      <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {depTime}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-semibold">
                        {duration}
                      </div>
                      <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full my-1" />
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {stopsCount} stops ({sectionDistance} km)
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Arrive {toStationCode}
                      </div>
                      <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {arrTime}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Compare checkbox */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <TrainStatusBadge
                      state={train.currentStatus.state}
                      delayMinutes={train.currentStatus.delayMinutes}
                    />

                    {/* Compare toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(train.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Compare</span>
                    </label>

                    <button
                      onClick={() => navigate(`/train/${train.id}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <TrainIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Direct Trains Found Between {fromStationCode} and {toStationCode}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try checking high-traffic corridors such as New Delhi to Mumbai Central, New Delhi to Varanasi, or Mysuru to Chennai Central.
          </p>
        </div>
      )}
    </div>
  );
};
