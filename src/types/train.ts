export type TrainType =
  | 'Rajdhani'
  | 'Vande Bharat'
  | 'Shatabdi'
  | 'Tejas Rajdhani'
  | 'Duronto'
  | 'Superfast'
  | 'Mail / Express';

export type RunningState =
  | 'ON_TIME'
  | 'DELAYED'
  | 'STANDING_AT_STATION'
  | 'APPROACHING'
  | 'BETWEEN_STATIONS'
  | 'YET_TO_DEPART'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopStatus = 'COMPLETED' | 'CURRENT' | 'NEXT' | 'UPCOMING' | 'SKIPPED';

export interface StationStop {
  stationCode: string;
  stationName: string;
  scheduledArrival: string; // "18:35" or "--"
  scheduledDeparture: string; // "18:45" or "--"
  estimatedArrival: string;
  estimatedDeparture: string;
  delayArrivalMinutes: number;
  delayDepartureMinutes: number;
  platform: string;
  distanceFromOriginKm: number;
  day: number;
  haltMinutes: number;
  status: StopStatus;
  notes?: string;
}

export interface TrainRunningStatus {
  state: RunningState;
  delayMinutes: number;
  currentStationCode?: string;
  currentStationName?: string;
  nextStationCode?: string;
  nextStationName?: string;
  lastPassedStationCode?: string;
  lastPassedStationName?: string;
  distanceToNextKm?: number;
  currentSpeedKmph?: number;
  platform?: string;
  lastUpdated: string;
  statusExplanation: string;
  haltCountdownSeconds?: number;
}

export interface Train {
  id: string; // Train number e.g. "12951"
  number: string;
  name: string;
  type: TrainType;
  origin: {
    code: string;
    name: string;
    city: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
  };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  distanceKm: number;
  daysOfOperation: string[];
  classes: string[];
  currentStatus: TrainRunningStatus;
  stops: StationStop[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  trainId: string;
  badge: string;
}
