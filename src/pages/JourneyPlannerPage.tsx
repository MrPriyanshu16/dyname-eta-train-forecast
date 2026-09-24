import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_STATIONS } from '../data/mockStations';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { planJourney, searchStationsFromMaster, PlannedJourneyTrain } from '../utils/mlApi';
import {
  Compass,
  ArrowRightLeft,
  ArrowRight,
  Clock,
  RotateCcw,
  Sliders,
  ChevronRight,
  Train as TrainIcon,
  Search,
  MapPin,
  Info,
  Loader2
} from 'lucide-react';

export const JourneyPlannerPage: React.FC = () => {
  const navigate = useNavigate();

  const [fromStationCode, setFromStationCode] = useState<string>('JU');
  const [toStationCode, setToStationCode] = useState<string>('JP');
  const [availableStations, setAvailableStations] = useState<Array<{ code: string; name: string; city: string }>>(
    MOCK_STATIONS.map(s => ({ code: s.code, name: s.name, city: s.city }))
  );
  const [matchingTrains, setMatchingTrains] = useState<PlannedJourneyTrain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fetch verified Rajasthan stations from backend on mount
  useEffect(() => {
    let isMounted = true;
    searchStationsFromMaster('', 'rajasthan', 100)
      .then(res => {
        if (isMounted && res && res.stations && res.stations.length > 0) {
          setAvailableStations(
            res.stations.map(s => ({
              code: s.code,
              name: s.name,
              city: s.city || s.name
            }))
          );
        }
      })
      .catch(() => {
        // Fallback already populated from verified Rajasthan MOCK_STATIONS
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch journey plan whenever fromStation or toStation changes
  useEffect(() => {
    if (!fromStationCode || !toStationCode || fromStationCode === toStationCode) {
      setMatchingTrains([]);
      setLoading(false);
      setStatusMessage('Please select two distinct Rajasthan stations to plan your journey.');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setStatusMessage('');

    planJourney(fromStationCode, toStationCode, 'rajasthan')
      .then(res => {
        if (isMounted) {
          if (res && res.trains) {
            setMatchingTrains(res.trains);
            setStatusMessage(res.message || '');
          } else {
            setMatchingTrains([]);
            setStatusMessage('No matching Rajasthan-scope train service found.');
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMatchingTrains([]);
          setStatusMessage('No matching Rajasthan-scope train service found.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fromStationCode, toStationCode]);

  const handleSwapStations = () => {
    const temp = fromStationCode;
    setFromStationCode(toStationCode);
    setToStationCode(temp);
  };

  const toggleCompare = (trainNumber: string) => {
    setSelectedForCompare(prev =>
      prev.includes(trainNumber)
        ? prev.filter(num => num !== trainNumber)
        : prev.length < 3
        ? [...prev, trainNumber]
        : prev
    );
  };

  const comparedTrains = matchingTrains.filter(m =>
    selectedForCompare.includes(m.train_number)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Rajasthan Railway Network Scope</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Plan Journey
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
          Find and compare direct train services connecting stations across Rajasthan. Real-time timetable schedules and dynamic arrival forecasts.
        </p>
      </div>

      {/* Route Search Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* From Station */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              From Station (Rajasthan Network)
            </label>
            <div className="relative">
              <select
                value={fromStationCode}
                onChange={e => setFromStationCode(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableStations.map(st => (
                  <option key={st.code} value={st.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pb-1">
            <button
              type="button"
              onClick={handleSwapStations}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Swap origin and destination"
            >
              <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Swap</span>
            </button>
          </div>

          {/* To Station */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              To Station (Rajasthan Network)
            </label>
            <div className="relative">
              <select
                value={toStationCode}
                onChange={e => setToStationCode(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableStations.map(st => (
                  <option key={st.code} value={st.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Popular Rajasthan Corridors */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Popular Rajasthan Corridors:
          </span>
          {[
            { label: 'Jodhpur ↔ Jaipur', from: 'JU', to: 'JP' },
            { label: 'Jaipur ↔ Kota', from: 'JP', to: 'KOTA' },
            { label: 'Ajmer ↔ Jaipur', from: 'AII', to: 'JP' },
            { label: 'Bikaner ↔ Jaipur', from: 'BKN', to: 'JP' },
            { label: 'Barmer ↔ Jodhpur', from: 'BME', to: 'JU' },
            { label: 'Jaipur ↔ Alwar', from: 'JP', to: 'AWR' }
          ].map(c => (
            <button
              key={c.label}
              onClick={() => {
                setFromStationCode(c.from);
                setToStationCode(c.to);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium text-[11px] cursor-pointer"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compared Trains Matrix */}
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
            {comparedTrains.map(m => (
              <div
                key={m.train_number}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded">
                    {m.train_number}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {m.category}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.train_name}</div>
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Scheduled Departure:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{m.scheduled_departure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Scheduled Arrival:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{m.scheduled_arrival}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Estimated Arrival (ETA):</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{m.estimated_arrival}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{m.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Intermediate Stops:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.stops_count} stops ({m.distance_km} km)</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/train/${m.train_number}`)}
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
            Matching Rajasthan Services ({matchingTrains.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct services connecting {fromStationCode} and {toStationCode} on verified network routes.
          </p>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Querying Rajasthan routes between {fromStationCode} and {toStationCode}...
          </p>
        </div>
      ) : matchingTrains.length > 0 ? (
        <div className="space-y-3">
          {matchingTrains.map(m => {
            const isCompared = selectedForCompare.includes(m.train_number);
            return (
              <div
                key={m.train_number}
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
                        {m.train_number}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{m.train_name}</h3>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {m.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{m.from_station_name} ({m.from_station_code})</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{m.to_station_name} ({m.to_station_code})</span>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-center gap-6 text-xs border-y md:border-y-0 py-3 md:py-0 border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                        Depart {m.from_station_code} (STA)
                      </div>
                      <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {m.scheduled_departure}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                        {m.duration}
                      </div>
                      <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full my-1" />
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {m.stops_count} intermediate halts ({m.distance_km} km)
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                        Arrive {m.to_station_code}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                          {m.scheduled_arrival}
                        </span>
                        {m.estimated_arrival !== m.scheduled_arrival && (
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400" title="Estimated Arrival (ETA)">
                            ETA {m.estimated_arrival}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Compare checkbox */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <TrainStatusBadge
                      state={m.current_delay_minutes > 5 ? 'DELAYED' : 'ON_TIME'}
                      delayMinutes={m.current_delay_minutes}
                    />

                    {/* Compare toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(m.train_number)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Compare</span>
                    </label>

                    <button
                      onClick={() => navigate(`/train/${m.train_number}`)}
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
          <TrainIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No matching Rajasthan-scope train service found.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No direct trains connect {fromStationCode} to {toStationCode} in this sequence on the Rajasthan network. Try checking high-traffic Rajasthan corridors such as Jodhpur ↔ Jaipur (JU ↔ JP) or Jaipur ↔ Kota (JP ↔ KOTA).
          </p>
        </div>
      )}
    </div>
  );
};
