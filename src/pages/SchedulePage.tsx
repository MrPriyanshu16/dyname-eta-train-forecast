import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { ScheduleTable } from '../components/schedule/ScheduleTable';
import { ArrowLeft, Compass, Calendar, ArrowRight, Info } from 'lucide-react';
import { TrainStatusBadge } from '../components/train/TrainStatusBadge';
import { fetchTrainDetailsFromMaster } from '../utils/mlApi';
import { Train } from '../types/train';

export const SchedulePage: React.FC = () => {
  const { trainId } = useParams<{ trainId: string }>();
  const navigate = useNavigate();
  const { getTrainById } = useSimulation();

  const localTrain = trainId ? getTrainById(trainId) : undefined;
  const [apiTrain, setApiTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState<boolean>(!localTrain);

  useEffect(() => {
    if (localTrain) {
      setLoading(false);
      return;
    }
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
          } else {
            setApiTrain(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiTrain(null);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [trainId, localTrain]);

  const train = localTrain || apiTrain;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Loading timetable for train {trainId}...
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
        <p className="text-xs text-slate-500 dark:text-slate-400">We could not find the schedule for train {trainId}.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-colors">
      {/* Top Breadcrumb & Return to Live Tracking */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/train/${train.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Live Tracking
        </button>

        <Link
          to={`/train/${train.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Live Running Status</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                {train.number}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {train.name} — Full Timetable
              </h1>
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
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {train.duration} journey ({train.distanceKm} km)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <TrainStatusBadge
              state={train.currentStatus.state}
              delayMinutes={train.currentStatus.delayMinutes}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Timetable Component */}
      <ScheduleTable train={train} />
    </div>
  );
};
