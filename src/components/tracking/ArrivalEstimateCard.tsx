import React from 'react';
import { Train, StationStop } from '../../types/train';
import { getDelayBadgeText, getRemainingTimeText } from '../../utils/time';
import { Clock, MapPin, ChevronDown, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { TrainStatusBadge } from '../train/TrainStatusBadge';

interface ArrivalEstimateCardProps {
  train: Train;
  targetStation: StationStop;
  upcomingStops: StationStop[];
  onSelectStation: (stationCode: string) => void;
}

export const ArrivalEstimateCard: React.FC<ArrivalEstimateCardProps> = ({
  train,
  targetStation,
  upcomingStops,
  onSelectStation
}) => {
  const isCompleted = train.currentStatus.state === 'COMPLETED';
  const isDelayed = targetStation.delayArrivalMinutes > 0;
  const isTargetDestination =
    targetStation.stationCode === train.destination.code;

  const remainingText = isCompleted
    ? 'Journey Completed'
    : getRemainingTimeText(
        targetStation.estimatedArrival !== '--'
          ? targetStation.estimatedArrival
          : targetStation.estimatedDeparture,
        train.currentStatus.lastUpdated.replace(' AM', '').replace(' PM', '')
      );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 relative overflow-hidden transition-all">
      {/* Top accent border based on status */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isCompleted
            ? 'bg-slate-400 dark:bg-slate-600'
            : isDelayed
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      {/* Station Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isTargetDestination ? 'Final Destination' : 'Next Target Station'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="relative inline-block">
            <select
              value={targetStation.stationCode}
              onChange={e => onSelectStation(e.target.value)}
              aria-label="Select Target Station for ETA"
              className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1 cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {upcomingStops.map(stop => (
                <option key={stop.stationCode} value={stop.stationCode} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {stop.stationName} ({stop.stationCode})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrainStatusBadge
            state={train.currentStatus.state}
            delayMinutes={targetStation.delayArrivalMinutes}
            size="md"
          />
          {targetStation.platform && (
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Platform {targetStation.platform}
            </span>
          )}
        </div>
      </div>

      {/* Main ETA Display Section */}
      <div className="py-6 sm:py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
        {/* Left dominant block: Station and Estimated Time */}
        <div className="md:col-span-8">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {targetStation.stationName}
            </h1>
            <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {targetStation.stationCode}
            </span>
          </div>

          {/* Large tabular numerals for arrival estimate */}
          <div className="mt-4 flex items-baseline gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                Estimated Arrival
              </div>
              <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {targetStation.estimatedArrival !== '--'
                  ? targetStation.estimatedArrival
                  : targetStation.estimatedDeparture}
              </div>
            </div>

            {/* Scheduled comparison and delta */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4 sm:pl-5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled:{' '}
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {targetStation.scheduledArrival !== '--'
                    ? targetStation.scheduledArrival
                    : targetStation.scheduledDeparture}
                </span>
              </div>
              <div className="text-xs font-medium">
                {isDelayed ? (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    +{targetStation.delayArrivalMinutes} min behind schedule
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    On schedule
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Countdown & proximity badge */}
        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-850 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
            Status Countdown
          </div>
          <div className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
            {remainingText}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {train.currentStatus.statusExplanation}
          </p>
        </div>
      </div>

      {/* Location Context Bar */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 -mx-6 -mb-6 p-4 px-6 sm:px-7 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Current position:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {train.currentStatus.currentStationName ||
                (train.currentStatus.nextStationName
                  ? `Approaching ${train.currentStatus.nextStationName}`
                  : 'In Transit')}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          {train.currentStatus.currentSpeedKmph !== undefined && (
            <span>Speed: {train.currentStatus.currentSpeedKmph} km/h</span>
          )}
          {train.currentStatus.distanceToNextKm !== undefined && (
            <span>Distance: {train.currentStatus.distanceToNextKm} km to go</span>
          )}
        </div>
      </div>
    </div>
  );
};
