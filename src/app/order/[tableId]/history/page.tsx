"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { publicFetch } from "@/lib/api";
import type { ApiOrder } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-new-bg text-accent",
  COOKING: "bg-amber-bg text-amber",
  READY: "bg-green-bg text-green-mid",
  BILLED: "bg-blue-bg text-blue",
  SETTLED: "bg-surface2 text-text3",
};

const PAGE_SIZE = 15;

export default function OrderHistoryPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get("phone") ?? "";

  const [phone, setPhone] = useState(phoneFromUrl);
  const [submittedPhone, setSubmittedPhone] = useState(phoneFromUrl);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchHistory(ph: string, pg: number, append = false) {
    if (!ph.trim()) return;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await publicFetch(
        `/public/orders/history/${encodeURIComponent(ph.trim())}?page=${pg}&limit=${PAGE_SIZE}`,
      );
      const body = await res.json();
      const data = body.data;
      const newOrders: ApiOrder[] = data?.orders ?? [];
      setTotal(data?.pagination?.total ?? 0);
      setOrders((prev) => (append ? [...prev, ...newOrders] : newOrders));
      setPage(pg);
      setFetched(true);
    } catch {
      if (!append) setOrders([]);
      setFetched(true);
    }

    if (append) setLoadingMore(false);
    else setLoading(false);
  }

  // Auto-fetch if phone came from URL
  useEffect(() => {
    if (phoneFromUrl) {
      fetchHistory(phoneFromUrl, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    if (!phone.trim()) return;
    setSubmittedPhone(phone.trim());
    setOrders([]);
    setPage(1);
    setFetched(false);
    fetchHistory(phone.trim(), 1);
  }

  function handleLoadMore() {
    fetchHistory(submittedPhone, page + 1, true);
  }

  const hasMore = orders.length < total;

  return (
    <div className="animate-fadeIn pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/order/${tableId}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface2 text-sm text-text2"
          >
            ←
          </Link>
          <div>
            <div className="text-sm font-bold">Order History</div>
            {fetched && submittedPhone && (
              <div className="font-mono text-[10px] text-text3">
                {submittedPhone} · {total} order{total !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phone input */}
      <div className="px-4 pt-4">
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !phone.trim()}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent2 disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-border" />
                  <div className="h-2.5 w-36 animate-pulse rounded bg-border" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-[5px] bg-border" />
              </div>
            ))}
          </div>
        ) : fetched && orders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-1 text-2xl">🧾</div>
            <div className="text-sm font-semibold text-text2">No orders found</div>
            <div className="mt-1 text-xs text-text3">
              No order history for this number
            </div>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text3">
              Showing {orders.length} of {total} orders
            </div>
            <div className="space-y-2">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/order/${tableId}/status/${o.id}`}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-4 transition-all hover:border-accent hover:bg-accent-bg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {o.orderCode}
                      </span>
                      {o.table?.label && (
                        <span className="text-xs text-text3">{o.table.label}</span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-text3">
                      {new Date(o.placedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {o.items?.length ?? 0} item
                      {(o.items?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono text-sm font-bold">
                      ₹{o.total}
                    </span>
                    <span
                      className={`rounded-[5px] px-2 py-[2px] font-mono text-[9px] font-bold uppercase ${STATUS_STYLE[o.status] ?? "bg-surface2 text-text3"}`}
                    >
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mt-4 w-full rounded-lg border border-border bg-surface py-3 text-sm font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : `Load more (${total - orders.length} remaining)`}
              </button>
            )}

            {!hasMore && orders.length > 0 && (
              <div className="mt-4 py-3 text-center text-xs text-text3">
                All {total} orders loaded
              </div>
            )}
          </>
        ) : !fetched ? (
          <div className="py-12 text-center text-sm text-text3">
            Enter your phone number to view order history
          </div>
        ) : null}
      </div>
    </div>
  );
}
