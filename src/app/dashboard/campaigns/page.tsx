"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [stats, setStats] = useState({ totalCampaigns: 0, totalReach: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  // Create flow state
  const [step, setStep] = useState(0); // 0=closed, 1=type, 2=content, 3=review
  const [cType, setCType] = useState<CampaignType>("CUSTOM");
  const [cTitle, setCTitle] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [draftCampaign, setDraftCampaign] = useState<ApiCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  // Detail view
  const [detailCampaign, setDetailCampaign] = useState<ApiCampaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteDraft(id: string) {
    setDeletingId(id);
    try {
      const res = await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Draft deleted");
        fetchCampaigns();
      } else {
        const data = await res.json();
        showToast(data.debug || data.error || "Failed to delete");
      }
    } catch {
      showToast("Failed to delete");
    }
    setDeletingId(null);
  }

  const fetchCampaigns = useCallback(() => {
    apiFetch("/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
        setStats(data.stats || { totalCampaigns: 0, totalReach: 0, totalSpent: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-expand guide when no campaigns exist
  useEffect(() => {
    if (!loading && campaigns.length === 0) setShowGuide(true);
  }, [loading, campaigns.length]);

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
        const data = await res.json();
        showToast(data.error || "Failed to create campaign");
        setSaving(false);
        return;
      }
      const campaign = await res.json();
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
        const data = await res.json();
        showToast(data.detail || data.error || "Checkout failed");
        setPaying(false);
        return;
      }

      const checkout: CampaignCheckoutResponse = await res.json();

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
            fetchCampaigns();
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

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetailCampaign(null);
    try {
      const res = await apiFetch(`/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailCampaign(data);
      }
    } catch {
      // silently fail
    }
    setDetailLoading(false);
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

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total Campaigns", value: stats.totalCampaigns },
            { label: "Total Reach", value: stats.totalReach.toLocaleString() },
            { label: "Total Spent", value: `₹${stats.totalSpent.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] border border-border bg-surface p-3 shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              <div className="text-[11px] text-text3">{s.label}</div>
              <div className="mt-1 font-serif text-lg font-bold">{s.value}</div>
            </div>
          ))}
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

        {/* Draft campaign banner */}
        {!loading && campaigns.filter((c) => c.status === "DRAFT").map((draft) => (
          <div key={draft.id} className="mb-4 flex items-center justify-between rounded-[10px] border border-amber/30 bg-amber-bg/50 px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold">{draft.title}</div>
              <div className="text-[11px] text-text3">Draft · {draft.audienceCount} customers · ₹{draft.totalCost.toFixed(0)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteDraft(draft.id)}
                disabled={deletingId === draft.id}
                className="rounded-lg border border-border bg-transparent px-3 py-[7px] text-[12px] font-semibold text-text3 transition-all hover:bg-red-bg hover:text-red disabled:opacity-50"
              >
                {deletingId === draft.id ? "..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setCType(draft.type);
                  setCTitle(draft.title);
                  setCMessage(draft.message);
                  setDraftCampaign(draft);
                  setStep(3);
                }}
                className="rounded-lg bg-accent px-3 py-[7px] text-[12px] font-semibold text-white transition-all hover:bg-accent2"
              >
                Continue & Pay
              </button>
            </div>
          </div>
        ))}

        {/* Campaign List */}
        {loading ? (
          <div className="py-6 text-center text-sm text-text3">Loading campaigns...</div>
        ) : campaigns.filter((c) => c.status !== "DRAFT").length === 0 && campaigns.filter((c) => c.status === "DRAFT").length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">📣</div>
            <div className="text-sm text-text3">No campaigns yet</div>
            <div className="mt-1 text-xs text-text3">Create your first campaign to reach customers</div>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.filter((c) => c.status !== "DRAFT").map((c) => {
              const st = statusMap[c.status] || statusMap.DRAFT;
              const tp = typeMap[c.type] || typeMap.CUSTOM;
              const deliveryRate = c.stats && c.stats.total > 0
                ? Math.round(((c.stats.delivered || 0) / c.stats.total) * 100)
                : 0;
              return (
                <div
                  key={c.id}
                  onClick={() => openDetail(c.id)}
                  className="cursor-pointer overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{tp.emoji}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold">{c.title}</div>
                        <div className="mt-0.5 text-[11px] text-text3">
                          {c.audienceCount.toLocaleString()} customers · ₹{c.totalCost.toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  {c.stats && c.stats.total > 0 && (
                    <div className="border-t border-border px-4 py-2">
                      <div className="mb-1.5 flex justify-between text-[11px] text-text3">
                        <span>Delivered {c.stats.delivered}/{c.stats.total}</span>
                        <span className="font-semibold text-text2">{deliveryRate}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full bg-green-mid transition-all" style={{ width: `${deliveryRate}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border px-4 py-2 text-[10px] text-text3">
                    {new Date(c.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Campaign Detail Modal */}
      {(detailCampaign || detailLoading) && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setDetailCampaign(null)}
        >
          <div className="mx-4 w-full max-w-[460px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            {detailLoading && !detailCampaign ? (
              <div className="px-5 py-8 text-center text-sm text-text3">Loading...</div>
            ) : detailCampaign ? (
              <>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{typeMap[detailCampaign.type]?.emoji}</span>
                      <span className="truncate text-sm font-bold">{detailCampaign.title}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-text3">
                      {new Date(detailCampaign.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <button onClick={() => setDetailCampaign(null)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red">✕</button>
                </div>

                <div className="px-5 py-4">
                  {/* Status */}
                  <div className="mb-3">
                    <span className={`rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold ${statusMap[detailCampaign.status]?.cls}`}>
                      {statusMap[detailCampaign.status]?.label}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="mb-4 rounded-lg border border-border bg-surface2 p-3 text-xs text-text2 whitespace-pre-wrap">
                    {detailCampaign.message}
                  </div>

                  {/* Delivery Stats */}
                  {detailCampaign.stats && detailCampaign.stats.total > 0 && (
                    <>
                      <div className="mb-3 text-xs font-semibold text-text2">Delivery Stats</div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { label: "Delivered", value: detailCampaign.stats.delivered, cls: "text-green-mid" },
                          { label: "Failed", value: detailCampaign.stats.failed, cls: "text-red" },
                          { label: "Pending", value: detailCampaign.stats.pending, cls: "text-amber" },
                          { label: "Total", value: detailCampaign.stats.total, cls: "text-text" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg border border-border bg-surface p-2">
                            <div className="text-[10px] text-text3">{s.label}</div>
                            <div className={`font-serif text-base font-bold ${s.cls}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery bar */}
                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-[11px] text-text3">
                          <span>Delivery rate</span>
                          <span className="font-semibold text-text2">
                            {Math.round((detailCampaign.stats.delivered / detailCampaign.stats.total) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface2">
                          <div className="h-full rounded-full bg-green-mid" style={{ width: `${(detailCampaign.stats.delivered / detailCampaign.stats.total) * 100}%` }} />
                        </div>
                      </div>

                      {/* Channel breakdown */}
                      {(detailCampaign.stats.whatsapp !== undefined || detailCampaign.stats.sms !== undefined) && (
                        <div className="flex gap-3 text-[11px]">
                          <span className="text-text3">WhatsApp: <span className="font-semibold text-text2">{detailCampaign.stats.whatsapp || 0}</span></span>
                          <span className="text-text3">SMS: <span className="font-semibold text-text2">{detailCampaign.stats.sms || 0}</span></span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cost */}
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
                    <span className="text-text3">Cost</span>
                    <span className="font-bold">₹{detailCampaign.totalCost.toFixed(0)} ({detailCampaign.audienceCount} × ₹{detailCampaign.costPerMessage})</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
