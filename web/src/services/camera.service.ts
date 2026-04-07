/**
 * Camera Service - Template (API connections removed)
 */

// Interface cho camera data
export interface CameraInfo {
  cam_id: string;
  location: string; // Format: '[lat, long]'
  display_name: string;
}

// Interface cho response
export interface CamerasResponse {
  success: boolean;
  data: CameraInfo[];
  message?: string;
}

/**
 * Mock get all cameras
 */
export async function getAllCameras(): Promise<CameraInfo[]> {
  // TODO: Connect to your API
  return [];
}

/**
 * Mock get camera by ID
 */
export async function getCameraById(camId: string): Promise<CameraInfo | null> {
  // TODO: Connect to your API
  console.log("Get camera:", camId);
  return null;
}

/**
 * Mock get nearby cameras
 */
export async function getNearbyCameras(
  lat: number,
  lng: number,
  radius: number = 1000,
): Promise<CameraInfo[]> {
  // TODO: Connect to your API
  console.log("Get nearby cameras:", lat, lng, radius);
  return [];
}

export default {
  getAllCameras,
  getCameraById,
  getNearbyCameras,
};
