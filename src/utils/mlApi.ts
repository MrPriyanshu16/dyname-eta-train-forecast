/**
 * TRACKLINE Machine Learning API Client
 * Connects to the local FastAPI dynamic ETA forecasting service (port 8000).
 */

const ML_API_BASE_URL = 'http://127.0.0.1:8000';

export interface MLPredictionResponse {
  train_number: string;
  train_name: string;
  timestamp: string;
  telemetry?: {
    telemetry_status: string;
    latitude: number | null;
    longitude: number | null;
    speed_kmh: number | null;
  };
  current_location: {
    latitude: number | null;
    longitude: number | null;
    speed_kmh: number | null;
    nearest_station: string;
    current_section: string;
    distance_from_origin_km: number;
    distance_remaining_km: number;
    route_status: string;
    is_valid: boolean;
    validation_issues: string[];
  };
  operational_context: {
    current_delay_minutes: number;
    weather_fog_index: number;
    section_occupancy_ratio: number;
    headway_km: number;
  };
  predictions: {
    destination: {
      station_code: string;
      station_name: string;
      predicted_remaining_minutes: number;
      predicted_eta: string;
      prediction_interval_80pct: {
        lower_eta: string;
        upper_eta: string;
      };
      ntes_baseline_eta: string;
      ai_time_savings_vs_ntes_min: number;
    };
    upcoming_stations: Array<{
      station_code: string;
      station_name: string;
      distance_km: number;
      predicted_remaining_minutes: number;
      predicted_eta: string;
      ntes_baseline_eta: string;
      is_junction: boolean;
    }>;
  };
}

export interface ModelMetricsResponse {
  overall_model_comparison: Record<string, {
    mae_minutes: number;
    rmse_minutes: number;
    median_ae_minutes: number;
    r2_score: number;
    within_5_min_pct: number;
    within_10_min_pct: number;
    within_15_min_pct: number;
    within_30_min_pct: number;
    sample_count: number;
  }>;
  error_analysis_by_priority_tier: Record<string, {
    sample_count: number;
    mae_ntes: number;
    mae_ml: number;
    improvement_pct: number;
  }>;
  error_analysis_by_prediction_horizon: Record<string, {
    sample_count: number;
    mae_ntes: number;
    mae_ml: number;
    improvement_pct: number;
  }>;
}

export interface SimulatorStepResponse {
  simulator_state: {
    active_disruption: string | null;
    current_speed_kmh: number;
    km_position: number;
    current_delay_minutes: number;
    weather_fog_index: number;
    is_signal_halt: boolean;
    progress_percentage: number;
  };
  telemetry_ping: {
    timestamp: string;
    train_number: string;
    latitude: number;
    longitude: number;
    speed_kmh: number;
  };
  eta_forecast: MLPredictionResponse;
}

export async function checkMLBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/`, { method: 'GET', signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function predictETAWithML(params: {
  train_number: string;
  timestamp?: string;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  current_delay_minutes?: number;
  current_station_code?: string;
  weather_fog_index?: number;
}): Promise<MLPredictionResponse | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/predict-eta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function stepRTISSimulator(delta_minutes: number = 5.0): Promise<SimulatorStepResponse | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/simulator/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta_minutes }),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function injectSimulatorDisruption(disruption_type: string, severity?: number): Promise<{ status: string; active_disruption: string | null } | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/simulator/disruption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disruption_type, severity }),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/reports/summary`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface MasterTrainSearchResult {
  total: number;
  page: number;
  limit: number;
  trains: Array<{
    train_number: string;
    train_name: string;
    train_type: string;
    category: string;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    distance_km: number;
    zone: string;
  }>;
}

export interface SystemDataStatusResponse {
  status: string;
  data_mode: string;
  data_provenance: {
    master_source: string;
    historical_delay_source: string;
    total_master_trains: number;
    total_master_stations: number;
    total_station_delay_records: number;
    category_distribution: Record<string, number>;
  };
}

export async function searchMasterTrains(
  query: string,
  category: string = 'ALL',
  page: number = 1,
  limit: number = 50
): Promise<MasterTrainSearchResult | null> {
  try {
    const params = new URLSearchParams({
      search: query,
      category: category,
      page: String(page),
      limit: String(limit)
    });
    const res = await fetch(`${ML_API_BASE_URL}/api/trains?${params.toString()}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTrainDetailsFromMaster(trainNumber: string): Promise<any | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/trains/${encodeURIComponent(trainNumber.trim())}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchStationSchedule(stationCode: string): Promise<any | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/stations/${encodeURIComponent(stationCode.trim())}/schedule`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSystemDataStatus(): Promise<SystemDataStatusResponse | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/system/data-status`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

import type { ModelPerformanceMetrics } from '../types/train';

export async function fetchModelPerformanceMetrics(): Promise<ModelPerformanceMetrics | null> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/api/eta/performance`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface StationSearchResult {
  scope: string;
  count: number;
  stations: Array<{
    code: string;
    name: string;
    state: string;
    zone: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    platforms: number;
  }>;
}

export interface PlannedJourneyTrain {
  train_number: string;
  train_name: string;
  category: string;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  estimated_arrival: string;
  current_delay_minutes: number;
  predicted_delay_minutes: number;
  duration: string;
  stops_count: number;
  distance_km: number;
  state: string;
  model_status: string;
}

export interface PlanJourneyResponse {
  scope: string;
  from_station: string;
  to_station: string;
  count: number;
  trains: PlannedJourneyTrain[];
  message: string;
}

export async function searchStationsFromMaster(
  search: string = '',
  scope: string = 'rajasthan',
  limit: number = 60
): Promise<StationSearchResult | null> {
  try {
    const params = new URLSearchParams({ scope, limit: String(limit) });
    if (search.trim()) params.append('search', search.trim());
    const res = await fetch(`${ML_API_BASE_URL}/api/stations?${params.toString()}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function planJourney(
  fromStation: string,
  toStation: string,
  scope: string = 'rajasthan'
): Promise<PlanJourneyResponse | null> {
  try {
    const params = new URLSearchParams({
      from_station: fromStation.trim(),
      to_station: toStation.trim(),
      scope
    });
    const res = await fetch(`${ML_API_BASE_URL}/api/plan-journey?${params.toString()}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


