"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Topbar from "@/components/dashboard/Topbar";
import OrderDrawer from "@/components/dashboard/OrderDrawer";
import { useSidebarToggle } from "../layout";
import { apiFetch } from "@/lib/api";
import type { ApiCustomer, ApiOrder } from "@/types";

interface CustomerStats {
  totalCustomers: number;
  totalRevenue: number;
  avgSpendPerCustomer: number;
  repeatCustomers: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalFiltered: number;
  totalPages: number;
}

export default function CustomersPage() {
  const toggleSidebar = useSidebarToggle();
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalCustomers: 0, totalRevenue: 0, avgSpendPerCustomer: 0, repeatCustomers: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, totalFiltered: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchCustomers = useCallback((searchQuery: string, pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
    if (searchQuery) params.set("search", searchQuery);
    apiFetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCustomers("", 1);
  }, [fetchCustomers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(value, 1);
    }, 300);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchCustomers(search, newPage);
  }

  const statusGroups = ["NEW", "COOKING", "READY", "BILLED", "SETTLED"];
  const statusConfig: Record<string, { label: string; icon: string }> = {
    NEW: { label: "New", icon: "📱" },
    COOKING: { label: "Cooking", icon: "🍳" },
    READY: { label: "Ready", icon: "🔔" },
    BILLED: { label: "Billed", icon: "🧾" },
    SETTLED: { label: "Settled", icon: "✅" },
  };

  function openCustomerOrders(c: ApiCustomer) {
    setSelectedCustomer(c);
    setCustomerOrders([]);
    setExpandedStatus(null);
    setLoadingOrders(true);
    apiFetch(`/api/orders?customerPhone=${encodeURIComponent(c.phone)}`)
      .then((r) => r.json())
      .then((data) => {
        const orders = Array.isArray(data) ? data : [];
        setCustomerOrders(orders);
        const first = statusGroups.find((st) => orders.some((o: ApiOrder) => o.status === st));
        setExpandedStatus(first || null);
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }

  const statCards = [
    { label: "Total Customers", value: String(stats.totalCustomers) },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}` },
    { label: "Avg Spend/Customer", value: `₹${stats.avgSpendPerCustomer.toLocaleString("en-IN")}` },
    { label: "Repeat Customers", value: String(stats.repeatCustomers) },
  ];

  return (
    <>
      <Topbar title="Customers" onMenuToggle={toggleSidebar} />

      {!selectedCustomer && (
        <div className="flex-1 p-4 animate-fadeIn sm:p-6">
          {/* Stat Cards */}
          <div className="mb-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">{s.label}</div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mb-[14px]">
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Customer List */}
          {loading ? (
            <div className="py-6 text-center text-sm text-text3">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="py-6 text-center text-sm text-text3">
              {search ? "No customers match your search" : "No customers yet"}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openCustomerOrders(c)}
                    className="cursor-pointer rounded-xl border-[1.5px] border-border bg-surface p-4 transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm">👤</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold">{c.name || "Unknown"}</div>
                        <div className="truncate font-mono text-[10px] text-text3">{c.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="rounded-[5px] bg-accent-bg px-2 py-[2px] font-mono font-bold text-accent">
                        {c.visitCount} visit{c.visitCount !== 1 ? "s" : ""}
                      </span>
                      <span className="font-mono font-semibold text-text2">₹{c.totalSpent.toLocaleString("en-IN")}</span>
                      <span className="ml-auto text-text3">
                        {new Date(c.lastVisitAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-text3">
                    Showing {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.totalFiltered)} of {pagination.totalFiltered}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="rounded-lg border border-border bg-surface px-3 py-[5px] text-[11px] font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === "..." ? (
                          <span key={`dot-${i}`} className="px-1 text-xs text-text3">...</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => handlePageChange(item as number)}
                            className={`min-w-[30px] rounded-lg border px-2 py-[5px] text-[11px] font-semibold transition-all ${
                              page === item
                                ? "border-text bg-text text-white"
                                : "border-border bg-surface text-text2 hover:bg-surface2"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="rounded-lg border border-border bg-surface px-3 py-[5px] text-[11px] font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Customer Orders — inline accordion */}
      {selectedCustomer && (
        <div className="px-4 pt-6 pb-6 animate-fadeIn sm:px-6">
          <div className="mb-[14px] flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-border bg-surface2 text-[13px] text-text2 transition-all hover:bg-accent-bg hover:text-accent"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">{selectedCustomer.name || "Unknown"}</div>
              <span className="font-mono text-[10px] text-text3">{selectedCustomer.phone}</span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-text3">
              <span>{selectedCustomer.visitCount} visits</span>
              <span>₹{selectedCustomer.totalSpent.toLocaleString("en-IN")} spent</span>
            </div>
          </div>

          {loadingOrders ? (
            <div className="py-6 text-center text-sm text-text3">Loading orders...</div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              {statusGroups.map((status) => {
                const orders = customerOrders.filter((o) => o.status === status);
                const cfg = statusConfig[status];
                const isOpen = expandedStatus === status;
                return (
                  <div key={status}>
                    <div
                      onClick={() => setExpandedStatus(isOpen ? null : status)}
                      className={`flex cursor-pointer items-center justify-between border-b border-border px-[18px] py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.10em] transition-colors ${isOpen ? "bg-accent/[0.07] text-accent" : "bg-background text-text3 hover:bg-accent/[0.04] hover:text-accent/70"}`}
                    >
                      <span>{cfg.icon} {cfg.label} <span className="ml-1 text-[9px] font-semibold normal-case tracking-normal opacity-60">({orders.length})</span></span>
                      <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </div>
                    {isOpen && (orders.length === 0 ? (
                      <div className="border-b border-border px-[18px] py-4 text-center text-xs text-text3">No orders</div>
                    ) : orders.map((order) => (
                      <div key={order.id} onClick={() => setSelectedOrder(order)} className="flex cursor-pointer items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-bold">{order.orderCode}</span>
                            <span className="text-[13px] text-text2">{order.table?.label || "—"}</span>
                          </div>
                          <div className="mt-[1px] text-[11px] text-text3">
                            {order.items.map((i) => `${i.menuItem.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                          </div>
                        </div>
                        <div className="min-w-[52px] text-right font-mono text-[13px] font-semibold">₹{order.total}</div>
                        <div className="min-w-[70px] text-right font-mono text-[10px] text-text3">
                          {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          <div className="mt-0.5 opacity-60">{new Date(order.placedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                        </div>
                      </div>
                    )))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={(updated) => {
            setCustomerOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedOrder(updated);
          }}
        />
      )}
    </>
  );
}
