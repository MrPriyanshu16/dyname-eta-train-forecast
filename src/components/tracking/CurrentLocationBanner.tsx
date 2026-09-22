import React from 'react';
import { Train } from '../../types/train';
import { Navigation, Gauge, Clock, ShieldCheck, MapPin, Radio, Calendar } from 'lucide-react';

interface CurrentLocationBannerProps {
  train: Train;
}

export const CurrentLocationBanner: React.FC<CurrentLocationBannerProps> = ({ train }) => {
  const status = train.currentStatus;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Location summary */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100/80 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Radio className="w-5 h-5 animate-pulse text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Live Movement Telemetry
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {status.currentStationName ||
                (status.lastPassedStationName && status.nextStationName
                  ? `Cruising between ${status.lastPassedStationName} and ${status.nextStationName}`
                  : 'En route to destination')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
              {status.statusExplanation}
            </p>
          </div>
        </div>

        {/* Right: Telemetry chips */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          {train.startDate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Journey:</span>
              <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200">
                {train.startDate}
              </span>
            </div>
          )}

          {status.currentSpeedKmph !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Gauge className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Speed:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {status.currentSpeedKmph} km/h
              </span>
            </div>
          )}

          {status.distanceToNextKm !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Navigation className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Next stop:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {status.distanceToNextKm} km
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Updated:</span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {status.lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
