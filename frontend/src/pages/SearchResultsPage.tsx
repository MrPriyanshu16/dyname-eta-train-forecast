import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { TrainSearchInput } from '../components/search/TrainSearchInput';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { parseTimeToMinutes } from '../utils/time';
import {
  Train as TrainIcon,
  Filter,
  ArrowUpDown,
  ArrowRight,
  Clock,
  MapPin,
  SlidersHorizontal,
  Bookmark,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const { trains, savedTrainIds, toggleSaveTrain } = useSimulation();

  // Filters state
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'EARLIEST_DEP' | 'EARLIEST_ARR' | 'SHORTEST_DURATION'>('RELEVANCE');

  // Filtered & Sorted trains
  const filteredTrains = useMemo(() => {
    let result = trains;

    // Query filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        t =>
          t.number.includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.origin.name.toLowerCase().includes(q) ||
          t.destination.name.toLowerCase().includes(q) ||
          t.origin.city.toLowerCase().includes(q) ||
          t.destination.city.toLowerCase().includes(q) ||
          t.origin.code.toLowerCase().includes(q) ||
          t.destination.code.toLowerCase().includes(q) ||
          t.stops.some(
            s =>
              s.stationName.toLowerCase().includes(q) ||
              s.stationCode.toLowerCase().includes(q)
          )
      );
    }

    // Type filter
    if (selectedType !== 'ALL') {
      result = result.filter(t => t.type === selectedType);
    }

    // Status filter
    if (selectedStatus === 'ON_TIME') {
      result = result.filter(t => t.currentStatus.delayMinutes <= 0);
    } else if (selectedStatus === 'DELAYED') {
      result = result.filter(t => t.currentStatus.delayMinutes > 0);
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'EARLIEST_DEP') {
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      }
      if (sortBy === 'EARLIEST_ARR') {
        return parseTimeToMinutes(a.arrivalTime) - parseTimeToMinutes(b.arrivalTime);
      }
      if (sortBy === 'SHORTEST_DURATION') {
        const getDurMins = (durStr: string) => {
          const parts = durStr.split('h');
          const hrs = parseInt(parts[0], 10) || 0;
          const mins = parseInt(parts[1]?.replace('m', '').trim(), 10) || 0;
          return hrs * 60 + mins;
        };
        return getDurMins(a.duration) - getDurMins(b.duration);
      }
      return 0; // Default relevance
    });
  }, [trains, query, selectedType, selectedStatus, sortBy]);

  const trainTypes = [
    'ALL',
    'Rajdhani',
    'Vande Bharat',
    'Shatabdi',
    'Superfast',
    'Tejas Rajdhani',
    'Duronto',
    'Mail / Express'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors">
      {/* Top Search & Query Header */}
      <div className="space-y-4">
        <div className="max-w-3xl">
          <TrainSearchInput
            initialValue={query}
            placeholder="Search train number, name, or station..."
            onSearchSubmit={newQ => setSearchParams({ q: newQ })}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {query.trim() ? (
                <>
                  Search Results for <span className="text-indigo-600 dark:text-indigo-400">"{query}"</span>
                </>
              ) : (
                'All Monitored Train Services'
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filteredTrains.length} matching {filteredTrains.length === 1 ? 'train' : 'trains'}
            </p>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="RELEVANCE">Relevance</option>
              <option value="EARLIEST_DEP">Earliest Departure</option>
              <option value="EARLIEST_ARR">Earliest Arrival</option>
              <option value="SHORTEST_DURATION">Shortest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>

        {/* Type pills */}
        {trainTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium cursor-pointer ${
              selectedType === type
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {type === 'ALL' ? 'All Types' : type}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Status filters */}
        <button
          onClick={() => setSelectedStatus('ALL')}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Status
        </button>
        <button
          onClick={() => setSelectedStatus('ON_TIME')}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer ${
            selectedStatus === 'ON_TIME'
              ? 'bg-emerald-700 dark:bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-850 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          On Time Only
        </button>
        <button
          onClick={() => setSelectedStatus('DELAYED')}
          className={`px-3 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer ${
            selectedStatus === 'DELAYED'
              ? 'bg-amber-700 dark:bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-850 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800'
          }`}
        >
          Delayed Only
        </button>
      </div>

      {/* Results List */}
      {filteredTrains.length > 0 ? (
        <div className="space-y-3">
          {filteredTrains.map(train => {
            const isSaved = savedTrainIds.includes(train.id);
            return (
              <div
                key={train.id}
                onClick={() => navigate(`/train/${train.id}`)}
                className="group content-auto-card bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-colors p-5 cursor-pointer"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
                  {/* Left: Train Identity & Route (5 cols) */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {train.number}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                        {train.name}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {train.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span>{train.origin.name}</span>
                        <span className="font-mono text-slate-400 dark:text-slate-500">({train.origin.code})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span>{train.destination.name}</span>
                        <span className="font-mono text-slate-400 dark:text-slate-500">({train.destination.code})</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Times & Duration (4 cols, centered on desktop) */}
                  <div className="lg:col-span-4 flex items-center justify-start lg:justify-center gap-6 text-xs border-y lg:border-y-0 py-3 lg:py-0 border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Departure
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {train.departureTime}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {train.duration}
                      </div>
                      <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full my-1 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {train.stops.length} stops
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Arrival
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {train.arrivalTime}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge & Action (3 cols, right-aligned) */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3 shrink-0">
                    <TrainStatusBadge
                      state={train.currentStatus.state}
                      delayMinutes={train.currentStatus.delayMinutes}
                    />

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSaveTrain(train.id);
                      }}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save train'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>

                    <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      Track <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Sub-bar: current live simulation position */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">
                      Currently:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                        {train.currentStatus.currentStationName ||
                          (train.currentStatus.nextStationName
                            ? `Approaching ${train.currentStatus.nextStationName}`
                            : 'En route')}
                      </strong>
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                    {train.distanceKm} km · {train.classes.join(', ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
            <TrainIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching trains found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We couldn't find any trains matching your search filters for "{query}". Try checking the spelling or searching by train number (e.g. 20978, 12461).
          </p>
          <button
            onClick={() => {
              setSelectedType('ALL');
              setSelectedStatus('ALL');
              setSearchParams({});
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-transparent dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Search & Filters
          </button>
        </div>
      )}
    </div>
  );
};
