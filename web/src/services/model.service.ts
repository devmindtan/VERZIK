/**
 * Model Service - Template (API connections removed)
 */

export interface MLModelMetadata {
  id: number;
  model_type: string;
  model_version: string;
  minio_key: string;
  base_model: string | null;
  training_samples: number | null;
  training_duration_hours: number | null;
  metrics: {
    mae?: number;
    rmse?: number;
    r2?: number;
    features?: string[];
    [key: string]: unknown;
  } | null;
  is_active: boolean;
  created_at: string;
  display_name: string;
}

export interface ModelHistoryResponse {
  success: boolean;
  model_type: string;
  display_name: string;
  data: MLModelMetadata[];
}

export interface ActiveModelsResponse {
  success: boolean;
  data: MLModelMetadata[];
}

export interface AllVersionsResponse {
  success: boolean;
  data: Record<string, MLModelMetadata[]>;
}

/**
 * Mock get active models
 */
export const getActiveModels = async (): Promise<MLModelMetadata[]> => {
  // TODO: Connect to your API
  return [];
};

/**
 * Mock get model by ID
 */
export const getModelById = async (id: number): Promise<MLModelMetadata> => {
  // TODO: Connect to your API
  console.log("Get model:", id);
  throw new Error("Model not found");
};

/**
 * Mock get model history
 */
export const getModelHistory = async (id: number): Promise<ModelHistoryResponse> => {
  // TODO: Connect to your API
  console.log("Get model history:", id);
  return {
    success: true,
    model_type: "",
    display_name: "",
    data: [],
  };
};

/**
 * Mock get all model versions
 */
export const getAllModelVersions = async (): Promise<Record<string, MLModelMetadata[]>> => {
  // TODO: Connect to your API
  return {};
};

/**
 * Mock activate model
 */
export const activateModel = async (
  id: number
): Promise<{ success: boolean; message: string; k8s_restart: boolean }> => {
  // TODO: Connect to your API
  console.log("Activate model:", id);
  return {
    success: true,
    message: "Mock activation",
    k8s_restart: false,
  };
};

/**
 * Mock train model
 */
export const trainModel = async (payload: {
  model_type: string;
  start_date: string;
  end_date: string;
}): Promise<{ success: boolean; job_name: string; job_id: string; status: string }> => {
  // TODO: Connect to your API
  console.log("Train model:", payload);
  return {
    success: true,
    job_name: "mock-job",
    job_id: "mock-id",
    status: "pending",
  };
};

/**
 * Get R² color badge
 */
export const getR2Color = (r2: number | undefined): string => {
  if (r2 === undefined) return "text-muted-foreground";
  if (r2 >= 0.9) return "text-green-600 dark:text-green-400";
  if (r2 >= 0.8) return "text-blue-600 dark:text-blue-400";
  if (r2 >= 0.7) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

/**
 * Format model short label
 */
export const getModelShortLabel = (model_type: string): string => {
  const map: Record<string, string> = {
    random_forest_5m: "RF • 5 phút",
    random_forest_10m: "RF • 10 phút",
    random_forest_15m: "RF • 15 phút",
    random_forest_30m: "RF • 30 phút",
    random_forest_60m: "RF • 60 phút",
    yolo: "YOLO",
  };
  return map[model_type] ?? model_type;
};

/**
 * Format version timestamp
 */
export const formatVersion = (version: string): string => {
  const match = version.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/);
  if (!match) return version;
  const [, y, mo, d, h, min] = match;
  return `${d}/${mo}/${y} ${h}:${min}`;
};
