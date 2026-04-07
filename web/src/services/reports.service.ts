/**
 * Reports Service - Template (API connections removed)
 */
import type { HistoryEntry } from "@/components/reports/reports-types";

export interface SmartReport {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "quarterly" | "custom" | "incident";
  period_from: string;
  period_to: string;
  status: "pending" | "generating" | "ready" | "failed";
  files_json: {
    pdf?: { path: string; sizeMB: number; url: string };
    xlsx?: { path: string; sizeMB: number; url: string };
  } | null;
  summary_json: AnalyzedSummary | null;
  settings_json: ReportSettings | null;
  created_by: string | null;
  created_at: string;
  generated_at: string | null;
  error_message: string | null;
}

export interface AnalyzedSummary {
  overview: {
    totalVehicles: number;
    avgDensityScore: number;
    peakHours: {
      hour: string;
      volume: number;
      severity: "low" | "medium" | "high";
    }[];
    incidentCount: number;
    weatherImpact: "none" | "low" | "medium" | "high";
  };
  performance: {
    modelAccuracy: number;
    predictionConfidence: number;
    dataQuality: "poor" | "fair" | "good" | "excellent";
    coveragePercentage: number;
  };
  insights: {
    trends: string[];
    anomalies: string[];
    recommendations: string[];
  };
  camerasAnalysis: {
    cameraId: string;
    name: string;
    totalVehicles: number;
    avgVehiclePerHour: number;
    peakDensity: number;
    incidentCount: number;
    reliability: number;
    riskLevel: "low" | "medium" | "high";
  }[];
}

export interface ReportSettings {
  includeCharts?: boolean;
  includeRawData?: boolean;
  emailNotifications?: boolean;
  hour_from?: number | null;
  hour_to?: number | null;
  [key: string]: unknown;
}

export interface CreateReportRequest {
  title: string;
  type: SmartReport["type"];
  period_from: string;
  period_to: string;
  settings?: ReportSettings;
}

export interface ReportsListResponse {
  success: boolean;
  data: SmartReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Mock get reports
 */
export async function getReports(
  params: {
    page?: number;
    limit?: number;
    type?: SmartReport["type"];
    status?: SmartReport["status"];
    search?: string;
  } = {},
): Promise<ReportsListResponse> {
  // TODO: Connect to your API
  console.log("Get reports:", params);
  return {
    success: true,
    data: [],
    pagination: {
      page: params.page || 1,
      limit: params.limit || 10,
      total: 0,
      totalPages: 0,
    },
  };
}

/**
 * Mock get report by ID
 */
export async function getReportById(
  id: string,
): Promise<{ success: boolean; data: SmartReport }> {
  // TODO: Connect to your API
  console.log("Get report:", id);
  throw new Error("Report not found");
}

/**
 * Mock create report
 */
export async function createReport(
  request: CreateReportRequest,
): Promise<{
  success: boolean;
  data: { id: string; status: "pending"; message: string };
}> {
  // TODO: Connect to your API
  console.log("Create report:", request);
  return {
    success: true,
    data: {
      id: "mock-id",
      status: "pending",
      message: "Report created",
    },
  };
}

/**
 * Mock delete report
 */
export async function deleteReport(
  id: string,
): Promise<{ success: boolean; message: string }> {
  // TODO: Connect to your API
  console.log("Delete report:", id);
  return { success: true, message: "Report deleted" };
}

/**
 * Get download URL (mock)
 */
export function getDownloadUrl(id: string, format: "pdf" | "xlsx"): string {
  return `#download-${id}-${format}`;
}

/**
 * Get download both URL (mock)
 */
export function getDownloadBothUrl(id: string): string {
  return `#download-${id}-both`;
}

/**
 * Mock download report blob
 */
export async function downloadReportBlob(
  id: string,
  format: "pdf" | "xlsx" | "zip",
  filename: string,
): Promise<void> {
  // TODO: Connect to your API
  console.log("Download report:", id, format, filename);
}

/**
 * Mock get report history
 */
export async function getReportHistory(params?: {
  limit?: number;
  offset?: number;
  action?: string;
}): Promise<{
  success: boolean;
  data: HistoryEntry[];
  pagination: { limit: number; offset: number; total: number };
}> {
  // TODO: Connect to your API
  console.log("Get report history:", params);
  return {
    success: true,
    data: [],
    pagination: {
      limit: params?.limit || 10,
      offset: params?.offset || 0,
      total: 0,
    },
  };
}

/**
 * Mock poll report status
 */
export async function pollReportStatus(
  id: string,
  onStatusChange: (report: SmartReport) => void,
  intervalMs: number = 2000,
): Promise<() => void> {
  // TODO: Connect to your API
  console.log("Poll report status:", id, intervalMs);
  // Return cleanup function
  return () => {
    console.log("Stop polling");
  };
}
