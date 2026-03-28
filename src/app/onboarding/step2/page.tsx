"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PlanName, RequestType } from "@/types/constants";

const plans = [
  {
    key: PlanName.Starter,
    name: PlanName.Starter,
    desc: "Up to 500 orders/month · 1 mode",
    price: "₹999",
    period: "/mo",
  },
  {
    key: PlanName.Growth,
    name: PlanName.Growth,
    desc: "Unlimited orders · Both modes · Analytics",
    price: "₹1,499",
    period: "/mo",
    popular: true,
  },
  {
    key: PlanName.Multi,
    name: "Multi-Branch",
    desc: "Up to 5 branches · All features",
    price: "₹3,999",
    period: "/mo",
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [selected, setSelected] = useState("GROWTH");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCatPrompt, setShowCatPrompt] = useState(false);
  const [addingCats, setAddingCats] = useState(false);

  async function handleComplete() {
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/billing/subscription", {
        method: RequestType.Post,
        body: JSON.stringify({ plan: selected }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.message || "Failed to create subscription");
        setLoading(false);
        return;
      }

      setLoading(false);
      setShowCatPrompt(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleAddDefaults() {
    setAddingCats(true);
    try {
      await apiFetch("/api/menu/categories/defaults", {
        method: RequestType.Post,
      });
    } catch {
      // proceed even if it fails
    }
    router.push(ROUTES.DASHBOARD);
  }

  function handleSkipDefaults() {
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)]">
        <div className="px-5 pt-6 sm:px-8 sm:pt-7">
          <div className="mb-6 flex gap-1.5">
            <div className="h-[3px] flex-1 rounded-sm bg-accent" />
            <div className="h-[3px] flex-1 rounded-sm bg-accent" />
            <div className="h-[3px] flex-1 rounded-sm bg-accent/50" />
          </div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.06em] text-text3">
            STEP 2 OF 3
          </div>
          <div className="mb-1 text-xl font-bold tracking-[-0.02em]">
            Choose your plan
          </div>
          <div className="text-[13px] leading-[1.6] text-text2">
            Start with a 14-day free trial. Cancel anytime.
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {error && (
            <div className="mb-4 rounded-lg border border-[#fcd34d] bg-amber-bg p-[10px] text-xs text-amber">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-[10px]">
            {plans.map((plan) => (
              <div
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`flex cursor-pointer items-center gap-[14px] rounded-[10px] border-[1.5px] p-4 transition-all ${
                  selected === plan.key
                    ? "border-accent bg-accent-bg"
                    : "border-border hover:border-accent"
                }`}
              >
                <div
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    selected === plan.key
                      ? "border-accent bg-accent"
                      : "border-border2"
                  }`}
                >
                  {selected === plan.key && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-[7px]">
                    <div className="text-sm font-bold">{plan.name}</div>
                    {plan.popular && (
                      <span className="rounded-[5px] bg-accent px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[0.08em] text-white">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-text2">{plan.desc}</div>
                </div>
                <div className="shrink-0 text-right font-serif text-base font-bold">
                  {plan.price}
                  <span className="font-sans text-[11px] font-normal text-text2">
                    {plan.period}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[14px] text-center text-[11px] leading-[1.7] text-text3">
            14-day free trial · No credit card required · Cancel anytime
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-8">
          <Link
            href={ROUTES.ONBOARDING_STEP1}
            className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2"
          >
            ← Back
          </Link>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4.5 py-2.25 text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Start free trial →"}
          </button>
        </div>
      </div>
      {/* Default Categories Prompt */}
      {showCatPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]">
          <div className="mx-4 w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)]">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="mb-1 text-base font-bold tracking-[-0.01em]">
                Add default menu categories?
              </div>
              <div className="text-[13px] leading-[1.6] text-text2">
                We can set up starter categories so you can begin adding items
                right away.
              </div>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-[7px]">
                {[
                  { emoji: "🥗", name: "Starters" },
                  { emoji: "🍛", name: "Mains" },
                  { emoji: "🍰", name: "Desserts" },
                ].map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center gap-[10px] rounded-[8px] border border-border bg-background px-[14px] py-[10px]"
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-[13px] font-semibold">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
              <button
                onClick={handleSkipDefaults}
                disabled={addingCats}
                className="rounded-lg bg-transparent px-[14px] py-[9px] text-[13px] font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleAddDefaults}
                disabled={addingCats}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
              >
                {addingCats ? "Adding..." : "Yes, add them"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
