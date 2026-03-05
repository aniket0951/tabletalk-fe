"use client";

import Topbar from "@/components/dashboard/Topbar";
import { useSidebarToggle, useSubscriptionStatus, useTrialDays } from "../layout";

const plans = [
  { name: "Starter", price: "₹999", period: "/mo", desc: "Getting started", features: ["1 mode · 500 orders/mo", "WhatsApp bot"], current: false, action: "Downgrade" },
  { name: "Growth", price: "₹1,499", period: "/mo", desc: "Busy restaurants", features: ["Both modes", "Unlimited orders", "Analytics + history"], current: true, action: "Current Plan" },
  { name: "Multi", price: "₹3,999", period: "/mo", desc: "Chains & branches", features: ["Up to 5 branches", "All Growth features"], current: false, action: "Upgrade →" },
];

const invoices = [
  { title: "Growth Plan — Feb 2026", code: "INV-2026-002", amount: "₹1,499" },
  { title: "Starter Plan — Dec 2025", code: "INV-2025-012", amount: "₹999" },
];

export default function BillingPage() {
  const toggleSidebar = useSidebarToggle();
  const subscriptionStatus = useSubscriptionStatus();
  const trialDaysLeft = useTrialDays();
  return (
    <>
      <Topbar title="Billing & Plans" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {/* Alert */}
        {subscriptionStatus === "TRIAL" && trialDaysLeft != null ? (
          <div className={`mb-[14px] flex items-start gap-[9px] rounded-lg border px-[14px] py-[10px] text-xs ${trialDaysLeft <= 3 ? "border-[#fca5a5] bg-[rgba(239,68,68,.08)] text-[#f87171]" : "border-[#fcd34d] bg-amber-bg text-amber"}`}>
            ⚠️ <div><b>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</b> in your free trial. Add a payment method to continue after the trial ends.</div>
          </div>
        ) : (
          <div className="mb-[14px] flex items-start gap-[9px] rounded-lg border border-[#fcd34d] bg-amber-bg px-[14px] py-[10px] text-xs text-amber">
            ⚠️ <div>Growth Plan renews <b>March 26, 2026</b>. Auto-collected via Razorpay.</div>
          </div>
        )}

        {/* Plan cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div key={i} className={`relative cursor-pointer rounded-[11px] border-[1.5px] p-[18px] transition-all hover:border-accent ${plan.current ? "border-accent bg-accent-bg" : "border-border bg-surface"}`}>
              {plan.current && (
                <div className="absolute right-[10px] top-[10px] rounded-[5px] bg-[#fce8e0] px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[0.1em] text-accent">
                  CURRENT
                </div>
              )}
              <div className="mb-[3px] text-sm font-bold">{plan.name}</div>
              <div className="mb-[2px] font-serif text-2xl font-bold tracking-[-0.02em]">
                {plan.price}<span className="font-sans text-xs font-normal text-text2">{plan.period}</span>
              </div>
              <div className="mb-3 text-[11px] text-text3">{plan.desc}</div>
              {plan.features.map((f, j) => (
                <div key={j} className="mb-1 flex items-center gap-[5px] text-xs text-text2">
                  <span className="text-[11px] font-bold text-green-mid">✓</span> {f}
                </div>
              ))}
              <div className="mt-3">
                {plan.current ? (
                  <button disabled className="w-full rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-xs font-semibold text-text opacity-50">
                    Current Plan
                  </button>
                ) : plan.action.includes("Upgrade") ? (
                  <button className="w-full rounded-lg bg-accent px-[18px] py-[9px] text-xs font-semibold text-white hover:bg-accent2">
                    {plan.action}
                  </button>
                ) : (
                  <button className="w-full rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-xs font-semibold text-text hover:bg-surface2">
                    {plan.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invoice history */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          <div className="border-b border-border px-[18px] py-[14px]">
            <div className="text-[13px] font-semibold">Invoice History</div>
          </div>
          {invoices.map((inv, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border px-[18px] py-[11px] last:border-b-0">
              <div>
                <div className="text-[13px] font-semibold">{inv.title}</div>
                <div className="mt-0.5 font-mono text-[11px] text-text3">{inv.code}</div>
              </div>
              <div className="flex items-center gap-[10px]">
                <span className="inline-flex items-center gap-1 rounded-[5px] bg-green-bg px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] text-green-mid">PAID</span>
                <span className="font-mono text-[13px] font-bold">{inv.amount}</span>
                <button className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2">PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
