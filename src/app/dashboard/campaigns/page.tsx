"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../layout";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { apiFetch } from "@/lib/api";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/razorpay";
import type { ApiCampaign, CampaignType, CampaignCheckoutResponse } from "@/types";

const campaignTypes: { key: CampaignType; label: string; emoji: string; desc: string }[] = [
  { key: "DISCOUNT", label: "Discount", emoji: "🏷", desc: "Offer % or flat discount" },
  { key: "NEW_DISH", label: "New Dish", emoji: "🍽", desc: "Announce a new item" },
  { key: "FESTIVAL", label: "Festival", emoji: "🎉", desc: "Festival or seasonal offer" },
  { key: "CUSTOM", label: "Custom", emoji: "📝", desc: "Any custom message" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-surface2 text-text3" },
  SCHEDULED: { label: "Scheduled", cls: "bg-blue-bg text-blue" },
  PAYING: { label: "Paying", cls: "bg-amber-bg text-amber" },
  SENDING: { label: "Sending", cls: "bg-amber-bg text-amber" },
  COMPLETED: { label: "Completed", cls: "bg-green-bg text-green-mid" },
  FAILED: { label: "Failed", cls: "bg-red-bg text-red" },
};

const typeMap: Record<string, { emoji: string; label: string }> = {
  DISCOUNT: { emoji: "🏷", label: "Discount" },
  NEW_DISH: { emoji: "🍽", label: "New Dish" },
  FESTIVAL: { emoji: "🎉", label: "Festival" },
  CUSTOM: { emoji: "📝", label: "Custom" },
};

export default function CampaignsPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();


  // Create flow state
  const [step, setStep] = useState(0); // 0=closed, 1=type, 2=content, 3=review
  const [cType, setCType] = useState<CampaignType>("CUSTOM");
  const [cTitle, setCTitle] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [draftCampaign, setDraftCampaign] = useState<ApiCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const [showGuide, setShowGuide] = useState(true);

  function openCreate() {
    setStep(1);
    setCType("CUSTOM");
    setCTitle("");
    setCMessage("");
    setDraftCampaign(null);
  }

  async function createDraft() {
    if (!cTitle.trim() || !cMessage.trim()) {
      showToast("Title and message are required");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify({ type: cType, title: cTitle.trim(), message: cMessage.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        showToast(body.message || "Failed to create campaign");
        setSaving(false);
        return;
      }
      const body = await res.json();
      const campaign = body.data;
      setDraftCampaign(campaign);
      setStep(3);
    } catch {
      showToast("Failed to create campaign");
    }
    setSaving(false);
  }

  async function handlePayAndSend() {
    if (!draftCampaign) return;
    setPaying(true);
    try {
      await loadRazorpay();

      const res = await apiFetch(`/campaigns/${draftCampaign.id}/checkout`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        showToast(body.debug_message || body.message || "Checkout failed");
        setPaying(false);
        return;
      }

      const body = await res.json();
      const checkout: CampaignCheckoutResponse = body.data;

      openRazorpayCheckout({
        razorpayKeyId: checkout.razorpayKeyId,
        razorpayOrderId: checkout.razorpayOrderId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        email: checkout.email,
        onSuccess: async (response) => {
          const verifyRes = await apiFetch(`/campaigns/${draftCampaign.id}/verify`, {
            method: "POST",
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            showToast("Campaign is being sent!");
            setStep(0);
          } else {
            showToast("Payment verification failed");
          }
          setPaying(false);
        },
        onError: () => {
          showToast("Payment failed");
          setPaying(false);
        },
        onDismiss: () => {
          setPaying(false);
        },
      });
    } catch {
      showToast("Something went wrong");
      setPaying(false);
    }
  }


  return (
    <>
      {gate}
      <Topbar title="Campaigns" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {/* Header */}
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Campaigns</div>
            <div className="mt-0.5 text-xs text-text3">Reach your customers with offers and updates</div>
          </div>
          <button
            onClick={() => checkSubscription("Create Campaign", openCreate)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2"
          >
            + New Campaign
          </button>
        </div>


        {/* How it works guide */}
        <div className="mb-5 rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <span className="text-[13px] font-semibold">How Campaigns Work</span>
            </div>
            <span className={`text-[10px] text-text3 transition-transform ${showGuide ? "rotate-180" : ""}`}>▼</span>
          </button>
          {showGuide && (
            <div className="border-t border-border px-4 py-4">
              {/* What are campaigns */}
              <div className="mb-4">
                <div className="text-xs font-bold text-text2 mb-1">What are campaigns?</div>
                <div className="text-xs text-text3 leading-relaxed">
                  Campaigns let you send promotional messages directly to your customers via WhatsApp and SMS.
                  Announce discounts, new dishes, festival offers, or any custom message to bring customers back.
                </div>
              </div>

              {/* How delivery works */}
              <div className="mb-4">
                <div className="text-xs font-bold text-text2 mb-1">How are messages delivered?</div>
                <div className="text-xs text-text3 leading-relaxed">
                  Messages are sent via <span className="font-semibold text-text2">WhatsApp first</span>.
                  If a customer isn't on WhatsApp, we automatically fall back to <span className="font-semibold text-text2">SMS</span>.
                  This ensures maximum reach.
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="text-xs font-bold text-text2 mb-2">Pricing</div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-2 bg-surface2 px-3 py-1.5 text-[10px] font-bold text-text3">
                    <span>Budget</span><span className="text-right">Customers Reached</span>
                  </div>
                  {[
                    { budget: "₹138", reach: "100" },
                    { budget: "₹500", reach: "~362" },
                    { budget: "₹1,000", reach: "~724" },
                    { budget: "₹1,380", reach: "1,000" },
                  ].map((r) => (
                    <div key={r.budget} className="grid grid-cols-2 border-t border-border px-3 py-1.5 text-xs">
                      <span className="font-semibold">{r.budget}</span>
                      <span className="text-right text-text2">{r.reach}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why run campaigns */}
              <div className="mb-4 rounded-lg bg-accent-bg/50 p-3">
                <div className="text-xs font-bold text-accent mb-1">Why run campaigns?</div>
                <div className="space-y-1.5 text-xs text-text2 leading-relaxed">
                  <div>Restaurants that send regular campaigns see <span className="font-bold text-accent">2-3x more returning customers</span> compared to those that don't.</div>
                  <div>A simple "10% off this weekend" message can bring back customers who haven't visited in weeks — turning one-time visitors into regulars.</div>
                  <div className="text-text3">Every returning customer costs ₹0 to acquire. Campaigns just remind them you exist.</div>
                </div>
              </div>

              {/* Tips */}
              <div className="mb-3">
                <div className="text-xs font-bold text-text2 mb-2">Tips for effective campaigns</div>
                <div className="space-y-2">
                  {[
                    { icon: "🏷", text: "Discount campaigns work best on weekdays when footfall is low" },
                    { icon: "🍽", text: "New dish announcements drive curiosity — add a limited-time tag" },
                    { icon: "🎉", text: "Festival offers get 2-3x more response than regular campaigns" },
                    { icon: "⏰", text: "Send campaigns between 10 AM – 12 PM or 5 PM – 7 PM for best results" },
                    { icon: "📝", text: "Keep messages short, personal, and include a clear offer" },
                  ].map((tip) => (
                    <div key={tip.icon} className="flex items-start gap-2 text-xs text-text3">
                      <span className="shrink-0">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* View History Link */}
        <Link
          href={ROUTES.CAMPAIGNS_HISTORY}
          className="mb-5 flex items-center justify-between rounded-[10px] border border-border bg-surface px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <div>
              <div className="text-[13px] font-semibold">Campaign History</div>
              <div className="text-[11px] text-text3">View all sent campaigns and stats</div>
            </div>
          </div>
          <span className="text-xs text-text3">→</span>
        </Link>
      </div>

      {/* Create Campaign Modal */}
      {step > 0 && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setStep(0)}
        >
          <div className="mx-4 flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">
                {step === 1 && "Choose Campaign Type"}
                {step === 2 && "Campaign Content"}
                {step === 3 && "Review & Pay"}
              </div>
              <button onClick={() => setStep(0)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-[18px]">
              {/* Step 1: Type */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {campaignTypes.map((t) => (
                    <div
                      key={t.key}
                      onClick={() => { setCType(t.key); setStep(2); }}
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-[1.5px] border-border p-4 text-center transition-all hover:border-accent hover:bg-accent-bg"
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="text-sm font-bold">{t.label}</div>
                      <div className="text-[11px] text-text3">{t.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Content */}
              {step === 2 && (
                <>
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-text3">
                    <span>{typeMap[cType]?.emoji}</span>
                    <span className="font-semibold">{typeMap[cType]?.label}</span>
                  </div>
                  <div className="mb-4">
                    <label className="mb-[5px] block text-xs font-semibold text-text2">Title *</label>
                    <input
                      className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                      placeholder="e.g. 20% Off This Weekend!"
                      value={cTitle}
                      onChange={(e) => setCTitle(e.target.value.slice(0, 60))}
                    />
                    <div className="mt-[3px] text-right text-[11px] text-text3">{cTitle.length}/60</div>
                  </div>
                  <div className="mb-4">
                    <label className="mb-[5px] block text-xs font-semibold text-text2">Message *</label>
                    <textarea
                      className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                      rows={4}
                      placeholder="Write your campaign message..."
                      value={cMessage}
                      onChange={(e) => setCMessage(e.target.value.slice(0, 500))}
                    />
                    <div className="mt-[3px] flex justify-between text-[11px] text-text3">
                      <span>Use {"{customerName}"}, {"{restaurantName}"} as variables</span>
                      <span>{cMessage.length}/500</span>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Review */}
              {step === 3 && draftCampaign && (
                <>
                  <div className="mb-4 rounded-[10px] border border-border bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{typeMap[draftCampaign.type]?.emoji}</span>
                      <span className="text-sm font-bold">{draftCampaign.title}</span>
                    </div>
                    <div className="text-xs text-text2 whitespace-pre-wrap">{draftCampaign.message}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text3">Audience</span>
                      <span className="font-semibold">{draftCampaign.audienceCount.toLocaleString()} customers</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text3">Cost per message</span>
                      <span className="font-semibold">₹{draftCampaign.costPerMessage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                      <span>Total Cost</span>
                      <span className="text-accent">₹{draftCampaign.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-amber-bg/50 px-3 py-2 text-[11px] text-amber">
                    WhatsApp first, SMS fallback for customers without WhatsApp
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex shrink-0 justify-between gap-2 border-t border-border px-5 py-3">
              {step === 2 && (
                <>
                  <button onClick={() => setStep(1)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2">Back</button>
                  <button onClick={createDraft} disabled={saving} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50">
                    {saving ? "Creating..." : "Review & Pay"}
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  <button onClick={() => setStep(2)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2">Back</button>
                  <button onClick={handlePayAndSend} disabled={paying} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50">
                    {paying ? "Processing..." : "Pay & Send"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
