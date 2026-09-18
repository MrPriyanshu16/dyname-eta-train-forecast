import React, { useState } from 'react';
import { Train, StationStop } from '../../types/train';
import { Search, CheckCircle2, MapPin, AlertCircle, Clock } from 'lucide-react';

interface ScheduleTableProps {
  train: Train;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ train }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredStops = train.stops.filter(
    stop =>
      stop.stationName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      stop.stationCode.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
      {/* Header & Local search filter */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Complete Timetable & Station Halts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total {train.stops.length} stations across {train.distanceKm} km
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter stations..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4 font-semibold">#</th>
              <th className="py-3 px-4 font-semibold">Station</th>
              <th className="py-3 px-4 font-semibold">Scheduled Arr / Dep</th>
              <th className="py-3 px-4 font-semibold">Estimated Arr / Dep</th>
              <th className="py-3 px-4 font-semibold">Halt</th>
              <th className="py-3 px-4 font-semibold">Platform</th>
              <th className="py-3 px-4 font-semibold">Distance</th>
              <th className="py-3 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredStops.map((stop, idx) => {
              const isCompleted = stop.status === 'COMPLETED';
              const isCurrent = stop.status === 'CURRENT';
              const isDelayed = stop.delayArrivalMinutes > 0;

              return (
                <tr
                  key={stop.stationCode}
                  className={`transition-colors ${
                    isCurrent
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold text-slate-900 dark:text-white'
                      : isCompleted
                      ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{stop.stationName}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {stop.stationCode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    <div>
                      {stop.scheduledArrival} / {stop.scheduledDeparture}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div
                      className={`font-semibold ${
                        isDelayed ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {stop.estimatedArrival} / {stop.estimatedDeparture}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {stop.haltMinutes > 0 ? `${stop.haltMinutes} min` : '--'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                      {stop.platform || '--'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {stop.distanceFromOriginKm} km
                  </td>
                  <td className="py-3.5 px-4">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                        <CheckCircle2 className="w-3 h-3" /> Departed
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/80 animate-pulse">
                        <MapPin className="w-3 h-3" /> Current
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Upcoming
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredStops.map((stop, idx) => {
          const isCompleted = stop.status === 'COMPLETED';
          const isCurrent = stop.status === 'CURRENT';
          const isDelayed = stop.delayArrivalMinutes > 0;

          return (
            <div
              key={stop.stationCode}
              className={`p-4 space-y-2 ${
                isCurrent
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                  : isCompleted
                  ? 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {stop.stationName}
                  </span>
                  <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {stop.stationCode}
                  </span>
                </div>
                <div>
                  {isCompleted ? (
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Departed
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                    Scheduled
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    Arr: {stop.scheduledArrival} | Dep: {stop.scheduledDeparture}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">
                    Estimated
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      isDelayed ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    Arr: {stop.estimatedArrival} | Dep: {stop.estimatedDeparture}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Platform {stop.platform || '--'}</span>
                <span>Halt: {stop.haltMinutes} min</span>
                <span>{stop.distanceFromOriginKm} km</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStops.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No stations match "{filterQuery}".
        </div>
      )}
    </div>
  );
};
