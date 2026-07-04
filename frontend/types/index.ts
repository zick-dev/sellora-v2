/**
 * types/index.ts
 * ──────────────
 * Shared TypeScript types used across the frontend.
 * Mirrors the Pydantic schemas from the backend.
 */

// ── Auth Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  auth_provider: "email" | "google";
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  referral_applied?: boolean;
}

// ── Store Types ───────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  theme: string;
  is_active: boolean;
  owner_id: string;
  created_at: string;
}

// ── Product Types ─────────────────────────────────────────────────

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  created_at: string;
}

// ── Order Types ───────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  store_id: string;
  product_id: string;
  customer_name: string;
  customer_phone: string;
  customer_note: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

// ── Abandoned Interest Types ──────────────────────────────────────

export interface AbandonedInterest {
  id: string;
  store_id: string;
  product_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  is_converted: boolean;
  follow_up_sent: boolean;
  created_at: string;
  product_name: string | null;
}