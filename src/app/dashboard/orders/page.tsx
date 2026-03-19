"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Topbar from "@/components/dashboard/Topbar";
import OrderDrawer from "@/components/dashboard/OrderDrawer";
import { useSidebarToggle } from "../layout";
import { apiFetch } from "@/lib/api";
import type { ApiOrder, ApiOrderSummary, ApiStaff } from "@/types";

const statusMap: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "bg-new-bg text-accent", label: "NEW" },
  COOKING: { cls: "bg-amber-bg text-amber", label: "COOKING" },
  READY: { cls: "bg-green-bg text-green-mid", label: "READY" },
  BILLED: { cls: "bg-blue-bg text-blue", label: "BILLED" },
  SETTLED: { cls: "bg-surface2 text-text3", label: "SETTLED" },
};

interface Pagination {
  page: number;
  limit: number;
  totalFiltered: number;
  totalPages: number;
}

export default function OrdersPage() {
  const toggleSidebar = useSidebarToggle();
  const [orders, setOrders] = useState<ApiOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState<ApiStaff[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, totalFiltered: 0, totalPages: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchOrders = useCallback((params: { status?: string; staffId?: string; search?: string; page?: number }) => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(params.page || 1), limit: "20" });
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.staffId) sp.set("staffId", params.staffId);
    if (params.search) sp.set("search", params.search);
    apiFetch(`/api/orders?${sp}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        if (data.statusCounts) setStatusCounts(data.statusCounts);
        if (data.totalAll != null) setTotalAll(data.totalAll);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders({ page: 1 });
    apiFetch("/api/staff")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStaffList(data); })
      .catch(() => {});
  }, [fetchOrders]);

  function refetch(overrides?: { status?: string; staffId?: string; search?: string; page?: number }) {
    fetchOrders({
      status: overrides?.status ?? activeFilter,
      staffId: overrides?.staffId ?? staffFilter,
      search: overrides?.search ?? search,
      page: overrides?.page ?? 1,
    });
  }

  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  async function openOrderDetail(orderId: string) {
    setLoadingOrderId(orderId);
    try {
      const res = await apiFetch(`/api/orders/${orderId}`);
      if (res.ok) setSelectedOrder(await res.json());
    } catch {}
    setLoadingOrderId(null);
  }

  function handleFilterChange(value: string) {
    setActiveFilter(value);
    setPage(1);
    refetch({ status: value, page: 1 });
  }

  function handleStaffFilterChange(value: string) {
    setStaffFilter(value);
    setPage(1);
    refetch({ staffId: value, page: 1 });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refetch({ search: value, page: 1 });
    }, 300);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    refetch({ page: newPage });
  }

  const filterTabs = [
    { label: `All (${totalAll})`, value: "ALL" },
    { label: `New (${statusCounts.NEW || 0})`, value: "NEW" },
    { label: `Cooking (${statusCounts.COOKING || 0})`, value: "COOKING" },
    { label: `Ready (${statusCounts.READY || 0})`, value: "READY" },
    { label: `Billed (${statusCounts.BILLED || 0})`, value: "BILLED" },
    { label: `Settled (${statusCounts.SETTLED || 0})`, value: "SETTLED" },
  ];

  return (
    <>
      <Topbar title="Order History" onMenuToggle={toggleSidebar} loading={!!loadingOrderId} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        <div className="mb-[14px] flex flex-wrap items-center gap-[7px]">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`rounded-2xl border px-3 py-[5px] text-[11px] font-semibold transition-all ${
                activeFilter === tab.value
                  ? "border-text bg-text text-white"
                  : "border-border bg-surface text-text2 hover:bg-surface2"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <select
            className="ml-auto rounded-[7px] border border-border bg-surface px-[11px] py-1.5 text-xs text-text outline-none"
            value={staffFilter}
            onChange={(e) => handleStaffFilterChange(e.target.value)}
          >
            <option value="">All staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            className="w-[190px] rounded-[7px] border border-border bg-surface px-[11px] py-1.5 text-xs text-text outline-none"
            placeholder="Search order, table…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          {loading ? (
            <div className="px-[18px] py-6 text-center text-sm text-text3">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="px-[18px] py-6 text-center text-sm text-text3">
              {search || activeFilter !== "ALL" ? "No orders match your filters" : "No orders yet"}
            </div>
          ) : (
            <table className="w-full min-w-[740px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Order ID</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Table</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Items</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Total</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Assigned</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Placed At</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text3">Status</th>
                  <th className="border-b border-border bg-background px-[14px] py-[9px]"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const st = statusMap[order.status];
                  return (
                    <tr key={order.id} onClick={() => openOrderDetail(order.id)} className={`cursor-pointer transition-colors ${loadingOrderId === order.id ? "bg-accent-bg" : "hover:bg-background"}`}>
                      <td className="border-b border-border px-[14px] py-[11px] font-mono text-xs">{order.orderCode}</td>
                      <td className="border-b border-border px-[14px] py-[11px] text-[13px] font-bold">{order.table?.label || "—"}</td>
                      <td className="border-b border-border px-[14px] py-[11px] text-[13px] text-text2">
                        {order._count?.items || 0} item{(order._count?.items || 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="border-b border-border px-[14px] py-[11px] font-mono text-xs font-bold">₹{order.total}</td>
                      <td className="border-b border-border px-[14px] py-[11px] text-xs text-text2">{order.staff?.name || "—"}</td>
                      <td className="border-b border-border px-[14px] py-[11px] font-mono text-xs text-text3">
                        <div>{new Date(order.placedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div className="mt-0.5 text-[10px] opacity-60">{new Date(order.placedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                      </td>
                      <td className="border-b border-border px-[14px] py-[11px]">
                        <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${st?.cls || ""}`}>
                          {st?.label || order.status}
                        </span>
                      </td>
                      <td className="border-b border-border px-[14px] py-[11px]">
                        <button
                          onClick={(e) => { e.stopPropagation(); openOrderDetail(order.id); }}
                          disabled={loadingOrderId === order.id}
                          className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-50"
                        >
                          {loadingOrderId === order.id ? "Loading..." : "View →"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={() => {
            refetch({ page });
          }}
        />
      )}
    </>
  );
}
