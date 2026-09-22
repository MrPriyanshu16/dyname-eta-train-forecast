import React, { useState, useEffect } from 'react';
import { Train, StationStop } from '../../types/train';
import { getDelayBadgeText, getRemainingTimeText } from '../../utils/time';
import {
  Clock,
  MapPin,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  TrendingDown,
  Radio,
  Info
} from 'lucide-react';
import { TrainStatusBadge } from '../train/TrainStatusBadge';
import { predictETAWithML, MLPredictionResponse } from '../../utils/mlApi';

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
  const [mlData, setMlData] = useState<MLPredictionResponse | null>(null);
  const [isMlLoading, setIsMlLoading] = useState(false);

  const isCompleted = train.currentStatus.state === 'COMPLETED';
  const isDelayed = targetStation.delayArrivalMinutes > 0;
  const isTargetDestination = targetStation.stationCode === train.destination.code;
  const isOrigin = targetStation.stationCode === train.origin.code;

  // Poll / Query ML Model when train or target station changes
  useEffect(() => {
    let isMounted = true;
    async function fetchML() {
      setIsMlLoading(true);
      const res = await predictETAWithML({
        train_number: train.number,
        timestamp: new Date().toISOString(),
        latitude: null,
        longitude: null,
        speed: train.currentStatus.currentSpeedKmph ?? null,
        current_delay_minutes: train.currentStatus.delayMinutes || 0.0,
        current_station_code: targetStation.stationCode,
        weather_fog_index: 0.0
      });
      if (isMounted && res) {
        setMlData(res);
      }
      if (isMounted) setIsMlLoading(false);
    }

    fetchML();
    return () => {
      isMounted = false;
    };
  }, [train.number, train.currentStatus.delayMinutes, targetStation.stationCode]);

  // Find target station in ML predictions
  const mlStationPred = mlData?.predictions.upcoming_stations.find(
    s => s.station_code === targetStation.stationCode
  );
  const mlDestPred = mlData?.predictions.destination;

  // Active ETA string: Use ML predicted ETA if available, otherwise local timetable estimate
  const activeETA = isTargetDestination
    ? mlDestPred?.predicted_eta || (targetStation.estimatedArrival !== '--' ? targetStation.estimatedArrival : targetStation.estimatedDeparture)
    : mlStationPred?.predicted_eta || (targetStation.estimatedArrival !== '--' ? targetStation.estimatedArrival : targetStation.estimatedDeparture);

  const scheduledTime = targetStation.scheduledArrival !== '--'
    ? targetStation.scheduledArrival
    : targetStation.scheduledDeparture;

  const ntesBaselineETA = isTargetDestination
    ? mlDestPred?.ntes_baseline_eta
    : mlStationPred?.ntes_baseline_eta;

  const remainingMinutes = isTargetDestination
    ? mlDestPred?.predicted_remaining_minutes
    : mlStationPred?.predicted_remaining_minutes;

  const remainingText = isCompleted
    ? 'Journey Completed'
    : remainingMinutes !== undefined
    ? `${Math.floor(remainingMinutes / 60)}h ${Math.round(remainingMinutes % 60)}m remaining`
    : getRemainingTimeText(
        targetStation.estimatedArrival !== '--'
          ? targetStation.estimatedArrival
          : targetStation.estimatedDeparture,
        train.currentStatus.lastUpdated.replace(/ [AP]M/i, '')
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isTargetDestination ? 'Final Destination' : 'Target Station'}
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

          {/* Live Telemetry Indicator Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Official NTES Live Tracking</span>
          </span>
          {train.startDate && (
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
              Journey Date: <strong className="text-slate-900 dark:text-white">{train.startDate}</strong>
            </span>
          )}
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

      {/* Main NTES-Style Clean Status & ETA Display Section */}
      <div className="py-5 space-y-5">
        {/* Station Title & Platform */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isTargetDestination ? 'Target Destination' : (isOrigin ? 'Origin Station' : 'Selected Intermediate Station')}
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {targetStation.stationName}
              </h1>
              <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {targetStation.stationCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {targetStation.platform && (
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Platform {targetStation.platform}
              </span>
            )}
          </div>
        </div>

        {/* 3 NTES-Style Color-Coded Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Box 1: Scheduled Time (White / Neutral text) */}
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Scheduled Time (STA)</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums my-1">
              {scheduledTime}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>{targetStation.scheduledArrivalDate || (train.startDate ? `Day ${targetStation.day}` : 'Official Indian Railways Timetable')}</span>
              {targetStation.day > 1 && (
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 font-semibold text-[10px]">
                  Day {targetStation.day}
                </span>
              )}
            </div>
          </div>

          {/* Box 2: Actual / Expected Time (Red if Delayed, Green if On Time) */}
          <div className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between ${
            isDelayed
              ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-950 dark:text-red-100'
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-100'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className={isDelayed ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>
                Actual / Expected Time (ETA)
              </span>
              {mlData && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  LIVE TELEMETRY
                </span>
              )}
            </div>
            <div className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums my-1 ${
              isDelayed ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {activeETA}
            </div>
            <div className={`text-[11px] font-medium flex items-center justify-between ${
              isDelayed ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              <div className="flex items-center gap-1">
                {isDelayed ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                    <span>{targetStation.estimatedArrivalDate || targetStation.scheduledArrivalDate || 'Expected with delay'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{targetStation.estimatedArrivalDate || targetStation.scheduledArrivalDate || 'Running on schedule'}</span>
                  </>
                )}
              </div>
              {targetStation.day > 1 && (
                <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                  isDelayed ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}>
                  Day {targetStation.day}
                </span>
              )}
            </div>
          </div>

          {/* Box 3: Big NTES Solid Color Delay Block */}
          <div className={`p-4 rounded-xl shadow-xs text-white flex flex-col justify-between ${
            isDelayed
              ? 'bg-red-600 dark:bg-red-600'
              : 'bg-emerald-600 dark:bg-emerald-600'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-90 mb-1">
              Current Delay Status
            </div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight my-1">
              {isDelayed ? `LATE BY ${targetStation.delayArrivalMinutes} MINS` : 'RIGHT TIME (ON TIME)'}
            </div>
            <div className="text-[11px] opacity-90 leading-tight">
              {train.currentStatus.statusExplanation}
            </div>
          </div>
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
            {mlData?.current_location.current_section && (
              <span className="text-slate-400 ml-1.5">
                (Section: <span className="font-mono font-medium">{mlData.current_location.current_section}</span>)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          {train.currentStatus.currentSpeedKmph !== undefined && train.currentStatus.currentSpeedKmph !== null ? (
            <span>Speed: {train.currentStatus.currentSpeedKmph} km/h</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Speed: Offline (Timetable Mode)</span>
          )}
          {train.currentStatus.distanceToNextKm !== undefined && (
            <span>Distance: {train.currentStatus.distanceToNextKm} km to go</span>
          )}
        </div>
      </div>
    </div>
  );
};
