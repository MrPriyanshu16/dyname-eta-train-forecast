/**
 * Utility functions for time arithmetic, parsing, and tabular formatting.
 */

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '--') return -1;
  const parts = timeStr.split(':');
  if (parts.length < 2) return -1;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  if (totalMinutes < 0) return '--';
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || timeStr === '--') return '--';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === -1) return timeStr;
  return formatMinutesToTime(mins + minutesToAdd);
}

export function getDelayBadgeText(delayMinutes: number): string {
  if (delayMinutes <= 0) {
    return 'On time';
  } else if (delayMinutes === 1) {
    return '1 min late';
  } else {
    return `${delayMinutes} min late`;
  }
}

export function getRemainingTimeText(estimatedTimeStr: string, currentTimeStr: string = '10:42'): string {
  const estMins = parseTimeToMinutes(estimatedTimeStr);
  const curMins = parseTimeToMinutes(currentTimeStr);
  if (estMins === -1 || curMins === -1) return '';

  let diff = estMins - curMins;
  // Account for next-day arrival
  if (diff < -120) {
    diff += 1440;
  }

  if (diff <= 0) {
    return 'Arrived / Passed';
  } else if (diff < 60) {
    return `In ~${diff} min`;
  } else {
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `In ~${hrs}h ${mins}m` : `In ~${hrs}h`;
  }
}

export function calculateJourneyDuration(depStr: string, arrStr: string, daysSpan: number = 0): string {
  const dep = parseTimeToMinutes(depStr);
  const arr = parseTimeToMinutes(arrStr);
  if (dep === -1 || arr === -1) return '--';

  let diff = (arr - dep) + (daysSpan * 1440);
  if (diff < 0) diff += 1440;

  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}
