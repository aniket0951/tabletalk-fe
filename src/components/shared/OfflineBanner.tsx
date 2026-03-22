"use client";

import { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
      setWasOffline(true);
    }

    function handleOnline() {
      setIsOffline(false);
      // Auto-dismiss "back online" after 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    }

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setWasOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-[#ef4444] px-4 py-2 text-xs font-semibold text-white">
        <span>You are offline. Some features may not work.</span>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white animate-fadeIn">
        <span>Back online!</span>
      </div>
    );
  }

  return null;
}
