/**
 * Model Metrics Service - Template (API connections removed)
 */

export interface HorizonMetric {
  horizon_minutes: number;
  total_predictions: number;
  avg_error: number;
  median_error: number;
  p95_error: number;
  min_error: number;
  max_error: number;
  accuracy_5xe: number;
  accuracy_10xe: number;
  recommendation?: string;
  status?: string;
  prediction_confidence?: {
    score: number;
    level: string;
    low_sample_count: number;
  };
  error_confidence?: {
    score: number;
    level: string;
    mismatch_count: number;
  };
}

export interface CameraRankingItem {
  camera_id: string;
  predictions_count: number;
  avg_error: number;
  median_error: number;
  error_percentage: number;
  accuracy_5xe: number;
}

export interface ModelMetricsHistoryRow {
  id: number;
  generated_at: string;
  period_days: number;
  overall: {
    total_predictions: number;
    verified_predictions: number;
    mae: number;
    rmse: number;
    mape: number;
    accuracy_5xe: number;
    accuracy_10xe: number;
    accuracy_15xe: number;
    verification_rate: number;
    avg_input_samples?: number;
    avg_lag_samples?: number;
    avg_sync_samples?: number;
    low_sample_forecasts?: number;
    mismatched_syncs?: number;
    prediction_confidence?: {
      score: number;
      level: string;
      avg_input_samples: number;
      avg_lag_samples: number;
      low_sample_count: number;
    };
    error_confidence?: {
      score: number;
      level: string;
      avg_sync_samples: number;
      mismatched_count: number;
    };
  };
  by_horizon: HorizonMetric[];
  camera_ranking: {
    best: CameraRankingItem[];
    worst: CameraRankingItem[];
  };
  data_coverage: {
    total_predictions: number;
    verified: number;
    pending: number;
    verification_rate: number;
    last_updated: string;
    minutes_since_update: number;
  };
  trend_accuracy: {
    trend_accuracy: number;
    total_checks: number;
    correct_predictions: number;
    correct_increasing: number;
    correct_decreasing: number;
    correct_stable: number;
    incomplete_groups?: number;
    horizon_coverage_pct?: number;
    method?: string;
    per_horizon?: {
      horizon_minutes: number;
      trend_accuracy: number;
      total_checks: number;
      correct_predictions: number;
      correct_increasing: number;
      correct_decreasing: number;
      correct_stable: number;
    }[];
  };
  confidence_distribution?: {
    total_records: number;
    verified_records: number;
    avg_input_samples: number;
    avg_lag_samples: number;
    avg_sync_samples: number;
    high_quality_predictions: number;
    low_quality_predictions: number;
    high_quality_percent: number;
    low_quality_percent: number;
    consistent_syncs: number;
    inconsistent_syncs: number;
    consistent_sync_percent: number;
    inconsistent_sync_percent: number;
  };
  created_at: string;
}

/**
 * Mock get latest model metrics
 */
export async function getLatestModelMetrics(): Promise<ModelMetricsHistoryRow | null> {
  // TODO: Connect to your API
  return null;
}

/**
 * Mock get model metrics history
 */
export async function getModelMetricsHistory(limit: number = 20): Promise<ModelMetricsHistoryRow[]> {
  // TODO: Connect to your API
  console.log("Get model metrics history, limit:", limit);
  return [];
}
