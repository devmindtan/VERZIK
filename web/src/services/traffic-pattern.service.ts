/**
 * Traffic Pattern Service - Template (API connections removed)
 */

export type PatternType = "hour" | "dow" | "week_of_month" | "month";

export interface TrafficPatternPoint {
  label: string;
  avg_vehicles: number;
  max_vehicles: number;
  sample_count: number;
}

export interface TrafficPatternResponse {
  success: boolean;
  type: PatternType;
  camera_id: string;
  time_range?: { from: string; to: string };
  data: TrafficPatternPoint[];
  meta: {
    total_cameras: number;
  };
}

/**
 * Mock get traffic pattern
 */
export async function getTrafficPattern(
  type: PatternType,
  cameraId = "all"
): Promise<TrafficPatternResponse> {
  // TODO: Connect to your API
  console.log("Get traffic pattern:", type, cameraId);
  return {
    success: true,
    type,
    camera_id: cameraId,
    data: [],
    meta: {
      total_cameras: 0,
    },
  };
}
