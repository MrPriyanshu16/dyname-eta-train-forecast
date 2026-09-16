import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrainSearchInput } from '../components/search/TrainSearchInput';
import { useSimulation } from '../context/SimulationContext';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
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
  Radio
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { trains, savedTrainIds, getTrainById } = useSimulation();
  const navigate = useNavigate();

  // Saved or recently viewed trains for quick card list
  const featuredSavedTrains = savedTrainIds
    .map(id => getTrainById(id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .slice(0, 3);

  const popularCorridors = [
    {
      id: '12951',
      number: '12951',
      name: 'Mumbai Rajdhani',
      route: 'New Delhi → Mumbai Central',
      departure: '16:55',
      duration: '15h 40m',
      badge: 'Superfast Premium',
      type: 'Rajdhani'
    },
    {
      id: '22436',
      number: '22436',
      name: 'Vande Bharat Express',
      route: 'New Delhi → Varanasi Jn',
      departure: '06:00',
      duration: '8h 00m',
      badge: 'Semi-High Speed',
      type: 'Vande Bharat'
    },
    {
      id: '12004',
      number: '12004',
      name: 'Lucknow Shatabdi',
      route: 'New Delhi → Lucknow Charbagh',
      departure: '06:10',
      duration: '6h 45m',
      badge: 'Daily Intercity',
      type: 'Shatabdi'
    },
    {
      id: '12626',
      number: '12626',
      name: 'Kerala Express',
      route: 'New Delhi → Thiruvananthapuram',
      departure: '20:10',
      duration: '50h 00m',
      badge: 'Trans-India Trunk',
      type: 'Superfast'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900/80 dark:to-slate-950 pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-slate-200/70 dark:border-slate-800 transition-colors">
        {/* Subtle geometric line representing track movement */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-600 dark:via-indigo-400 to-transparent" />
          <div className="absolute top-1/2 left-1/3 w-32 h-1 bg-indigo-500 rounded-full blur-xs" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100/90 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
            <span>Simulated Real-Time Transit Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] text-balance">
            Know where your train is. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-900 dark:from-indigo-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Know when it arrives.
            </span>
          </h1>

          {/* Concise Supporting Description */}
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Minimal, instant train tracking, running delays, platform allocations, and arrival estimation—without the clutter of traditional railway portals.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <TrainSearchInput size="large" autoFocus />
          </div>

          {/* Quick Query Suggestions */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500">Popular:</span>
            <button
              onClick={() => navigate('/train/12951')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              12951 Rajdhani
            </button>
            <button
              onClick={() => navigate('/train/22436')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              22436 Vande Bharat
            </button>
            <button
              onClick={() => navigate('/station/NDLS')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              NDLS Station Board
            </button>
            <button
              onClick={() => navigate('/journey-planner')}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Plan Journey
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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
                Compare direct trains between stations by departure, stops, and duration.
              </p>
            </div>
          </Link>

          <Link
            to="/station/NDLS"
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
                Check incoming arrivals, upcoming departures, and platform numbers at any major station.
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
