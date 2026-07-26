/**
 * components/PWAInstallPrompt.tsx
 * ────────────────────────────────
 * Shows a custom "Install" button to add Kormerce to home screen.
 * Uses the beforeinstallprompt event for Android/Web.
 * iOS shows manual instructions in a toast.
 */

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Hide prompt when app is installed
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast.success("Kormerce installed! 🎉");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("Kormerce added to your home screen! 🚀");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleIOSInstall = () => {
    toast(
      (t) => (
        <div className="space-y-2">
          <p className="font-semibold">Add Kormerce to Home Screen</p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Tap the Share button</li>
            <li>Tap "Add to Home Screen"</li>
            <li>Tap "Add"</li>
          </ol>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-xs mt-2 px-2 py-1 bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Got it
          </button>
        </div>
      ),
      {
        duration: 10000,
      }
    );
  };

  if (!showPrompt && !isIOS) return null;

  // Android/Web install prompt
  if (showPrompt && !isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-indigo-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 z-50">
        <div className="flex items-center gap-3">
          <Download size={20} />
          <div>
            <p className="font-semibold text-sm">Install Kormerce</p>
            <p className="text-xs opacity-90">Access offline & faster</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1 bg-white text-indigo-600 rounded font-semibold text-sm hover:bg-indigo-50"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 hover:bg-indigo-700 rounded transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // iOS manual install button
  if (isIOS) {
    return (
      <button
        onClick={handleIOSInstall}
        className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-indigo-600 text-white rounded-lg shadow-lg p-3 flex items-center justify-between gap-3 z-50 hover:bg-indigo-700 transition"
      >
        <div className="flex items-center gap-2">
          <Download size={18} />
          <span className="font-semibold text-sm">Add to Home Screen</span>
        </div>
        <span className="text-xs opacity-90">→</span>
      </button>
    );
  }

  return null;
}
