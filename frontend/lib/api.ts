/**
 * lib/api.ts
 * ──────────
 * Central Axios instance for all API calls to the Sellora backend.
 *
 * Features:
 * - Base URL from environment variable
 * - Automatically attaches JWT token to every request
 * - Logs requests and responses in development
 * - Handles 401 errors by clearing token and redirecting to login
 */

import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────────
// Runs before every request is sent
// Automatically reads the JWT from localStorage and attaches it
api.interceptors.request.use((config) => {
  // Only access localStorage on the client side (not during SSR)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Attach token to Authorization header
      // Backend reads this in get_current_user()
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Log requests in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || "");
  }

  return config;
});

// ── Response Interceptor ──────────────────────────────────────────
// Runs after every response is received
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log errors in development
      if (process.env.NODE_ENV === "development" &&
      error.response?.status !== 403 &&
      error.response?.status !== 401) {
    console.error(
      `❌ ${error.response?.status} ${error.config?.url}`,
      error.response?.data
    );
  }

    // If token is expired or invalid, clear storage and redirect to login
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;