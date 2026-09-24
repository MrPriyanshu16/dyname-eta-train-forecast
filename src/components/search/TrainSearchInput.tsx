import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../../context/SimulationContext';
import { searchStations } from '../../data/mockStations';
import { searchMasterTrains, searchStationsFromMaster } from '../../utils/mlApi';
import { Search, X, Train as TrainIcon, MapPin, Clock, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';
import { TrainStatusBadge } from '../train/TrainStatusBadge';

interface TrainSearchInputProps {
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  size?: 'default' | 'large';
  onSearchSubmit?: (query: string) => void;
}

export const TrainSearchInput: React.FC<TrainSearchInputProps> = ({
  placeholder = 'Search train number, train name, or station (e.g. 22491, 14888, Mandore, JP)',
  autoFocus = false,
  initialValue = '',
  size = 'default',
  onSearchSubmit
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [apiTrains, setApiTrains] = useState<Array<{
    id: string;
    number: string;
    name: string;
    type: string;
    origin: string;
    destination: string;
  }>>([]);
  const [apiStations, setApiStations] = useState<Array<{
    code: string;
    name: string;
    city: string;
    state: string;
  }>>([]);

  const { trains, recentSearches, addRecentSearch, clearRecentSearches } = useSimulation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced API search across Rajasthan scope trains and stations
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiTrains([]);
      setApiStations([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [trainRes, stRes] = await Promise.all([
          searchMasterTrains(q, 'ALL', 1, 8),
          searchStationsFromMaster(q, 'rajasthan', 5)
        ]);
        if (trainRes && trainRes.trains) {
          setApiTrains(trainRes.trains.map(t => ({
            id: t.train_number,
            number: t.train_number,
            name: t.train_name,
            type: t.category || t.train_type,
            origin: t.origin,
            destination: t.destination
          })));
        }
        if (stRes && stRes.stations) {
          setApiStations(stRes.stations.map(s => ({
            code: s.code,
            name: s.name,
            city: s.city,
            state: s.state
          })));
        }
      } catch {
        // Fallback gracefully
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter matching local trains
  const matchingLocalTrains = query.trim()
    ? trains.filter(
        t =>
          t.number.includes(query.trim()) ||
          t.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          t.origin.city.toLowerCase().includes(query.trim().toLowerCase()) ||
          t.destination.city.toLowerCase().includes(query.trim().toLowerCase()) ||
          t.origin.code.toLowerCase().includes(query.trim().toLowerCase()) ||
          t.destination.code.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 5)
    : [];

  // Combined deduplicated train search results (local + master API)
  const combinedTrains = useMemo(() => {
    const seen = new Set<string>();
    const results: Array<{
      id: string;
      number: string;
      name: string;
      type: string;
      originName: string;
      destName: string;
      statusState?: any;
      delayMinutes?: number;
    }> = [];

    // Prioritize exact local matches
    for (const t of matchingLocalTrains) {
      if (!seen.has(t.number)) {
        seen.add(t.number);
        results.push({
          id: t.id,
          number: t.number,
          name: t.name,
          type: t.type,
          originName: t.origin.name,
          destName: t.destination.name,
          statusState: t.currentStatus.state,
          delayMinutes: t.currentStatus.delayMinutes
        });
      }
    }

    // Add API matches from Rajasthan master database
    for (const at of apiTrains) {
      if (!seen.has(at.number)) {
        seen.add(at.number);
        results.push({
          id: at.id,
          number: at.number,
          name: at.name,
          type: at.type,
          originName: at.origin,
          destName: at.destination
        });
      }
    }

    return results.slice(0, 7);
  }, [matchingLocalTrains, apiTrains]);

  // Combined matching stations (strictly Rajasthan scope)
  const combinedStations = useMemo(() => {
    const seen = new Set<string>();
    const results: Array<{ code: string; name: string; city: string; state: string }> = [];

    for (const st of apiStations) {
      if (!seen.has(st.code)) {
        seen.add(st.code);
        results.push(st);
      }
    }

    const localMatched = query.trim() ? searchStations(query) : [];
    for (const st of localMatched) {
      if (!seen.has(st.code)) {
        seen.add(st.code);
        results.push({
          code: st.code,
          name: st.name,
          city: st.city,
          state: st.state
        });
      }
    }

    return results.slice(0, 5);
  }, [apiStations, query]);

  // Total items for keyboard navigation
  const allResultsCount = combinedTrains.length + combinedStations.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTrain = (trainId: string, label: string) => {
    addRecentSearch(label);
    setIsFocused(false);
    navigate(`/train/${trainId}`);
  };

  const handleSelectStation = (stationCode: string, label: string) => {
    addRecentSearch(label);
    setIsFocused(false);
    navigate(`/station/${stationCode}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (selectedIndex >= 0) {
      if (selectedIndex < combinedTrains.length) {
        const selected = combinedTrains[selectedIndex];
        handleSelectTrain(selected.id, `${selected.number} ${selected.name}`);
        return;
      } else {
        const stationIdx = selectedIndex - combinedTrains.length;
        const selected = combinedStations[stationIdx];
        handleSelectStation(selected.code, `${selected.code} ${selected.name}`);
        return;
      }
    }

    // Direct match check:
    const exactTrain = combinedTrains.find(
      t => t.number === trimmed || t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactTrain) {
      handleSelectTrain(exactTrain.id, `${exactTrain.number} ${exactTrain.name}`);
      return;
    }

    const exactStation = combinedStations.find(
      s => s.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactStation) {
      handleSelectStation(exactStation.code, `${exactStation.code} ${exactStation.name}`);
      return;
    }

    addRecentSearch(trimmed);
    setIsFocused(false);
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allResultsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResultsCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const isLarge = size === 'large';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center w-full bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 shadow-xs ${
            isFocused
              ? 'border-indigo-600 dark:border-indigo-400 ring-3 ring-indigo-500/20 shadow-md'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          } ${isLarge ? 'h-14 px-4.5 text-base' : 'h-11 px-3.5 text-sm'}`}
        >
          <Search
            className={`shrink-0 text-slate-400 dark:text-slate-400 mr-3 transition-colors ${
              isFocused ? 'text-indigo-600 dark:text-indigo-400' : ''
            } ${isLarge ? 'w-5 h-5' : 'w-4 h-4'}`}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className={`shrink-0 flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              isLarge
                ? 'px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                : 'px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Search</span>
            <CornerDownLeft className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </form>

      {/* Autocomplete / Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/90 overflow-hidden z-[100] text-left animate-in fade-in-50 duration-150">
          {query.trim().length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {/* Trains Section */}
              {combinedTrains.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Rajasthan Trains ({combinedTrains.length})
                  </div>
                  {combinedTrains.map((train, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={train.id}
                        type="button"
                        onClick={() =>
                          handleSelectTrain(train.id, `${train.number} ${train.name}`)
                        }
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <TrainIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                {train.number}
                              </span>
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {train.name}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {train.type}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <span>{train.originName}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>{train.destName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {train.statusState ? (
                            <TrainStatusBadge
                              state={train.statusState}
                              delayMinutes={train.delayMinutes || 0}
                              size="sm"
                            />
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Rajasthan Timetable
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Stations Section */}
              {combinedStations.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Rajasthan Stations ({combinedStations.length})
                  </div>
                  {combinedStations.map((station, idx) => {
                    const overallIndex = combinedTrains.length + idx;
                    const isSelected = selectedIndex === overallIndex;
                    return (
                      <button
                        key={station.code}
                        type="button"
                        onClick={() =>
                          handleSelectStation(station.code, `${station.code} ${station.name}`)
                        }
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
                                {station.code}
                              </span>
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {station.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {station.city}, {station.state} (Rajasthan Network)
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                          View Station Board →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {combinedTrains.length === 0 && combinedStations.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No matching Rajasthan network trains or stations found for "{query}"
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Try searching by train number (e.g. 22491, 14888, 12951) or station code (e.g. JP, JU, KOTA, AII, BKN).
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Recent Searches & Prompt */
            <div className="p-3">
              {recentSearches.length > 0 ? (
                <div>
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          navigate(`/search?q=${encodeURIComponent(item)}`);
                          setIsFocused(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-3 px-2 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Rajasthan Railway Network Scope
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Search across 882 Rajasthan network trains & verified stations (JP, JU, KOTA, AII, BKN, AWR, UDZ).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
