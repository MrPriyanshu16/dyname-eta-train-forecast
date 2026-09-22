/**
 * Returns the current live India Standard Time (IST, UTC+5:30) as a 24-hour railway time string e.g. "22:45"
 */
export function getCurrentISTString(): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  } catch {
    const d = new Date();
    // Fallback to manual UTC+5:30 offset
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const hours = istDate.getHours().toString().padStart(2, '0');
    const minutes = istDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

export function getCurrentISTMinutes(): number {
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const hr = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const min = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return hr * 60 + min;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

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

export function getRemainingTimeText(estimatedTimeStr: string, currentTimeStr: string = getCurrentISTString()): string {
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
