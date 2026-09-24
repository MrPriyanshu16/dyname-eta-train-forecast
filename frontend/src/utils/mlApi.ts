/**
 * TRACKLINE Machine Learning API Client
 * Connects to the local FastAPI dynamic ETA forecasting service (port 8000).
 */

const ML_API_BASE_URL = 'http://127.0.0.1:8000';

export interface MLPredictionResponse {
  train_number: string;
  train_name: string;
  timestamp: string;
  current_location: {
    latitude: number;
    longitude: number;
    speed_kmh: number;
    nearest_station: string;
    current_section: string;
    distance_from_origin_km: number;
    distance_remaining_km: number;
    route_status: 'CONSISTENT' | 'INCONSISTENT' | 'UNCERTAIN';
    is_valid: boolean;
    validation_issues: string[];
  };
  operational_context: {
    current_delay_minutes: number;
    weather_fog_index: number;
    rainfall_intensity?: number;
    ambient_temp_c?: number;
    tsr_speed_kmh?: number;
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
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  current_delay_minutes?: number;
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
    const res = await fetch(`${ML_API_BASE_URL}/api/model/metrics`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
