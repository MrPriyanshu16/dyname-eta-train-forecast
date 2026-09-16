import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import {
  Bookmark,
  Trash2,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
  Train as TrainIcon,
  ChevronRight
} from 'lucide-react';

export const SavedTrainsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedTrainIds, toggleSaveTrain, getTrainById, trains } = useSimulation();

  const savedTrains = savedTrainIds
    .map(id => getTrainById(id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Local Session Watchlist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Saved Trains
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pinned trains saved in your local browser session for rapid daily access.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>Find More Trains</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Saved Trains List */}
      {savedTrains.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedTrains.map(train => {
            const nextStop =
              train.stops.find(s => s.status === 'NEXT') ||
              train.stops[train.stops.length - 1];

            return (
              <div
                key={train.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-850">
                        {train.number}
                      </span>
                      <h2
                        onClick={() => navigate(`/train/${train.id}`)}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {train.name}
                      </h2>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {train.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{train.origin.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      <span>{train.destination.name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSaveTrain(train.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Next Station & Status Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Next Target Station
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {nextStop.stationName} ({nextStop.stationCode})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Estimated Arrival:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {nextStop.estimatedArrival !== '--'
                        ? nextStop.estimatedArrival
                        : nextStop.estimatedDeparture}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <TrainStatusBadge
                    state={train.currentStatus.state}
                    delayMinutes={train.currentStatus.delayMinutes}
                    size="sm"
                  />

                  <button
                    onClick={() => navigate(`/train/${train.id}`)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Track Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">No Saved Trains Yet</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Click the bookmark icon on any train page to save it for quick, repeated access on this device.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-2xs"
            >
              Browse Popular Trains
            </Link>
          </div>
        </div>
      )}

      {/* Suggested to Save */}
      {trains.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Suggested Trains to Monitor
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {trains.slice(0, 3).map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/train/${t.id}`)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-colors cursor-pointer flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{t.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {t.number} · {t.origin.code} → {t.destination.code}
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
