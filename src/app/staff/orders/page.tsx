"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { apiFetch } from "@/lib/api";
import type { ApiOrder, OrderStatus } from "@/types";

// Lean type matching what GET /staff/orders returns
interface StaffOrder {
  id: string;
  orderCode: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  staffId: string | null;
  table: { label: string };
  items: { quantity: number; menuItem: { name: string; type: string } }[];
}

const statusMap: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "bg-new-bg text-accent", label: "NEW" },
  COOKING: { cls: "bg-amber-bg text-amber", label: "COOKING" },
  READY: { cls: "bg-green-bg text-green-mid", label: "READY" },
  BILLED: { cls: "bg-blue-bg text-blue", label: "BILLED" },
  SETTLED: { cls: "bg-surface2 text-text3", label: "SETTLED" },
};

const activeFilterTabs: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Cooking", value: "COOKING" },
  { label: "Ready", value: "READY" },
  { label: "Billed", value: "BILLED" },
  { label: "Settled", value: "SETTLED" },
];

const historyFilterTabs: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Cooking", value: "COOKING" },
  { label: "Ready", value: "READY" },
  { label: "Billed", value: "BILLED" },
  { label: "Settled", value: "SETTLED" },
];

function nextAction(status: OrderStatus): { nextStatus: string; label: string; cls: string } | null {
  switch (status) {
    case "NEW": return { nextStatus: "COOKING", label: "Start Cooking", cls: "border border-[rgba(22,101,52,.2)] bg-green-bg text-green" };
    case "COOKING": return { nextStatus: "READY", label: "Mark Ready", cls: "border border-[rgba(22,101,52,.2)] bg-green-bg text-green" };
    case "READY": return { nextStatus: "BILLED", label: "Send Bill", cls: "bg-accent text-white" };
    case "BILLED": return { nextStatus: "SETTLED", label: "Settle", cls: "border border-[rgba(22,101,52,.2)] bg-green-bg text-green" };
    default: return null;
  }
}

