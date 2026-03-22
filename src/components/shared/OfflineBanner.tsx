"use client";

import { useState, useEffect } from "react";
import { BROWSER_EVENT } from "@/lib/events";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );
  const [wasOffline, setWasOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
      setWasOffline(true);
    }

    function handleOnline() {
      setIsOffline(false);
      setTimeout(() => setWasOffline(false), 3000);
    }

    window.addEventListener(BROWSER_EVENT.OFFLINE, handleOffline);
    window.addEventListener(BROWSER_EVENT.ONLINE, handleOnline);

    return () => {
      window.removeEventListener(BROWSER_EVENT.OFFLINE, handleOffline);
      window.removeEventListener(BROWSER_EVENT.ONLINE, handleOnline);
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
