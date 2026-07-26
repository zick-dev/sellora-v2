/**
 * app/offline/page.tsx
 * ─────────────────────
 * Offline fallback page shown when the user is offline
 * and tries to navigate to a page that isn't cached.
 */

import Link from "next/link";

export const metadata = {
  title: "Offline — Kormerce",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 mx-auto mb-6 bg-indigo-600 rounded-full flex items-center justify-center"
          style={{ boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}
        >
          <span className="text-4xl">📡</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-slate-300 mb-4">
          It looks like you've lost your internet connection.
        </p>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-200">
            <strong>Good news:</strong> You can still access:
          </p>
          <ul className="text-sm text-slate-300 mt-2 space-y-1">
            <li>✓ Your dashboard (cached)</li>
            <li>✓ Your products (cached)</li>
            <li>✓ Your orders (cached)</li>
            <li>✓ Store settings</li>
          </ul>
        </div>

        <p className="text-slate-400 mb-6">
          Please check your internet connection and try again.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="block w-full px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Powered by Kormerce • Progressive Web App
        </p>
      </div>
    </div>
  );
}
