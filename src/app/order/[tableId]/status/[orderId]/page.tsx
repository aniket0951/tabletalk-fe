"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import Link from "next/link";
import { publicFetch } from "@/lib/api";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import type { ApiOrder, OrderStatus } from "@/types";

const statusSteps: { key: OrderStatus; label: string }[] = [
  { key: "NEW", label: "Placed" },
  { key: "COOKING", label: "Cooking" },
  { key: "READY", label: "Ready" },
  { key: "BILLED", label: "Billed" },
  { key: "SETTLED", label: "Settled" },
];

const statusColors: Record<OrderStatus, string> = {
  NEW: "bg-new-bg text-accent",
  COOKING: "bg-amber-bg text-amber",
  READY: "bg-green-bg text-green-mid",
  BILLED: "bg-blue-bg text-blue",
  SETTLED: "bg-surface2 text-text3",
};

function getStepTimestamp(order: ApiOrder, step: OrderStatus): string | null {
  const map: Record<OrderStatus, string | null> = {
    NEW: order.placedAt,
    COOKING: order.cookingAt,
    READY: order.readyAt,
    BILLED: order.billedAt,
    SETTLED: order.settledAt,
  };
  return map[step];
}

async function downloadReceipt(order: ApiOrder & { restaurant?: { name: string; phone?: string } }) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: [80, 200] }); // receipt-width PDF
  const w = 80;
  const margin = 6;
  const contentW = w - margin * 2;
  let y = 10;

  const restaurantName = order.restaurant?.name || "Restaurant";
  const restaurantPhone = order.restaurant?.phone || "";
  const date = new Date(order.placedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = new Date(order.placedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(restaurantName, w / 2, y, { align: "center" });
  y += 5;
  if (restaurantPhone) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(restaurantPhone, w / 2, y, { align: "center" });
    y += 4;
  }

  // Divider
  doc.setLineWidth(0.4);
  doc.line(margin, y, w - margin, y);
  y += 5;

  // Order meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const meta = [
    `Order: ${order.orderCode}`,
    `Table: ${order.table.label}`,
    `Date: ${date}  ${time}`,
  ];
  if (order.customerName) meta.push(`Name: ${order.customerName}`);
  if (order.customerPhone) meta.push(`Phone: ${order.customerPhone}`);
  for (const line of meta) {
    doc.text(line, margin, y);
    y += 4;
  }

  // Dashed divider
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, w - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  // Table header
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ITEM", margin, y);
  doc.text("QTY", margin + contentW * 0.65, y, { align: "center" });
  doc.text("AMT", w - margin, y, { align: "right" });
  y += 2;
  doc.setLineWidth(0.3);
  doc.line(margin, y, w - margin, y);
  y += 4;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const item of order.items) {
    const name = item.menuItem.name.length > 22
      ? item.menuItem.name.slice(0, 22) + "..."
      : item.menuItem.name;
    const amt = (item.unitPrice * item.quantity).toFixed(2);
    doc.text(name, margin, y);
    doc.text(String(item.quantity), margin + contentW * 0.65, y, { align: "center" });
    doc.text(amt, w - margin, y, { align: "right" });
    y += 4.5;
  }

  // Totals divider
  y += 1;
  doc.setLineWidth(0.4);
  doc.line(margin, y, w - margin, y);
  y += 5;

  // Totals
  doc.setFontSize(8);
  doc.text("Subtotal", margin, y);
  doc.text(order.subtotal.toFixed(2), w - margin, y, { align: "right" });
  y += 4;
  doc.text("GST (5%)", margin, y);
  doc.text(order.tax.toFixed(2), w - margin, y, { align: "right" });
  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, w - margin, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total", margin, y);
  doc.text(`Rs. ${order.total.toFixed(2)}`, w - margin, y, { align: "right" });
  y += 7;

  // Footer
  doc.setLineWidth(0.4);
  doc.line(margin, y, w - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for dining with us!", w / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(7);
  doc.text("Pay at table", w / 2, y, { align: "center" });

  // Trim page height to content
  const pageHeight = y + 8;
  (doc.internal.pages[1] as unknown as string[])[1] =
    (doc.internal.pages[1] as unknown as string[])[1]?.replace(
      /MediaBox \[0 0 [^\]]+\]/,
      `MediaBox [0 0 ${(w * 72) / 25.4} ${(pageHeight * 72) / 25.4}]`
    );

  doc.save(`receipt-${order.orderCode}.pdf`);
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ tableId: string; orderId: string }>;
}) {
  const { tableId, orderId } = use(params);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Check if already rated this order
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(`rated_${orderId}`)) {
      setRatingSubmitted(true);
    }
  }, [orderId]);

  // Deduplicate order items by menuItemId for rating
  const uniqueItems = useMemo(() => {
    if (!order) return [];
    const seen = new Set<string>();
    return order.items.filter((item) => {
      if (seen.has(item.menuItemId)) return false;
      seen.add(item.menuItemId);
      return true;
    });
  }, [order]);

  const handleSubmitRatings = async () => {
    if (!order || Object.keys(ratings).length === 0) return;
    setSubmittingRating(true);
    try {
      const res = await publicFetch("/public/ratings", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          ratings: Object.entries(ratings).map(([menuItemId, rating]) => ({
            menuItemId,
            rating,
            note: notes[menuItemId] || "",
          })),
        }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
        localStorage.setItem(`rated_${orderId}`, "true");
      }
    } catch {
      // silently fail
    }
    setSubmittingRating(false);
  };

  useEffect(() => {
    publicFetch(`/public/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  const handleOrderUpdated = useCallback(
    (data: ApiOrder) => {
      if (data.id === orderId) setOrder(data);
    },
    [orderId]
  );

  useSocketEvent("order:updated", handleOrderUpdated);

  if (loading) {
    return <div className="py-12 text-center text-sm text-text3">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mb-2 text-4xl">😕</div>
        <div className="text-sm font-semibold">Order not found</div>
      </div>
    );
  }

  const currentStepIdx = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="animate-fadeIn px-4 py-4">
      {/* Order header */}
      <div className="mb-4 text-center">
        <div className="font-mono text-xs text-text3">Order</div>
        <div className="font-serif text-2xl font-black">{order.orderCode}</div>
        <span
          className={`mt-1 inline-block rounded-[5px] px-2 py-0.5 font-mono text-[10px] font-bold ${statusColors[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      {/* Timeline stepper */}
      <div className="mb-6 rounded-[10px] border border-border bg-surface p-4">
        <div className="space-y-0">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const ts = getStepTimestamp(order, step.key);
            const isLast = idx === statusSteps.length - 1;

            return (
              <div key={step.key} className="flex gap-3">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                      isCurrent
                        ? "border-accent bg-accent"
                        : isCompleted
                        ? "border-green-mid bg-green-mid"
                        : "border-border2 bg-surface"
                    } ${isCurrent ? "animate-blink" : ""}`}
                  />
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[24px] ${
                        isCompleted && idx < currentStepIdx ? "bg-green-mid" : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* Label + time */}
                <div className={`pb-3 ${isLast ? "pb-0" : ""}`}>
                  <div
                    className={`text-sm font-semibold ${
                      isCompleted ? "text-text" : "text-text3"
                    }`}
                  >
                    {step.label}
                  </div>
                  {ts && (
                    <div className="text-[11px] text-text3">
                      {new Date(ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items summary */}
      <div className="mb-4 rounded-[10px] border border-border bg-surface p-3">
        <div className="mb-2 text-xs font-semibold text-text2">Items</div>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.menuItem.name} × {item.quantity}
            </span>
            <span className="text-text2">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
          <span>Total</span>
          <span className="text-accent">₹{order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Rate your food — visible once billed/settled */}
      {(order.status === "BILLED" || order.status === "SETTLED") && (
        <div className="mb-4 rounded-[10px] border border-border bg-surface p-3">
          {ratingSubmitted ? (
            <div className="py-2 text-center text-sm text-text2">Thanks for your ratings!</div>
          ) : (
            <>
              <div className="mb-3 text-xs font-semibold text-text2">Rate your food</div>
              <div className="space-y-3">
                {uniqueItems.map((item) => (
                  <div key={item.menuItemId}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.menuItem.name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatings((prev) => ({ ...prev, [item.menuItemId]: star }))}
                            className={`text-lg ${
                              (ratings[item.menuItemId] || 0) >= star ? "text-amber-400" : "text-text3"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    {ratings[item.menuItemId] && (
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={notes[item.menuItemId] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [item.menuItemId]: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none placeholder:text-text3 focus:border-accent"
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitRatings}
                disabled={submittingRating || Object.keys(ratings).length === 0}
                className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-white transition-all hover:bg-accent2 disabled:opacity-50"
              >
                {submittingRating ? "Submitting..." : "Submit Ratings"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Download receipt — visible once billed/settled */}
      {(order.status === "BILLED" || order.status === "SETTLED") && (
        <button
          onClick={async () => {
            setDownloading(true);
            await downloadReceipt(order as ApiOrder & { restaurant?: { name: string; phone?: string } });
            setDownloading(false);
          }}
          disabled={downloading}
          className="mb-2 w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-all hover:bg-accent2 disabled:opacity-50"
        >
          {downloading ? "Generating..." : "Download Receipt"}
        </button>
      )}

      {/* Order again */}
      <Link
        href={`/order/${tableId}`}
        className="block w-full rounded-xl border border-accent bg-transparent py-3 text-center text-sm font-bold text-accent transition-all hover:bg-accent-bg"
      >
        Order Again
      </Link>
    </div>
  );
}
