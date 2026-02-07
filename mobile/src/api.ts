import { Platform } from "react-native";

// Use LAN IP so physical devices can reach the server
const DEV_HOST = "192.168.1.68";

const BASE =
  Platform.OS === "android"
    ? `http://10.0.2.2:3000/api`
    : `http://${DEV_HOST}:3000/api`;

export const UPLOADS_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : `http://${DEV_HOST}:3000`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
};
