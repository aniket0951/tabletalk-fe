"use client";

import { useState, useCallback, ReactNode } from "react";
import { useSubscriptionPlan } from "@/app/dashboard/layout";
import { useToast } from "@/contexts/ToastContext";

const plans = [
  { key: "STARTER", name: "Starter", price: "₹999/mo", desc: "Up to 500 orders · 1 mode" },
  { key: "GROWTH", name: "Growth", price: "₹1,499/mo", desc: "Unlimited orders · Both modes" },
  { key: "MULTI", name: "Multi-Branch", price: "₹3,999/mo", desc: "Up to 5 branches · All features" },
];

interface SubscriptionGateResult {
  gate: ReactNode;
  checkSubscription: (action: string, onAllowed: () => void) => void;
}

export function useSubscriptionGate(): SubscriptionGateResult {
  const subscriptionPlan = useSubscriptionPlan();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("GROWTH");
  const [actionLabel, setActionLabel] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const checkSubscription = useCallback(
    (action: string, onAllowed: () => void) => {
      if (subscriptionPlan) {
        onAllowed();
      } else {
        setActionLabel(action);
        setPendingAction(() => onAllowed);
        setOpen(true);
      }
    },
    [subscriptionPlan]
  );

  function handleActivate() {
    showToast("🎉 Subscription activated!");
    setOpen(false);
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
      }, 400);
    }
  }

  const gate = open ? (
    <div
      className="fixed inset-0 z-500 flex items-center justify-center bg-black/50 backdrop-blur-[4px] animate-fadeO"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="mx-4 w-full max-w-[420px] overflow-hidden rounded-2xl bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-accent-bg to-new-bg px-6 py-5 text-center">
          <div className="mb-2 text-[36px]">🔒</div>
          <div className="text-base font-bold tracking-[-0.01em]">Subscription Required</div>
          <div className="mt-1 text-[13px] text-text2">
            {actionLabel ? `"${actionLabel}" requires an active plan.` : "This action requires an active plan."}
          </div>
        </div>

        {/* Plan rows */}
        <div className="flex flex-col gap-[10px] px-6 py-5">
          {plans.map((plan) => (
            <div
              key={plan.key}
              onClick={() => setSelected(plan.key)}
              className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-3 transition-all ${
                selected === plan.key
                  ? "border-accent bg-accent-bg"
                  : "border-border hover:border-accent"
              }`}
            >
              <div
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  selected === plan.key ? "border-accent bg-accent" : "border-border2"
                }`}
              >
                {selected === plan.key && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{plan.name}</div>
                <div className="text-[11px] text-text2">{plan.desc}</div>
              </div>
              <div className="shrink-0 font-serif text-sm font-bold">{plan.price}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
          <button
            onClick={handleActivate}
            className="w-full rounded-lg bg-accent px-[18px] py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-accent2"
          >
            Start Free Trial
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-lg bg-transparent px-[18px] py-[7px] text-[13px] font-semibold text-text2 transition-all hover:bg-surface2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { gate, checkSubscription };
}
