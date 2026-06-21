/**
 * lib/api.ts
 * ──────────
 * Central Axios instance for all API calls to the Kormerce backend.
 *
 * Features:
 * - Base URL from environment variable
 * - Automatically attaches JWT token to every request
 * - Silently refreshes the access token using the refresh token
 *   when it expires, so merchants stay logged in during active use
 * - Logs requests and responses in development
 * - Only logs out if the refresh token itself is invalid/expired
 */
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://kormerce-v2-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || "");
  }
  return config;
});

// Track in-flight refresh so concurrent 401s don't trigger multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

// ── Response Interceptor ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      process.env.NODE_ENV === "development" &&
      error.response?.status !== 403 &&
      error.response?.status !== 401
    ) {
      console.error(`❌ ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }

    // Only attempt refresh on 401, and only once per request
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/signup")
    ) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for the in-flight refresh to finish, then retry this request
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          (process.env.NEXT_PUBLIC_API_URL || "https://kormerce-v2-production.up.railway.app") +
            "/api/auth/refresh",
          { refresh_token: refreshToken }
        );
        const newAccessToken = res.data.access_token;
        localStorage.setItem("access_token", newAccessToken);
        isRefreshing = false;
        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(null);
        logout();
        return Promise.reject(refreshError);
      }
    }

    // 401 on the refresh/login endpoint itself, or refresh already retried — log out
    if (error.response?.status === 401 && typeof window !== "undefined" && originalRequest?._retry) {
      logout();
    }

    return Promise.reject(error);
  }
);

export default api;
