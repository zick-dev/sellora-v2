/**
 * Central Axios instance for the Kormmerce backend.
 * Preserves merchant sessions during temporary backend outages.
 */
import axios from "axios";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.kormmerce.com"
).replace(/\/+$/, "");
const OFFLINE_WRITE_MESSAGE =
  "This dashboard is in read-only mode. Reconnect and retry before making changes.";

let dashboardOfflineMode = false;
let dashboardIsActive = false;

export class OfflineWriteError extends Error {
  readonly response = { data: { detail: OFFLINE_WRITE_MESSAGE } };

  constructor() {
    super(OFFLINE_WRITE_MESSAGE);
    this.name = "OfflineWriteError";
  }
}

export function getApiErrorDetail(error: unknown): string | undefined {
  if (error instanceof OfflineWriteError) return error.message;
  if (!axios.isAxiosError(error)) return undefined;

  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : undefined;
}

export function setDashboardOfflineMode(isOffline: boolean) {
  dashboardOfflineMode = isOffline;
}

export function setDashboardActive(isActive: boolean) {
  dashboardIsActive = isActive;
  if (!isActive) dashboardOfflineMode = false;
}

export function isDashboardOfflineMode() {
  return dashboardOfflineMode;
}

function reportDashboardOutage() {
  if (typeof window === "undefined" || !dashboardIsActive) return;
  dashboardOfflineMode = true;
  window.dispatchEvent(new Event("kormmerce:dashboard-offline"));
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the existing access token to requests.
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? "GET";
  if (
    dashboardOfflineMode &&
    !["GET", "HEAD", "OPTIONS"].includes(method)
  ) {
    return Promise.reject(new OfflineWriteError());
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `🚀 ${config.method?.toUpperCase()} ${config.url}`,
      config.data || ""
    );
  }

  return config;
});

let isRefreshing = false;
type RefreshResult = { token: string } | { error: unknown };
let refreshSubscribers: Array<(result: RefreshResult) => void> = [];

function onRefreshFinished(result: RefreshResult) {
  refreshSubscribers.forEach((callback) => callback(result));
  refreshSubscribers = [];
}

function logout() {
  if (typeof window === "undefined") return;

  setDashboardOfflineMode(false);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/";
}

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
      console.error(
        `❌ ${error.response?.status} ${originalRequest?.url}`,
        error.response?.data
      );
    }

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      originalRequest &&
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
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((result) => {
            if ("token" in result) {
              originalRequest.headers.Authorization = `Bearer ${result.token}`;
              resolve(api(originalRequest));
            } else {
              reject(result.error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 10000 }
        );

        const newAccessToken = response.data.access_token;

        localStorage.setItem("access_token", newAccessToken);

        isRefreshing = false;
        onRefreshFinished({ token: newAccessToken });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFinished({ error: refreshError });

        const status = axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;

        if (status === 401) {
          logout();
        } else if (status === undefined || status >= 500) {
          reportDashboardOutage();
        }

        return Promise.reject(refreshError);
      }
    }

    // A request that still returns 401 after a successful refresh
    // indicates that the session is no longer accepted.
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      originalRequest?._retry
    ) {
      logout();
    }

    if (
      axios.isAxiosError(error) &&
      error.code !== "ERR_CANCELED" &&
      (!error.response || error.response.status >= 500)
    ) {
      reportDashboardOutage();
    }

    return Promise.reject(error);
  }
);

export default api;
