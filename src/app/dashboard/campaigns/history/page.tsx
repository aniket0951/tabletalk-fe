"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import Topbar from "@/components/dashboard/Topbar";
import { useSidebarToggle } from "../../layout";
import { apiFetch } from "@/lib/api";
import { getCached, setCache, TTL } from "@/lib/cache";
import type { ApiCampaign } from "@/types";

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

export default function CampaignHistoryPage() {
  const toggleSidebar = useSidebarToggle();
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailCampaign, setDetailCampaign] = useState<ApiCampaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCampaigns = useCallback(() => {
    // Try cache first (set by main campaigns page)
    const cached = getCached<{ campaigns: ApiCampaign[] }>("campaigns_history");
    if (cached) {
      setCampaigns((cached.campaigns || []).filter((c) => c.status !== "DRAFT"));
      setLoading(false);
      return;
    }
    // Fallback to API only if no cache
    apiFetch("/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns((data.campaigns || []).filter((c: ApiCampaign) => c.status !== "DRAFT"));
        setCache("campaigns_history", data, TTL.FIVE_MIN);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

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
      <Topbar title="Campaign History" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {/* Header */}
        <div className="mb-[14px] flex items-center gap-3">
          <Link
            href={ROUTES.CAMPAIGNS}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface text-sm text-text2 transition-all hover:bg-surface2"
          >
            ←
          </Link>
          <div>
            <div className="text-sm font-semibold">Campaign History</div>
            <div className="mt-0.5 text-xs text-text3">{campaigns.length} campaigns</div>
          </div>
        </div>

        {/* Campaign List */}
        {loading ? (
          <div className="py-6 text-center text-sm text-text3">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">📊</div>
            <div className="text-sm text-text3">No campaign history yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
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
