"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { STORAGE_KEY } from "@/lib/storage-keys";

export function useBranchSwitch() {
  const [switching, setSwitching] = useState<string | null>(null);

  async function switchBranch(restaurantId: string) {
    setSwitching(restaurantId);
    try {
      const res = await apiFetch("/api/restaurant/switch", {
        method: "POST",
        body: JSON.stringify({ restaurantId }),
      });
      const body = await res.json();
      if (res.ok && body.data?.token) {
        localStorage.setItem(STORAGE_KEY.TOKEN, body.data.token);
        localStorage.removeItem("cache_restaurant");
        localStorage.removeItem("cache_subscription");
        window.location.reload();
      }
    } catch {}
    setSwitching(null);
  }

  return { switchBranch, switching };
}
