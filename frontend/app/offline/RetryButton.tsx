/* eslint-disable */
"use client";

import { useState } from "react";

/**
 * RetryButton - Client Component that handles offline retry functionality.
 * Placed as a separate Client Component because it uses onClick handler
 * with window.location.reload() which cannot be serialized from Server Component.
 */
export function RetryButton() {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
      disabled={clicked}
    >
      {clicked ? "Reloading..." : "Retry"}
    </button>
  );
}