"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import OrderDrawer from "@/components/dashboard/OrderDrawer";
import { useSidebarToggle } from "./layout";
import { apiFetch } from "@/lib/api";
import type { ApiOrder, ApiOrderSummary, DashboardStats } from "@/types";

const statusMap: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "bg-new-bg text-accent", label: "NEW" },
  COOKING: { cls: "bg-amber-bg text-amber", label: "COOKING" },
  READY: { cls: "bg-green-bg text-green-mid", label: "READY" },
  BILLED: { cls: "bg-blue-bg text-blue", label: "BILLED" },
  SETTLED: { cls: "bg-surface2 text-text3", label: "SETTLED" },
};


export default function DashboardOverview() {
  const [orders, setOrders] = useState<ApiOrderSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const router = useRouter();
  const toggleSidebar = useSidebarToggle();

  useEffect(() => {
    Promise.all([
      apiFetch("/api/orders").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/api/dashboard/stats").then((r) => {
        if (r.status === 404) return { noRestaurant: true };
        return r.ok ? r.json() : null;
      }),
    ])
      .then(([ordersData, statsData]) => {
        if (statsData?.noRestaurant) {
          router.push("/onboarding/step1");
          return;
        }
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  async function openOrderDetail(orderId: string) {
    setDrawerLoading(true);
    try {
      const res = await apiFetch(`/api/orders/${orderId}`);
      if (res.ok) setSelectedOrder(await res.json());
    } catch {}
    setDrawerLoading(false);
  }

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  function timeAgo(placedAt: string) {
    const mins = Math.floor((now - new Date(placedAt).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <>
      <Topbar title="Dashboard" onMenuToggle={toggleSidebar} loading={drawerLoading} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total Revenue",
              value: stats ? `₹${stats.revenue.toLocaleString("en-IN")}` : "—",
            },
            {
              label: "Total Orders",
              value: stats ? String(stats.orderCount) : "—",
            },
            {
              label: "Avg Order Value",
              value: stats ? `₹${stats.avgOrderValue}` : "—",
            },
            {
              label: "Active Tables",
              value: stats
                ? `${stats.activeTables} / ${stats.totalTables}`
                : "—",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]"
            >
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
                {stat.label}
              </div>
              <div className="mb-1 text-[22px] font-bold leading-none tracking-[-0.02em]">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-[2fr_1fr]">
          {/* Live Orders */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
            <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
              <div className="text-[13px] font-semibold">Recent Orders</div>
            </div>
            {loading ? (
              <div className="px-[18px] py-6 text-center text-sm text-text3">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="px-[18px] py-6 text-center text-sm text-text3">
                No orders yet
              </div>
            ) : (
              orders.slice(0, 10).map((order) => {
                const st = statusMap[order.status];
                const isNew = order.status === "NEW";
                return (
                  <div
                    key={order.id}
                    onClick={() => openOrderDetail(order.id)}
                    className="flex cursor-pointer items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border font-mono text-[11px] font-bold ${isNew ? "border-accent-border bg-new-bg text-accent" : "border-border bg-surface2 text-text2"}`}
                    >
                      T{order.table?.tableNumber || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">
                        {order.orderCode} · {order._count?.items || 0} item{(order._count?.items || 0) !== 1 ? "s" : ""}
                      </div>
                      <div className="mt-[1px] font-mono text-[11px] text-text3">
                        {order.table?.label || "—"} · {timeAgo(order.placedAt)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[13px] font-bold">
                        ₹{order.total}
                      </div>
                      <div className="mt-[3px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${st?.cls || ""}`}
                        >
                          {st?.label || order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Weekly chart */}
            <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
                <div className="text-[13px] font-semibold">This Week</div>
                <div className="text-xs font-bold text-accent">
                  ₹{stats ? stats.weeklyRevenue.toLocaleString("en-IN") : "—"}
                </div>
              </div>
              <div className="p-4">
                <div className="flex h-10 items-end gap-[3px]">
                  {(stats?.dailyRevenue || [0, 0, 0, 0, 0, 0, 0]).map((val, i, arr) => {
                    const max = Math.max(...arr, 1);
                    const h = `${Math.max((val / max) * 100, 4)}%`;
                    const count = stats?.dailyOrderCount?.[i] || 0;
                    return (
                      <div
                        key={i}
                        className={`group relative flex-1 rounded-t-[3px] border border-border transition-colors ${i === arr.length - 1 ? "bg-accent" : "bg-surface2 hover:bg-accent"}`}
                        style={{ height: h }}
                      >
                        {count > 0 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] font-bold text-text3">
                            {count}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-[5px] flex justify-between">
                  <span className="font-mono text-[10px] text-text3">{stats?.dayLabels?.[0] || "—"}</span>
                  <span className="font-mono text-[10px] text-text3">Today</span>
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              <div className="border-b border-border px-[18px] py-[14px]">
                <div className="text-[13px] font-semibold">Top Items</div>
              </div>
              <div className="flex flex-col gap-2 px-[14px] py-[10px]">
                {stats?.topItems && stats.topItems.length > 0 ? (
                  stats.topItems.map((item, i) => {
                    const max = stats.topItems[0].count || 1;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-medium">{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12.5 overflow-hidden rounded-sm bg-border">
                            <div
                              className="h-full rounded-sm bg-accent"
                              style={{ width: `${(item.count / max) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-text2">
                            ×{item.count}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-xs text-text3">No orders today</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
