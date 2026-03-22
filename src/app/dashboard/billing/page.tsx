"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { useSidebarToggle, useSubscriptionPlan, useSubscriptionStatus, useTrialDays } from "../contexts";
import { apiFetch } from "@/lib/api";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/razorpay";
import { useToast } from "@/contexts/ToastContext";
import type { ApiInvoice, CheckoutResponse, PlanType } from "@/types";

const plans = [
  { key: "STARTER" as PlanType, name: "Starter", price: "₹999", period: "/mo", desc: "Getting started", features: ["1 mode · 500 orders/mo", "WhatsApp bot"], action: "Downgrade" },
  { key: "GROWTH" as PlanType, name: "Growth", price: "₹1,499", period: "/mo", desc: "Busy restaurants", features: ["Both modes", "Unlimited orders", "Analytics + history"], action: "Current Plan" },
  { key: "MULTI" as PlanType, name: "Multi", price: "₹3,999", period: "/mo", desc: "Chains & branches", features: ["Up to 5 branches", "All Growth features"], action: "Upgrade →" },
];

export default function BillingPage() {
  const toggleSidebar = useSidebarToggle();
  const subscriptionPlan = useSubscriptionPlan();
  const subscriptionStatus = useSubscriptionStatus();
  const trialDaysLeft = useTrialDays();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ApiInvoice | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/billing/invoices")
      .then((r) => r.json())
      .then((body) => { if (Array.isArray(body.data)) setInvoices(body.data); })
      .catch(() => {});
  }, []);

  async function handleCheckout(plan: PlanType) {
    setCheckoutLoading(plan);
    try {
      await loadRazorpay();

      const res = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const body = await res.json();
        showToast(body.message || "Checkout failed");
        setCheckoutLoading(null);
        return;
      }

      const body = await res.json();
      const checkout: CheckoutResponse = body.data;

      openRazorpayCheckout({
        razorpayKeyId: checkout.razorpayKeyId,
        razorpayOrderId: checkout.razorpayOrderId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        email: checkout.email,
        onSuccess: async (response) => {
          const verifyRes = await apiFetch("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            showToast("Payment successful! Subscription activated.");
            window.location.reload();
          } else {
            showToast("Payment verification failed. Contact support.");
          }
          setCheckoutLoading(null);
        },
        onError: () => {
          showToast("Payment failed. Please try again.");
          setCheckoutLoading(null);
        },
        onDismiss: () => {
          setCheckoutLoading(null);
        },
      });
    } catch {
      showToast("Something went wrong. Please try again.");
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setCancelLoading(true);
    try {
      const res = await apiFetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        showToast("Subscription cancelled.");
        window.location.reload();
      } else {
        const body = await res.json();
        showToast(body.message || "Failed to cancel");
      }
    } catch {
      showToast("Something went wrong.");
    }
    setCancelLoading(false);
  }

  const isActive = subscriptionStatus === "ACTIVE";
  const isTrial = subscriptionStatus === "TRIAL";
  const isExpired = subscriptionStatus === "EXPIRED";
  const isCancelled = subscriptionStatus === "CANCELLED";
  const hasActiveSub = isActive || isTrial;
  const isInactive = !hasActiveSub;
  const canRenew = isExpired || isCancelled;

  function getPlanAction(planKey: PlanType) {
    if (planKey === subscriptionPlan && hasActiveSub) return "current";
    if (canRenew && planKey === subscriptionPlan) return "renew";
    if (!subscriptionPlan || !hasActiveSub) return "subscribe";
    const order = ["STARTER", "GROWTH", "MULTI"];
    return order.indexOf(planKey) > order.indexOf(subscriptionPlan) ? "upgrade" : "downgrade";
  }

  return (
    <>
      <Topbar title="Billing & Plans" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {/* Alert */}
        {isTrial && trialDaysLeft != null ? (
          <div className={`mb-[14px] flex items-start gap-[9px] rounded-lg border px-[14px] py-[10px] text-xs ${trialDaysLeft <= 3 ? "border-[#fca5a5] bg-[rgba(239,68,68,.08)] text-[#f87171]" : "border-[#fcd34d] bg-amber-bg text-amber"}`}>
            ⚠️ <div><b>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</b> in your free trial. Add a payment method to continue after the trial ends.</div>
          </div>
        ) : isActive ? (
          <div className="mb-[14px] flex items-start gap-[9px] rounded-lg border border-green-bg px-[14px] py-[10px] text-xs text-green-mid">
            ✓ <div><b>{subscriptionPlan} Plan</b> is active. Auto-collected via Razorpay.</div>
          </div>
        ) : isExpired ? (
          <div className="mb-[14px] flex items-start gap-[9px] rounded-lg border border-[#fca5a5] bg-[rgba(239,68,68,.08)] px-[14px] py-[10px] text-xs text-[#f87171]">
            ⚠️ <div>Your subscription has <b>expired</b>. Renew your plan to continue using TableTalk.</div>
          </div>
        ) : isInactive && subscriptionStatus ? (
          <div className="mb-[14px] flex items-start gap-[9px] rounded-lg border border-[#fca5a5] bg-[rgba(239,68,68,.08)] px-[14px] py-[10px] text-xs text-[#f87171]">
            ⚠️ <div>Your subscription is <b>{subscriptionStatus.toLowerCase()}</b>. Subscribe to a plan to continue using TableTalk.</div>
          </div>
        ) : null}

        {/* Plan cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => {
            const action = getPlanAction(plan.key);
            const isCurrent = action === "current";
            return (
              <div key={plan.key} className={`relative cursor-pointer rounded-[11px] border-[1.5px] p-[18px] transition-all hover:border-accent ${isCurrent ? "border-accent bg-accent-bg" : "border-border bg-surface"}`}>
                {isCurrent && (
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
                  {isCurrent ? (
                    <button disabled className="w-full rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-xs font-semibold text-text opacity-50">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.key)}
                      disabled={checkoutLoading === plan.key}
                      className={`w-full rounded-lg px-[18px] py-[9px] text-xs font-semibold transition-all disabled:opacity-50 ${
                        action === "upgrade" || action === "subscribe" || action === "renew"
                          ? "bg-accent text-white hover:bg-accent2"
                          : "border-[1.5px] border-border2 bg-transparent text-text hover:bg-surface2"
                      }`}
                    >
                      {checkoutLoading === plan.key
                        ? "Processing..."
                        : action === "renew"
                          ? "Renew →"
                          : action === "upgrade"
                            ? "Upgrade →"
                            : action === "subscribe"
                              ? "Subscribe →"
                              : "Downgrade"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel subscription */}
        {(isActive || isTrial) && (
          <div className="mb-5 flex items-center justify-between rounded-[10px] border border-border bg-surface px-[18px] py-[14px]">
            <div>
              <div className="text-[13px] font-semibold">Cancel Subscription</div>
              <div className="mt-0.5 text-[11px] text-text3">Your access continues until the end of the current billing period.</div>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="rounded-lg border-[1.5px] border-[#fca5a5] bg-transparent px-[14px] py-[7px] text-xs font-semibold text-[#f87171] transition-all hover:bg-[rgba(239,68,68,.08)] disabled:opacity-50"
            >
              {cancelLoading ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        )}

        {/* Invoice history */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          <div className="border-b border-border px-[18px] py-[14px]">
            <div className="text-[13px] font-semibold">Invoice History</div>
          </div>
          {invoices.length === 0 ? (
            <div className="px-[18px] py-[20px] text-center text-[13px] text-text3">No invoices yet</div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="flex cursor-pointer items-center justify-between border-b border-border px-[18px] py-[11px] transition-colors last:border-b-0 hover:bg-background"
              >
                <div>
                  <div className="text-[13px] font-semibold">{inv.invoiceNumber}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text3">
                    {new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {inv.paymentMethod && ` · ${inv.paymentMethod}`}
                  </div>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${
                    inv.status === "PAID" ? "bg-green-bg text-green-mid"
                    : inv.status === "FAILED" ? "bg-[rgba(239,68,68,.08)] text-[#f87171]"
                    : "bg-amber-bg text-amber"
                  }`}>
                    {inv.status}
                  </span>
                  <span className="font-mono text-[13px] font-bold">₹{inv.amount.toLocaleString("en-IN")}</span>
                  <span className="text-[11px] text-text3">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setSelectedInvoice(null)}
        >
          <div className="mx-4 w-full max-w-[420px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">Invoice Details</div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* Status + Amount */}
              <div className="mb-5 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-[5px] px-2.5 py-[4px] font-mono text-[11px] font-bold tracking-[0.04em] ${
                  selectedInvoice.status === "PAID" ? "bg-green-bg text-green-mid"
                  : selectedInvoice.status === "FAILED" ? "bg-[rgba(239,68,68,.08)] text-[#f87171]"
                  : "bg-amber-bg text-amber"
                }`}>
                  {selectedInvoice.status}
                </span>
                <div className="font-serif text-2xl font-bold tracking-[-0.02em]">
                  ₹{selectedInvoice.amount.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Detail rows */}
              <div className="space-y-[14px]">
                <DetailRow label="Invoice Number" value={selectedInvoice.invoiceNumber} />
                <DetailRow label="Currency" value={selectedInvoice.currency} />
                <DetailRow
                  label="Invoice Date"
                  value={new Date(selectedInvoice.date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                />
                {selectedInvoice.paidAt && (
                  <DetailRow
                    label="Paid At"
                    value={new Date(selectedInvoice.paidAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "numeric", minute: "2-digit", hour12: true,
                    })}
                  />
                )}
                {selectedInvoice.paymentMethod && (
                  <DetailRow label="Payment Method" value={selectedInvoice.paymentMethod.toUpperCase()} />
                )}
                {selectedInvoice.razorpayPaymentId && (
                  <DetailRow label="Payment ID" value={selectedInvoice.razorpayPaymentId} copyable />
                )}
                {selectedInvoice.razorpayInvoiceId && (
                  <DetailRow label="Razorpay Invoice ID" value={selectedInvoice.razorpayInvoiceId} copyable />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">{label}</div>
      <div className="flex items-center gap-1.5 text-right">
        <div className="font-mono text-[13px] font-semibold">{value}</div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="rounded px-1 py-0.5 text-[10px] text-text3 transition-all hover:bg-surface2 hover:text-text"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