export default function StaffOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [historyOrders, setHistoryOrders] = useState<StaffOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [historyFetched, setHistoryFetched] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/staff/orders")
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getMyStaffId = useCallback(() => {
    try {
      const staffData = localStorage.getItem("staff");
      if (staffData) return JSON.parse(staffData).staffId;
    } catch {}
    return null;
  }, []);

  // Convert full socket order to lean StaffOrder shape
  function toStaffOrder(o: ApiOrder): StaffOrder {
    return {
      id: o.id,
      orderCode: o.orderCode,
      status: o.status,
      total: o.total,
      placedAt: o.placedAt,
      staffId: o.staffId,
      table: { label: o.table?.label || "—" },
      items: o.items?.map((i) => ({
        quantity: i.quantity,
        menuItem: { name: i.menuItem.name, type: i.menuItem.type },
      })) || [],
    };
  }

  const handleOrderUpdate = useCallback((updated: ApiOrder) => {
    const myId = getMyStaffId();
    if (!myId) return;
    const lean = toStaffOrder(updated);

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updated.id);

      if (updated.staffId === myId) {
        if (exists) return prev.map((o) => (o.id === updated.id ? lean : o));
        return [lean, ...prev];
      } else {
        if (exists) return prev.filter((o) => o.id !== updated.id);
        return prev;
      }
    });
  }, [getMyStaffId]);

  const handleOrderCreate = useCallback((created: ApiOrder) => {
    const myId = getMyStaffId();
    if (myId && created.staffId === myId) {
      setOrders((prev) => [toStaffOrder(created), ...prev]);
    }
  }, [getMyStaffId]);

  useSocketEvent("order:updated", handleOrderUpdate);
  useSocketEvent("order:created", handleOrderCreate);

  function getDateRange(filter: string): { from: string; to: string } {
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = fmt(now);

    if (filter === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    if (filter === "7days") {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      const e = new Date(now);
      e.setDate(e.getDate() - 1);
      return { from: fmt(s), to: fmt(e) };
    }
    if (filter === "30days") {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      const e = new Date(now);
      e.setDate(e.getDate() - 1);
      return { from: fmt(s), to: fmt(e) };
    }
    if (filter === "custom") {
      return { from: customFrom, to: customTo };
    }
    return { from: todayStr, to: todayStr };
  }

  function fetchHistory(filter: string) {
    setHistoryLoading(true);
    const { from, to } = getDateRange(filter);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch(`/api/staff/orders?${params}`)
      .then((r) => r.json())
      .then((data) => { setHistoryOrders(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { setHistoryLoading(false); setHistoryFetched(true); });
  }

  function handleTabChange(tab: "active" | "history") {
    setActiveTab(tab);
    if (tab === "history" && !historyFetched) {
      fetchHistory(dateFilter);
    }
  }

  function handleDateFilterChange(filter: string) {
    setDateFilter(filter);
    if (filter !== "custom") {
      fetchHistory(filter);
    }
  }

  async function handleStatusUpdate(orderId: string, nextStatus: string, label: string) {
    setUpdatingId(orderId);
    try {
      const res = await apiFetch(`/api/staff/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state immediately — don't wait for socket
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        showToast(label);
      } else {
        showToast("Failed to update order");
      }
    } catch {
      showToast("Failed to update order");
    }
    setUpdatingId(null);
  }

  // Active tab: apply activeFilter
  const activeFiltered = orders.filter((o) => {
    if (activeFilter !== "ALL" && o.status !== activeFilter) return false;
    return true;
  });

  // History tab: apply historyFilter
  const historyFiltered = historyOrders.filter((o) => {
    if (historyFilter !== "ALL" && o.status !== historyFilter) return false;
    return true;
  });

  // Stats source
  const sourceOrders = activeTab === "active" ? orders : historyOrders;
  const currentLoading = activeTab === "active" ? loading : historyLoading;
  const currentFiltered = activeTab === "active" ? activeFiltered : historyFiltered;
  const currentFilterTabs = activeTab === "active" ? activeFilterTabs : historyFilterTabs;
  const currentFilter = activeTab === "active" ? activeFilter : historyFilter;

  const settledSourceOrders = sourceOrders.filter((o) => o.status === "SETTLED");
  const totalOrders = settledSourceOrders.length;
  const totalRevenue = settledSourceOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const activeCount = sourceOrders.filter((o) => o.status === "NEW" || o.status === "COOKING" || o.status === "READY").length;
  const billedCount = sourceOrders.filter((o) => o.status === "BILLED").length;
  const settledCount = sourceOrders.filter((o) => o.status === "SETTLED").length;
  const statusBreakdown = totalOrders
    ? `${activeCount} Active / ${billedCount} Billed / ${settledCount} Settled`
    : "—";

  const statusCounts = sourceOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 animate-fadeIn">
      <div className="mb-4">
        <div className="text-sm font-semibold">My Orders</div>
        <div className="mt-0.5 text-xs text-text3">{orders.length} active orders</div>
      </div>

      {/* Tab pills */}
      <div className="mb-4 flex gap-[6px]">
        {(["active", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`shrink-0 rounded-2xl border px-3 py-[5px] text-[11px] font-semibold transition-all ${
              activeTab === tab
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-text2"
            }`}
          >
            {tab === "active" ? "Active" : "History"}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      {!currentLoading && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Total Orders</div>
            <div className="text-[22px] font-bold leading-none tracking-[-0.02em]">{totalOrders}</div>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Revenue</div>
            <div className="text-[22px] font-bold leading-none tracking-[-0.02em]">₹{totalRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Avg Order Value</div>
            <div className="text-[22px] font-bold leading-none tracking-[-0.02em]">₹{avgOrderValue.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Breakdown</div>
            <div className="text-[16px] font-bold leading-none tracking-[-0.02em]">{statusBreakdown}</div>
          </div>
        </div>
      )}

      {/* Date filter pills — History tab only */}
      {activeTab === "history" && (
        <div className="mb-4 flex flex-wrap items-center gap-[7px]">
          {[
            { label: "Today", value: "today" },
            { label: "Yesterday", value: "yesterday" },
            { label: "Last 7 Days", value: "7days" },
            { label: "Last 30 Days", value: "30days" },
            { label: "Custom", value: "custom" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleDateFilterChange(tab.value)}
              className={`shrink-0 rounded-2xl border px-3 py-[5px] text-[11px] font-semibold transition-all ${
                dateFilter === tab.value
                  ? "border-text bg-text text-white"
                  : "border-border bg-surface text-text2 hover:bg-surface2"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="rounded-[7px] border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-accent"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-xs text-text3">to</span>
              <input
                type="date"
                className="rounded-[7px] border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-accent"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
              <button
                onClick={() => { if (customFrom && customTo) fetchHistory("custom"); }}
                className="rounded-lg bg-accent px-3 py-[5px] text-[11px] font-semibold text-white hover:bg-accent2"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-[6px] overflow-x-auto pb-1">
        {currentFilterTabs.map((tab) => {
          const count = tab.value === "ALL" ? sourceOrders.length : statusCounts[tab.value] || 0;
          return (
            <button
              key={tab.value}
              onClick={() => activeTab === "active" ? setActiveFilter(tab.value) : setHistoryFilter(tab.value)}
              className={`shrink-0 rounded-2xl border px-3 py-[5px] text-[11px] font-semibold transition-all ${
                currentFilter === tab.value
                  ? "border-text bg-text text-white"
                  : "border-border bg-surface text-text2"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {currentLoading ? (
        <div className="py-10 text-center text-sm text-text3">Loading orders...</div>
      ) : currentFiltered.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mb-2 text-2xl">📋</div>
          <div className="text-sm text-text3">No orders yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {currentFiltered.map((order) => {
            const st = statusMap[order.status] || statusMap.NEW;
            const action = nextAction(order.status as OrderStatus);
            return (
              <div key={order.id} className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-[13px] font-bold">{order.orderCode}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text2">
                      <span>{order.table?.label || "—"}</span>
                      <span className="text-text3">
                        {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <div className="border-t border-border px-4 py-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-[11px] font-bold text-text3">{item.quantity}×</span>
                      <span className="flex-1 text-xs">{item.menuItem.name}</span>
                      <div className={`h-[8px] w-[8px] shrink-0 rounded-[2px] ${item.menuItem.type === "VEG" ? "bg-green-mid" : "bg-red"}`} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <div className="font-mono text-sm font-bold">₹{order.total}</div>
                  {action && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, action.nextStatus, action.label)}
                      disabled={updatingId === order.id}
                      className={`rounded-lg px-4 py-[7px] text-[12px] font-semibold transition-all disabled:opacity-50 ${action.cls}`}
                    >
                      {updatingId === order.id ? "Updating..." : action.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
