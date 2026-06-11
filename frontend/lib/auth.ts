/**
 * lib/auth.ts
 * ────────────
 * Global authentication state using Zustand.
 *
 * Handles:
 * - Email/password login and signup
 * - Google OAuth login
 * - Token storage in localStorage
 * - Session restoration on page load (init)
 * - Logout with cleanup
 *
 * Usage in any component:
 *   const { user, login, logout } = useAuthStore();
 */

import { create } from "zustand";
import api from "./api";
import { User, TokenResponse } from "@/types";

interface AuthState {
  // Current logged-in user (null if not authenticated)
  user: User | null;

  // JWT access token (null if not authenticated)
  token: string | null;

  // True after init() has run — prevents redirect before token is loaded
  isInitialized: boolean;

  // Loading state for async operations
  isLoading: boolean;

  // Initialize auth state from localStorage (call once on app mount)
  init: () => void;

  // Sign up with email and password
  signup: (name: string, email: string, password: string) => Promise<void>;

  // Log in with email and password
  login: (email: string, password: string) => Promise<void>;

  // Log in or sign up with Google ID token
  googleAuth: (token: string) => Promise<{ is_new_user: boolean; has_store: boolean }>;

  // Fetch current user profile from backend
  loadUser: () => Promise<void>;

  // Clear session and redirect to login
  logout: () => void;
}

/**
 * Helper to save tokens to localStorage and update store state.
 * Called after any successful authentication.
 */
function saveTokens(
  set: (state: Partial<AuthState>) => void,
  data: TokenResponse
) {
  // Persist tokens so user stays logged in after page refresh
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  // Update store state with user and token
  set({
    user: data.user,
    token: data.access_token,
    isLoading: false,
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Initial State ───────────────────────────────────────────────
  user: null,
  token: null,          // NOT localStorage.getItem() — causes hydration error
  isInitialized: false, // Becomes true after init() runs on client
  isLoading: false,

  // ── init ────────────────────────────────────────────────────────
  init: () => {
    /**
     * Load token from localStorage on the client side.
     * Must be called in useEffect (not during render) to avoid
     * server-side rendering hydration mismatches.
     *
     * Called in the dashboard layout's useEffect on mount.
     */
    const token = localStorage.getItem("access_token");
    set({ token, isInitialized: true });
  },

  // ── signup ──────────────────────────────────────────────────────
  signup: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post<TokenResponse>("/api/auth/signup", {
        name,
        email,
        password,
      });
      saveTokens(set, res.data);
   } catch (error) {
  set({ isLoading: false });
  throw error;
        }
  },

  // ── login ───────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post<TokenResponse>("/api/auth/login", {
        email,
        password,
      });
      saveTokens(set, res.data);
    } catch (error) {
  set({ isLoading: false });
  throw error;
        }
  },

  // ── googleAuth ──────────────────────────────────────────────────
  googleAuth: async (token) => {
    /**
     * Authenticate with a Google ID token from @react-oauth/google.
     * The token is verified server-side — we never trust it blindly.
     * Creates account if new user, logs in if existing user.
     */
    set({ isLoading: true });
  try {
    const res = await api.post('/api/auth/google', { token });
    
    // Save tokens
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    
    set({
      user: res.data.user,
      token: res.data.access_token,
      isLoading: false,
    });

    // Return flags so the calling page can redirect correctly
    return {
      is_new_user: res.data.is_new_user,
      has_store: res.data.has_store,
    };
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},

  // ── loadUser ────────────────────────────────────────────────────
  loadUser: async () => {
    /**
     * Fetch the current user's profile from the backend.
     * Called after init() confirms a token exists.
     * Updates the user state without changing the token.
     */
    try {
      const res = await api.get<User>("/api/auth/me");
      set({ user: res.data });
    } catch (error) {
  // Token is invalid or expired — clear everything
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  set({ user: null, token: null });
        }
  },

  // ── logout ──────────────────────────────────────────────────────
  logout: () => {
    /**
     * Clear all auth state and redirect to login.
     * Removes tokens from localStorage so user is fully signed out.
     */
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, token: null, isInitialized: false });

    // Hard redirect to login — clears all React state
    window.location.href = "/login";
  },
}));