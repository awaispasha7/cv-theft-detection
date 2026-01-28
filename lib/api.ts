// API utilities for calling the FastAPI backend

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface CameraStatus {
  camera_id: string;
  enabled: boolean;
  stats: {
    frames_decoded: number;
    frames_emitted: number;
    last_ts_ms: number;
  };
}

export interface Event {
  seq: number;
  ts_ms: number;
  camera_id: string;
  type: string;
  subject_id?: string;
  payload?: Record<string, unknown>;
}

export async function getCameraStatus(): Promise<CameraStatus[]> {
  const res = await fetch(`${API_BASE_URL}/cameras/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch camera status: ${res.statusText}`);
  return res.json();
}

export async function getRecentEvents(limit = 200): Promise<Event[]> {
  const res = await fetch(`${API_BASE_URL}/events/recent?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
  return res.json();
}

export function getMjpegUrl(
  cameraId: string,
  fps = 10,
  quality = 75,
  nonce?: number | string,
): string {
  // MJPEG is a streaming response, so it generally doesn't need cache-busting.
  // We keep an optional nonce for manual refresh if needed.
  const n = nonce === undefined ? "" : `&_=${encodeURIComponent(String(nonce))}`;
  return `${API_BASE_URL}/cameras/${cameraId}/mjpeg?fps=${fps}&quality=${quality}${n}`;
}

export function getEventStreamUrl(): string {
  return `${API_BASE_URL}/events/stream`;
}

