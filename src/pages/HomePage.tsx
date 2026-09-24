import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrainSearchInput } from '../components/search/TrainSearchInput';
import { useSimulation } from '../context/SimulationContext';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { ModelPerformanceCard } from '../components/tracking/ModelPerformanceCard';
import {
  Compass,
  Building2,
  Bookmark,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Radio,
  RotateCcw,
  Cpu
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { trains, savedTrainIds, getTrainById, recentSearches } = useSimulation();
  const navigate = useNavigate();

  // Saved or recently viewed trains for quick card list
  const featuredSavedTrains = savedTrainIds
    .map(id => getTrainById(id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .slice(0, 3);

  const popularCorridors = [
    {
      id: '22491',
      number: '22491',
      name: 'Mandore Superfast Express',
      route: 'Jodhpur Jn → Old Delhi (via Jaipur)',
      departure: '20:30',
      duration: '10h 15m',
      badge: 'Rajasthan Superfast',
      type: 'Superfast'
    },
    {
      id: '22492',
      number: '22492',
      name: 'Mandore Superfast Express',
      route: 'Old Delhi → Jodhpur Jn (via Jaipur)',
      departure: '21:10',
      duration: '10h 20m',
      badge: 'Return Service',
      type: 'Superfast'
    },
    {
      id: '14888',
      number: '14888',
      name: 'Barmer - Rishikesh Express',
      route: 'Barmer → Rishikesh (via Jodhpur & Bikaner)',
      departure: '06:00',
      duration: '27h 54m',
      badge: 'Desert Express',
      type: 'Express'
    },
    {
      id: '12951',
      number: '12951',
      name: 'Mumbai Rajdhani Express',
      route: 'New Delhi → Mumbai Central (via Kota Jn)',
      departure: '16:55',
      duration: '15h 40m',
      badge: 'Superfast Premium',
      type: 'Rajdhani'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 transition-colors">
      {/* Hero Section */}
      <section className="relative z-20 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900/80 dark:to-slate-950 pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-slate-200/70 dark:border-slate-800 transition-colors">
        {/* Subtle geometric line representing track movement */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30 overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-600 dark:via-indigo-400 to-transparent" />
          <div className="absolute top-1/2 left-1/3 w-32 h-1 bg-indigo-500 rounded-full blur-xs" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-30">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100/90 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
            <span>Rajasthan Network Scope · 882 Ingested Trains</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] text-balance">
            Track the Run. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-900 dark:from-indigo-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Know When It Arrives.
            </span>
          </h1>

          {/* Concise Supporting Description */}
          <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-medium">
            Dynamic train arrival forecasting and real-time delay propagation engineered specifically for the Rajasthan railway network.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto relative z-50">
            <TrainSearchInput size="large" />
          </div>

          {/* Recent Searches Quick Access Row */}
          {recentSearches.length > 0 && (
            <div className="mt-3.5 flex items-center justify-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Recent:
              </span>
              {recentSearches.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-slate-400 dark:text-slate-400" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Query Suggestions with High Contrast */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-bold">Popular:</span>
            <button
              onClick={() => navigate('/train/22491')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              22491 Mandore Express
            </button>
            <button
              onClick={() => navigate('/train/14888')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              14888 Barmer - Rishikesh
            </button>
            <button
              onClick={() => navigate('/station/JP')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              JP Jaipur Board
            </button>
            <button
              onClick={() => navigate('/station/JU')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              JU Jodhpur Board
            </button>
            <button
              onClick={() => navigate('/journey-planner')}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer"
            >
              Plan Journey
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ML Model Performance Section */}
        <section>
          <ModelPerformanceCard />
        </section>

        {/* Quick Utility Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/journey-planner"
            className="group p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                <span>Journey Planner</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Compare direct trains between Rajasthan stations by departure, stops, and duration.
              </p>
            </div>
          </Link>

          <Link
            to="/station/JP"
            className="group p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                <span>Station Live Boards</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Check incoming arrivals, upcoming departures, and platform numbers at Jaipur, Jodhpur, Kota & more.
              </p>
            </div>
          </Link>

          <Link
            to="/saved"
            className="group p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                <span>Saved & Pinned Trains</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                One-tap access to your daily commutes and tracked journeys with live updates.
              </p>
            </div>
          </Link>
        </section>

        {/* Saved & Monitored Trains Section */}
        {featuredSavedTrains.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Your Saved Trains</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live status of trains pinned in your local session.
                </p>
              </div>
              <Link
                to="/saved"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View all ({savedTrainIds.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredSavedTrains.map(train => {
                return (
                  <div
                    key={train.id}
                    onClick={() => navigate(`/train/${train.id}`)}
                    className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {train.number}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {train.name}
                        </span>
                      </div>
                      <TrainStatusBadge
                        state={train.currentStatus.state}
                        delayMinutes={train.currentStatus.delayMinutes}
                        size="sm"
                      />
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        {train.origin.code} → {train.destination.code}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        Dep {train.departureTime}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-lg p-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Current Position
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                        {train.currentStatus.currentStationName ||
                          (train.currentStatus.nextStationName
                            ? `Approaching ${train.currentStatus.nextStationName}`
                            : 'In Transit')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Popular Express Corridors */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Popular Express Corridors</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-frequency premier services with live simulated tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularCorridors.map(corridor => (
              <div
                key={corridor.id}
                onClick={() => navigate(`/train/${corridor.id}`)}
                className="group p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                      {corridor.number}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {corridor.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                    {corridor.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{corridor.route}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    Dep {corridor.departure} · {corridor.duration}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Track →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Highlights: Precision & Privacy */}
        <section className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Zero Visual Clutter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No flashing banner ads, dense unreadable tables, or labyrinthine railway forms. Clean, focused arrival estimates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Local Simulated Precision</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Built-in dynamic scheduling engine demonstrates delay progression, platform assignments, and stop countdowns offline.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Target Station ETA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click any intermediate station on the route timeline to instantly project estimated arrival times and delay buffers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
