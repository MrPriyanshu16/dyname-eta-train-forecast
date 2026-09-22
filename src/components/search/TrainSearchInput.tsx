import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../../context/SimulationContext';
import { searchStations } from '../../data/mockStations';
import { searchMasterTrains } from '../../utils/mlApi';
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
  placeholder = 'Search train number, train name, or station (e.g., 14888, 12138, Mandore)',
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

  const { trains, recentSearches, addRecentSearch, clearRecentSearches } = useSimulation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced API search across 5,208 master database trains
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiTrains([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchMasterTrains(q, 'ALL', 1, 8);
      if (res && res.trains) {
        setApiTrains(res.trains.map(t => ({
          id: t.train_number,
          number: t.train_number,
          name: t.train_name,
          type: t.category || t.train_type,
          origin: t.origin,
          destination: t.destination
        })));
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

    // Add API matches from 5,208 master database
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

  // Filter matching stations
  const matchingStations = query.trim() ? searchStations(query).slice(0, 4) : [];

  // Total items for keyboard navigation
  const allResultsCount = combinedTrains.length + matchingStations.length;

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

    // If an item was selected via arrow keys:
    if (selectedIndex >= 0) {
      if (selectedIndex < combinedTrains.length) {
        const selected = combinedTrains[selectedIndex];
        handleSelectTrain(selected.id, `${selected.number} ${selected.name}`);
        return;
      } else {
        const stationIdx = selectedIndex - combinedTrains.length;
        const selected = matchingStations[stationIdx];
        handleSelectStation(selected.code, `${selected.code} ${selected.name}`);
        return;
      }
    }

    // Direct match check from combined list:
    const exactTrain = combinedTrains.find(
      t => t.number === trimmed || t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactTrain) {
      handleSelectTrain(exactTrain.id, `${exactTrain.number} ${exactTrain.name}`);
      return;
    }

    const exactStation = searchStations(trimmed).find(
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
              ? 'border-indigo-600 dark:border-indigo-500 ring-3 ring-indigo-500/10 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${isLarge ? 'h-14 px-4.5 text-base' : 'h-11 px-3.5 text-sm'}`}
        >
          <Search
            className={`shrink-0 text-slate-400 dark:text-slate-500 mr-3 transition-colors ${
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
            className="w-full h-full bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className={`shrink-0 flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              isLarge
                ? 'px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                : 'px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Search</span>
            <CornerDownLeft className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </form>

      {/* Autocomplete / Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] text-left animate-in fade-in-50 duration-150">
          {/* If there is a query, show matching results */}
          {query.trim().length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {/* Trains Section */}
              {combinedTrains.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Trains ({combinedTrains.length})
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
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <TrainIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                {train.number}
                              </span>
                              <span className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate">
                                {train.name}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {train.type}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{train.originName}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
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
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              Master Schedule
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Stations Section */}
              {matchingStations.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Stations ({matchingStations.length})
                  </div>
                  {matchingStations.map((station, idx) => {
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
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                                {station.code}
                              </span>
                              <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                                {station.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {station.city}, {station.state} · {station.platforms} Platforms
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          View Board →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {combinedTrains.length === 0 && matchingStations.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No matching trains or stations found for "{query}"
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Try searching by train number (e.g., 12951), city name, or station code (e.g., NDLS).
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Recent Searches & Helpful Search Prompt when input is empty */
            <div className="p-3">
              {recentSearches.length > 0 ? (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[10px] text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          navigate(`/search?q=${encodeURIComponent(item)}`);
                          setIsFocused(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-2 px-1 text-center">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Search across 882 Rajasthan network trains & verified stations
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Try searching by train number (e.g. 14888, 22491, 12951) or city / station code (e.g. JP, JU, KOTA).
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
