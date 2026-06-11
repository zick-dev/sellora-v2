/**
 * lib/utils.ts
 * ─────────────
 * Shared utility functions used across the frontend.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely.
 * Handles conditional classes and resolves conflicts.
 *
 * Usage:
 *   cn("px-4 py-2", isActive && "bg-violet-500", "text-white")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Nigerian Naira currency.
 * Example: formatNaira(8500) → "₦8,500"
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * Format a date string to a readable format.
 * Example: formatDate("2024-01-15T10:30:00Z") → "Jan 15, 2024"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a date string to relative time.
 * Example: "2 hours ago", "5 minutes ago"
 */
export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Generate initials from a full name.
 * Example: getInitials("Tunde Olatunji") → "TO"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Clean a Nigerian phone number to international format.
 * Example: cleanPhone("0803 123 4567") → "2348031234567"
 * Used for WhatsApp deep links.
 */
export function cleanPhone(phone: string): string {
  return phone
    .replace(/\s+/g, "")   // Remove spaces
    .replace(/^0/, "234"); // Replace leading 0 with country code
}

/**
 * Build a WhatsApp deep link with a pre-filled message.
 * Opens WhatsApp with the message ready to send.
 */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}