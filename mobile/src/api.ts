import { Platform } from "react-native";
import Constants from "expo-constants";

// Use LAN IP so physical devices can reach the server
const DEV_HOST = "10.0.0.160";
const DEV_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : `http://${DEV_HOST}:3000`;

const API_URL = Constants.expoConfig?.extra?.apiUrl || DEV_URL;

const BASE = `${API_URL}/api`;

export const UPLOADS_BASE = Constants.expoConfig?.extra?.apiUrl
  ? `${Constants.expoConfig.extra.apiUrl}/api/files/`
  : DEV_URL;

let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: "DELETE" }),
  uploadPhoto: async (clientId: number, uri: string) => {
    const form = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    form.append("photo", { uri, name: filename, type: "image/jpeg" } as unknown as Blob);
    const res = await fetch(`${BASE}/clients/${clientId}/photo`, {
      method: "POST",
      body: form,
      headers: _token ? { Authorization: `Bearer ${_token}` } : {},
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  uploadVideo: async (exerciseId: number, uri: string) => {
    const form = new FormData();
    const filename = uri.split("/").pop() || "video.mp4";
    form.append("video", { uri, name: filename, type: "video/mp4" } as unknown as Blob);
    const res = await fetch(`${BASE}/exercises/${exerciseId}/video`, {
      method: "POST",
      body: form,
      headers: _token ? { Authorization: `Bearer ${_token}` } : {},
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  uploadProgressPhoto: async (clientId: number, uri: string, category: string, notes?: string) => {
    const form = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    form.append("photo", { uri, name: filename, type: "image/jpeg" } as unknown as Blob);
    form.append("category", category);
    if (notes) form.append("notes", notes);
    const res = await fetch(`${BASE}/clients/${clientId}/progress-photos`, {
      method: "POST",
      body: form,
      headers: _token ? { Authorization: `Bearer ${_token}` } : {},
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
};
