"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function StaffLoginPage() {
  const router = useRouter();
  const [restaurantCode, setRestaurantCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const staffData = localStorage.getItem("staff");
    if (staffData) {
      try {
        const { token } = JSON.parse(staffData);
        if (token) router.replace("/staff/orders");
      } catch {}
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!restaurantCode.trim() || !pin.trim()) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/staff/auth/login", {
        method: "POST",
        body: JSON.stringify({ restaurantCode: restaurantCode.toUpperCase(), pin }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("staff", JSON.stringify(data));
        router.push("/staff/orders");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl">🍽</div>
          <div className="font-serif text-xl font-bold tracking-[-0.02em]">Staff Login</div>
          <div className="mt-1 text-sm text-text2">Enter your restaurant code and PIN</div>
        </div>

        <form onSubmit={handleLogin} className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          <div className="p-5">
            {error && (
              <div className="mb-4 rounded-lg border border-[rgba(239,68,68,.3)] bg-red-bg px-3 py-2 text-xs font-medium text-[#f87171]">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="mb-[5px] block text-xs font-semibold text-text2">Restaurant Code</label>
              <input
                className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[10px] font-mono text-sm uppercase tracking-[0.15em] outline-none placeholder:text-text3 placeholder:tracking-normal placeholder:normal-case focus:border-accent"
                placeholder="e.g. ABC123"
                value={restaurantCode}
                onChange={(e) => setRestaurantCode(e.target.value.toUpperCase().slice(0, 6))}
                autoFocus
              />
            </div>
            <div className="mb-2">
              <label className="mb-[5px] block text-xs font-semibold text-text2">Your PIN</label>
              <div className="relative">
              <input
                className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[10px] pr-10 font-mono text-sm tracking-[0.3em] outline-none placeholder:text-text3 placeholder:tracking-normal focus:border-accent"
                type={showPin ? "text" : "password"}
                maxLength={4}
                placeholder="4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-sm text-text3 transition-all hover:text-text">
                {showPin ? "🙈" : "👁"}
              </button>
              </div>
            </div>
          </div>
          <div className="border-t border-border px-5 py-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-accent px-[18px] py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-[11px] text-text3">
          Ask your restaurant owner for the code and PIN
        </div>
      </div>
    </div>
  );
}
