"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { CreateRestaurantReq } from "@/types";

export default function OnboardingStep1() {
  const router = useRouter();
  const [restName, setRestName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<"dinein" | "walkin">("dinein");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setError("");

    if (!restName || !phone) {
      setError("Restaurant name and phone are required");
      return;
    }

    setLoading(true);

    const body: CreateRestaurantReq = {
      name: restName,
      phone,
      city,
      serviceMode: mode === "dinein" ? "DINE_IN" : "WALK_IN",
    };

    try {
      const res = await apiFetch("/api/restaurant", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || data.error || "Failed to create restaurant");
        setLoading(false);
        return;
      }

      router.push("/onboarding/step2");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)]">
        <div className="px-5 pt-6 sm:px-8 sm:pt-7">
          <div className="mb-6 flex gap-1.5">
            <div className="h-[3px] flex-1 rounded-sm bg-accent" />
            <div className="h-[3px] flex-1 rounded-sm bg-accent/50" />
            <div className="h-[3px] flex-1 rounded-sm bg-border" />
          </div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.06em] text-text3">STEP 1 OF 3</div>
          <div className="mb-1 text-xl font-bold tracking-[-0.02em]">Tell us about your restaurant</div>
          <div className="text-[13px] leading-[1.6] text-text2">
            This helps us personalise the WhatsApp bot for your customers.
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-lg border border-[#fcd34d] bg-amber-bg p-[10px] text-xs text-amber">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">Restaurant Name *</label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="e.g. Saffron House"
              value={restName}
              onChange={(e) => setRestName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">Your WhatsApp Number *</label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="mt-1 text-[11px] text-text3">New orders will be sent here</div>
          </div>
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">City</label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="e.g. Pune, Maharashtra"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-[5px] block text-xs font-semibold text-text2">Service Mode *</label>
            <div className="grid grid-cols-2 gap-[10px]">
              <div
                onClick={() => setMode("dinein")}
                className={`cursor-pointer rounded-[10px] border-[1.5px] p-[14px] text-center transition-all ${
                  mode === "dinein"
                    ? "border-accent bg-accent-bg"
                    : "border-border hover:bg-surface2"
                }`}
              >
                <div className="mb-1.5 text-[22px]">🪑</div>
                <div className="text-[13px] font-bold">Dine-In</div>
                <div className="mt-0.5 text-[11px] text-text2">Tables + QR codes</div>
              </div>
              <div
                onClick={() => setMode("walkin")}
                className={`cursor-pointer rounded-[10px] border-[1.5px] p-[14px] text-center transition-all ${
                  mode === "walkin"
                    ? "border-accent bg-accent-bg"
                    : "border-border hover:bg-surface2"
                }`}
              >
                <div className="mb-1.5 text-[22px]">🎫</div>
                <div className="text-[13px] font-bold">Walk-In</div>
                <div className="mt-0.5 text-[11px] text-text2">Token system</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2"
          >
            ← Back
          </Link>
          <button
            onClick={handleNext}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Next: Choose Plan →"}
          </button>
        </div>
      </div>
    </div>
  );
}
