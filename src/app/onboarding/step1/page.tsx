"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, publicFetch } from "@/lib/api";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { ROUTES } from "@/lib/routes";
import type { CreateRestaurantReq } from "@/types";
import { RequestType } from "@/types/constants";

interface State {
  code: string;
  name: string;
}

export default function OnboardingStep1() {
  const router = useRouter();
  const [restName, setRestName] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"dinein" | "walkin">("dinein");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [states, setStates] = useState<State[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    publicFetch("/public/states")
      .then((r) => r.json())
      .then((body) => setStates(body.data || []))
      .catch(() => {});
  }, []);

  async function handleStateChange(code: string) {
    setSelectedState(code);
    setSelectedCity("");
    setCities([]);
    if (!code) return;
    setCitiesLoading(true);
    try {
      const res = await publicFetch(`/public/states/${code}/cities`);
      const body = await res.json();
      setCities(body.data || []);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

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
      state: selectedState,
      city: selectedCity,
      serviceMode: mode === "dinein" ? "DINE_IN" : "WALK_IN",
    };

    try {
      const res = await apiFetch("/api/restaurant", {
        method: RequestType.Post,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json();
        setError(
          res.status === 500
            ? "Something went wrong. Please try again."
            : errBody.message || "Failed to create restaurant",
        );
        setLoading(false);
        return;
      }

      const resBody = await res.json();
      if (resBody.data.token)
        localStorage.setItem(STORAGE_KEY.TOKEN, resBody.data.token);

      router.push(ROUTES.ONBOARDING_STEP2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)] disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)]">
        <div className="px-5 pt-6 sm:px-8 sm:pt-7">
          <div className="mb-6 flex gap-1.5">
            <div className="h-[3px] flex-1 rounded-sm bg-accent" />
            <div className="h-[3px] flex-1 rounded-sm bg-accent/50" />
            <div className="h-[3px] flex-1 rounded-sm bg-border" />
          </div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.06em] text-text3">
            STEP 1 OF 3
          </div>
          <div className="mb-1 text-xl font-bold tracking-[-0.02em]">
            Tell us about your restaurant
          </div>
          <div className="text-[13px] leading-[1.6] text-text2">
            This helps us set up your restaurant on FoodRasoi.
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-lg border border-[#fcd34d] bg-amber-bg p-[10px] text-xs text-amber">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">
              Restaurant Name *
            </label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="e.g. Saffron House"
              value={restName}
              onChange={(e) => setRestName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">
              Your Phone Number *
            </label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="+91 98765 43210"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="mt-1 text-[11px] text-text3">
              New orders will be sent here
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-[5px] block text-xs font-semibold text-text2">
                State
              </label>
              <select
                className={selectClass}
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-[5px] block text-xs font-semibold text-text2">
                City
              </label>
              <select
                className={selectClass}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState || citiesLoading}
              >
                <option value="">
                  {citiesLoading
                    ? "Loading..."
                    : !selectedState
                      ? "Select state first"
                      : "Select city"}
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-[5px] block text-xs font-semibold text-text2">
              Service Mode *
            </label>
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
                <div className="mt-0.5 text-[11px] text-text2">
                  Tables + QR codes
                </div>
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
                <div className="mt-0.5 text-[11px] text-text2">
                  Token system
                </div>
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
