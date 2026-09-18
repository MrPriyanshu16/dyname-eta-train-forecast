import React from 'react';
import { RunningState } from '../../types/train';

interface TrainStatusBadgeProps {
  state: RunningState;
  delayMinutes: number;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const TrainStatusBadge: React.FC<TrainStatusBadgeProps> = ({
  state,
  delayMinutes,
  size = 'md',
  showDot = true
}) => {
  let bg = 'bg-slate-100 dark:bg-slate-800';
  let text = 'text-slate-700 dark:text-slate-300';
  let border = 'border-slate-200 dark:border-slate-700';
  let dotColor = 'bg-slate-400 dark:bg-slate-500';
  let label = 'On Time';

  switch (state) {
    case 'ON_TIME':
      bg = 'bg-emerald-50 dark:bg-emerald-950/40';
      text = 'text-emerald-700 dark:text-emerald-300';
      border = 'border-emerald-200 dark:border-emerald-800/60';
      dotColor = 'bg-emerald-500';
      label = 'On Time';
      break;

    case 'DELAYED':
      bg = 'bg-amber-50 dark:bg-amber-950/40';
      text = 'text-amber-800 dark:text-amber-300';
      border = 'border-amber-200 dark:border-amber-800/60';
      dotColor = 'bg-amber-500';
      label = delayMinutes > 0 ? `${delayMinutes} min late` : 'Delayed';
      break;

    case 'STANDING_AT_STATION':
      bg = 'bg-blue-50 dark:bg-blue-950/40';
      text = 'text-blue-800 dark:text-blue-300';
      border = 'border-blue-200 dark:border-blue-800/60';
      dotColor = 'bg-blue-600 animate-ping';
      label = delayMinutes > 0 ? `At Station (+${delayMinutes}m)` : 'At Station';
      break;

    case 'APPROACHING':
      bg = 'bg-indigo-50 dark:bg-indigo-950/40';
      text = 'text-indigo-800 dark:text-indigo-300';
      border = 'border-indigo-200 dark:border-indigo-800/60';
      dotColor = 'bg-indigo-500';
      label = delayMinutes > 0 ? `Approaching (+${delayMinutes}m)` : 'Approaching';
      break;

    case 'BETWEEN_STATIONS':
      bg = 'bg-sky-50 dark:bg-sky-950/40';
      text = 'text-sky-800 dark:text-sky-300';
      border = 'border-sky-200 dark:border-sky-800/60';
      dotColor = 'bg-sky-500';
      label = delayMinutes > 0 ? `In Transit (+${delayMinutes}m)` : 'In Transit';
      break;

    case 'COMPLETED':
      bg = 'bg-slate-100 dark:bg-slate-800';
      text = 'text-slate-800 dark:text-slate-200';
      border = 'border-slate-300 dark:border-slate-700';
      dotColor = 'bg-slate-500';
      label = 'Journey Completed';
      break;

    case 'YET_TO_DEPART':
      bg = 'bg-purple-50 dark:bg-purple-950/40';
      text = 'text-purple-800 dark:text-purple-300';
      border = 'border-purple-200 dark:border-purple-800/60';
      dotColor = 'bg-purple-500';
      label = 'Yet to Depart';
      break;

    case 'CANCELLED':
      bg = 'bg-rose-50 dark:bg-rose-950/40';
      text = 'text-rose-700 dark:text-rose-300';
      border = 'border-rose-200 dark:border-rose-800/60';
      dotColor = 'bg-rose-500';
      label = 'Cancelled';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${text} ${border} ${sizeClasses} tracking-tight select-none`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {state === 'STANDING_AT_STATION' && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              state === 'STANDING_AT_STATION' ? 'bg-blue-600' : dotColor
            }`}
          />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};
