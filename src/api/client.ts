import axios from "axios";
import { getAuthToken } from "./tokenStorage";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://onipluma.alwaysdata.net/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

/**
 * Rewrites localhost / 127.0.0.1 asset URLs returned by Laravel (APP_URL)
 * to match the active API_ORIGIN so images load on Android Emulator & LAN devices.
 */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/")) {
    return `${API_ORIGIN}${url}`;
  }
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_ORIGIN);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});
