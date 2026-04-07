/**
 * Socket Context - TEMPLATE (Socket connections removed)
 * This file contains type definitions and a mock context provider.
 * TODO: Connect to your real-time data source (WebSocket, SSE, polling, etc.)
 */
"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { CameraInfo } from "@/services/camera.service";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TrendInfo {
  direction: string;
  gti_state: string;
  gti: number;
  current_ratio: number;
  diff: number;
}

export interface CameraData {
  id: string;
  shortId: string;
  name: string;
  totalObjects: number;
  carCount: number;
  motorbikeCount: number;
  imageUrl: string;
  lastUpdated: string;
  status: {
    current: string;
    forecast: string;
  };
  trend: TrendInfo;
  forecasts: {
    "5m": number;
    "10m": number;
    "15m": number;
    "30m": number;
    "60m": number;
  };
  inputValue?: number;
  lastPredicted: string;
  calculation?: {
    predicted_volume: number;
    capacity: number;
    vc_ratio: number;
  };
  realtimeData?: {
    current_volume: number;
    detections: {
      car: number;
      motorbike: number;
    };
    capacity: number;
    vc_ratio: number;
    timestamp: number;
  };
}

export interface TrainingJobData {
  job_id: string;
  model_type: string;
  status: "pending" | "running" | "succeeded" | "failed";
  progress_pct: number;
  current_stage: string;
  start_date: string;
  end_date: string;
  total_samples: number;
  started_at: string;
  finished_at: string;
  error_message: string;
  result_metrics: { mae?: number; rmse?: number; r2?: number };
}

export interface ModelReloadData {
  model_type: string;
  status: "pending" | "reloading" | "completed" | "failed";
  triggered_at: string;
  completed_at: string;
  model_version: string;
  error_message: string;
}

// ============================================================
// CONTEXT INTERFACE
// ============================================================

export interface SocketContextValue {
  isConnected: boolean;
  cameras: CameraInfo[];
  processedCameras: CameraData[];
  lastUpdateTime: string | null;
  forecastVersion: number;
  trainingJobs: TrainingJobData[];
  modelReloads: ModelReloadData[];
}

const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  cameras: [],
  processedCameras: [],
  lastUpdateTime: null,
  forecastVersion: 0,
  trainingJobs: [],
  modelReloads: [],
});

// ============================================================
// MOCK PROVIDER
// ============================================================

export function SocketProvider({ children }: { children: ReactNode }) {
  // TODO: Connect to your real-time data source (WebSocket, SSE, etc.)
  // For now, this is a mock provider that returns empty data
  
  const value: SocketContextValue = {
    isConnected: false,
    cameras: [],
    processedCameras: [],
    lastUpdateTime: null,
    forecastVersion: 0,
    trainingJobs: [],
    modelReloads: [],
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
