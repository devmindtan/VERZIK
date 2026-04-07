/**
 * Forecast Service - Template (API connections removed)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ForecastSummaryResponse {
  date: string;
  /** Null khi chưa có actual_value nào để tính */
  avgAccuracy: number | null;
  mae: number;
  mape: number;
  r2: number | null;
  totalSlots: number;
  coveredSlots: number;
  highRiskCount: number;
  networkTrend: "increase" | "decrease" | "stable" | null;
  networkChangePct: number | null;
}

export interface ForecastTimelinePoint {
  hour: number;
  predicted: number | null;
  actual: number | null;
  vcPct: number | null;
}

export interface ForecastTimelineResponse {
  success: boolean;
  date: string;
  camId: string;
  data: ForecastTimelinePoint[];
}

export type LosLevel =
  | "free_flow"
  | "smooth"
  | "moderate"
  | "heavy"
  | "congested";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type HorizonMinutes = 5 | 10 | 15 | 30 | 60;

export interface ForecastSlotItem {
  id: string;
  timeSlot: string;
  duration: HorizonMinutes;
  camId: string;
  camName: string;
  predictedVehicles: number;
  actualVehicles: number | null;
  errorPct: number | null;
  inputValue: number | null;
  predictedLos: LosLevel;
  actualLos: LosLevel | null;
  vcPct: number | null;
  riskLevel: RiskLevel;
  deltaVsWeekAvg: number | null;
  confidence: number | null;
  modelVersion?: string;
}

export interface ForecastSlotsResponse {
  success: boolean;
  total: number;
  data: ForecastSlotItem[];
}

export interface ForecastRollingSlot {
  t: string;
  actual: number | null;
  actualRef: number | null;
  currentRatio: number | null;
  /** true nếu slot này ở tương lai (t >= nowTime từ server) */
  isFuture: boolean;
  /** Mức dịch vụ LOS: A–F hoặc "—" khi chưa có V/C */
  los: string;
  /** Nhãn LOS tiếng Việt: "Thông thoáng" … "Tắc nghẽn" */
  losLabel: string;
  f5m: number | null;
  f10m: number | null;
  f15m: number | null;
  f30m: number | null;
  f60m: number | null;
}

/** Dữ liệu forecast của một camera bao gồm capacity và slot array */
export interface CameraForecast {
  /** Capacity camera (xe/5min) — đã tích hợp vào đây thay vì tách ra `capacities` map */
  capacity: number;
  slots: ForecastRollingSlot[];
}

export interface ForecastRollingResponse {
  success: boolean;
  metadata: {
    nowIndex: number;
    totalSlots: number;
    /** Thời gian hiện tại HH:MM theo giờ HCM (server-side) */
    nowTime: string;
    /** ISO timestamp khi API response được tạo */
    generatedAt: string;
    timeRange: { start: string; end: string };
    description: string;
  };
  /** backward-compat: capacity từng camera (xem cameras[id].capacity để dùng cùng nguồn) */
  capacities: Record<string, number>;
  cameras: Record<string, CameraForecast>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Lấy tổng hợp độ chính xác dự báo trong ngày (MAE, MAPE, R², coverage, highRiskCount)
 * GET /api/forecast/summary?date=YYYY-MM-DD
 */
export async function getForecastSummary(
  date: string,
): Promise<ForecastSummaryResponse> {
  // TODO: Connect to your API
  console.log("Get forecast summary:", date);
  return {
    date,
    avgAccuracy: null,
    mae: 0,
    mape: 0,
    r2: null,
    totalSlots: 0,
    coveredSlots: 0,
    highRiskCount: 0,
    networkTrend: null,
    networkChangePct: null,
  };
}

/**
 * Lấy chuỗi thời gian predicted vs actual theo từng giờ trong ngày
 * GET /api/forecast/timeline?date=YYYY-MM-DD&camId=all
 *
 * @param date  - Ngày cần lấy (YYYY-MM-DD)
 * @param camId - Camera ID cụ thể hoặc "all" để tổng hợp toàn mạng
 */
export async function getForecastTimeline(
  date: string,
  camId = "all",
): Promise<ForecastTimelineResponse> {
  // TODO: Connect to your API
  console.log("Get forecast timeline:", date, camId);
  return {
    success: true,
    date,
    camId,
    data: [],
  };
}

/**
 * Lấy danh sách slot dự báo per-camera với LOS và mức rủi ro
 * GET /api/forecast/slots?date=YYYY-MM-DD&horizon=5&limit=200
 *
 * @param date    - Ngày cần lấy slot
 * @param horizon - Horizon dự báo (phút): 5 | 10 | 15 | 30 | 60
 * @param limit   - Số slot tối đa trả về (default 200)
 */
export async function getForecastSlots(
  date: string,
  horizon: HorizonMinutes = 5,
  limit = 200,
): Promise<ForecastSlotsResponse> {
  // TODO: Connect to your API
  console.log("Get forecast slots:", date, horizon, limit);
  return {
    success: true,
    total: 0,
    data: [],
  };
}

/**
 * Lấy dữ liệu rolling forecast cho Dashboard (ngày hiện tại, 5 horizons)
 * GET /api/forecast/rolling?cameraId=all
 *
 * @param cameraId - Camera ID cụ thể hoặc "all" để tổng hợp toàn mạng
 */
export async function getForecastRolling(
  cameraId = "all",
): Promise<ForecastRollingResponse> {
  // TODO: Connect to your API
  console.log("Get forecast rolling:", cameraId);
  return {
    success: true,
    metadata: {
      nowIndex: 0,
      totalSlots: 0,
      nowTime: "00:00",
      generatedAt: new Date().toISOString(),
      timeRange: { start: "00:00", end: "23:55" },
      description: "Mock data",
    },
    capacities: {},
    cameras: {},
  };
}
