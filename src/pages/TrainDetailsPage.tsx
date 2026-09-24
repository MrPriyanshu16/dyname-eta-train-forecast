import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { ArrivalEstimateCard } from '../components/tracking/ArrivalEstimateCard';
import { CurrentLocationBanner } from '../components/tracking/CurrentLocationBanner';
import { RouteProgressTimeline } from '../components/tracking/RouteProgressTimeline';
import { ModelPerformanceCard } from '../components/tracking/ModelPerformanceCard';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { fetchTrainDetailsFromMaster } from '../utils/mlApi';
import { Train } from '../types/train';
import {
  ArrowLeft,
  Calendar,
  Bookmark,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

export const TrainDetailsPage: React.FC = () => {
  const { trainId } = useParams<{ trainId: string }>();
  const navigate = useNavigate();

  const {
    getTrainById,
    isTrainSaved,
    toggleSaveTrain,
    selectedTargetStations,
    setSelectedTargetStation
  } = useSimulation();

  const [copied, setCopied] = useState(false);

  const localTrain = trainId ? getTrainById(trainId) : undefined;
  const [apiTrain, setApiTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!trainId) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    fetchTrainDetailsFromMaster(trainId)
      .then((data) => {
        if (isMounted) {
          if (data && data.number) {
            setApiTrain(data);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [trainId]);

  const train = apiTrain || localTrain;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Loading itinerary for train {trainId}...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Querying railway master database (5,208 Trains)
        </p>
      </div>
    );
  }

  if (!train) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
          <Info className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Train Not Found</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          We could not locate train records for "{trainId}". The train number may be invalid or not currently active in the tracking network.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Search
        </Link>
      </div>
    );
  }

  const isSaved = isTrainSaved(train.id);

  // Determine current target station for the main arrival estimate card:
  const upcomingStops = train.stops.filter(s => s.status !== 'COMPLETED');
  const availableStops = upcomingStops.length > 0 ? upcomingStops : train.stops;

  const currentSelectedCode =
    selectedTargetStations[train.id] ||
    train.destination.code ||
    (train.stops.length > 0 ? train.stops[train.stops.length - 1].stationCode : '');

  const targetStation =
    train.stops.find(s => s.stationCode === currentSelectedCode) ||
    train.stops[train.stops.length - 1] ||
    train.stops[0];

  const handleSelectStation = (stationCode: string) => {
    setSelectedTargetStation(train.id, stationCode);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-colors">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to search
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Full timetable link */}
          <Link
            to={`/train/${train.id}/schedule`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Full Timetable</span>
          </Link>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Copy share link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Save / Pin button */}
          <button
            onClick={() => toggleSaveTrain(train.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs cursor-pointer ${
              isSaved
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>{isSaved ? 'Saved' : 'Save Train'}</span>
          </button>
        </div>
      </div>

      {/* Train Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100/90 dark:border-indigo-900">
                {train.number}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {train.name}
              </h1>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                {train.type}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {train.origin.name} ({train.origin.code})
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {train.destination.name} ({train.destination.code})
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">{train.distanceKm} km</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                Runs: {train.daysOfOperation.join(', ')}
              </span>
            </div>
          </div>

          {/* Status & Live Timestamp */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <TrainStatusBadge
              state={train.currentStatus.state}
              delayMinutes={train.currentStatus.delayMinutes}
              size="lg"
            />
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                {train.startDate ? `Journey Date: ${train.startDate}` : 'Live NTES Telemetry'}
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{train.currentStatus.lastUpdated}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Visual: Primary Arrival Estimate Card */}
      <ArrivalEstimateCard
        train={train}
        targetStation={targetStation}
        upcomingStops={availableStops}
        onSelectStation={handleSelectStation}
      />

      {/* Current Location & Telemetry Statement */}
      <CurrentLocationBanner train={train} />

      {/* Route Progress Timeline */}
      <RouteProgressTimeline
        train={train}
        selectedStationCode={targetStation.stationCode}
        onSelectStation={handleSelectStation}
      />

      {/* Dynamic ETA Model Performance Card */}
      <ModelPerformanceCard />
    </div>
  );
};
