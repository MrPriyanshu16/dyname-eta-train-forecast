export type TrainType =
  | 'Rajdhani'
  | 'Vande Bharat'
  | 'Shatabdi'
  | 'Tejas Rajdhani'
  | 'Duronto'
  | 'Superfast'
  | 'Mail / Express'
  | 'Passenger'
  | 'Suburban'
  | 'MEMU'
  | string;

export type RunningState =
  | 'ON_TIME'
  | 'DELAYED'
  | 'STANDING_AT_STATION'
  | 'APPROACHING'
  | 'BETWEEN_STATIONS'
  | 'IN_TRANSIT'
  | 'YET_TO_DEPART'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopStatus = 'COMPLETED' | 'CURRENT' | 'NEXT' | 'UPCOMING' | 'SKIPPED';

export interface StationStop {
  stationCode: string;
  stationName: string;
  scheduledArrival: string; // "18:35" or "--"
  scheduledDeparture: string; // "18:45" or "--"
  actualArrival?: string | null;
  actualDeparture?: string | null;
  estimatedArrival: string;
  estimatedDeparture: string;
  scheduledArrivalDate?: string;
  estimatedArrivalDate?: string;
  estimatedDay?: number;
  delayArrivalMinutes: number;
  delayDepartureMinutes: number;
  predictedDelayMinutes?: number;
  platform: string;
  distanceFromOriginKm: number;
  day: number;
  haltMinutes: number;
  status: StopStatus;
  notes?: string;
  modelStatus?: string;
}

export interface BaselineComparisonItem {
  model: string;
  mae: number;
  rmse: number;
  medae: number;
  within_5m: number;
  within_10m: number;
}

export interface ModelPerformanceMetrics {
  status: string;
  active_model: string;
  model_version: string;
  target_definition: string;
  evaluation_period: string;
  test_observations: number;
  mae_minutes: number;
  rmse_minutes: number;
  median_absolute_error_minutes: number;
  within_5_minutes_percent: number;
  within_10_minutes_percent: number;
  within_15_minutes_percent: number;
  within_30_minutes_percent: number;
  uncertainty_interval_80_coverage: number;
  baseline_comparison: BaselineComparisonItem[];
  training_data: {
    training_period: string;
    validation_period: string;
    test_period: string;
    train_observations: number;
    val_observations: number;
    test_observations: number;
    feature_count: number;
    unique_trains_test: number;
    unique_stations_test: number;
  };
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
  startDate?: string;
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
