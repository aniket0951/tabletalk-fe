"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../contexts";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { apiFetch } from "@/lib/api";
import { GridSkeleton } from "@/components/shared/Skeleton";
import ConfirmModal from "@/components/shared/ConfirmModal";
import type { ApiOffer, OfferType, DiscountType } from "@/types";
import { RequestType } from "@/types/constants";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function offerBadge(offer: ApiOffer) {
  const pct = offer.discountType === "PERCENTAGE";
  return pct ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`;
}

function scheduleLabel(offer: ApiOffer) {
  const parts: string[] = [];
  if (offer.daysOfWeek.length > 0 && offer.daysOfWeek.length < 7) {
    parts.push(offer.daysOfWeek.map((d) => DAY_LABELS[d]).join(", "));
  }
  if (offer.startDate || offer.endDate) {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    if (offer.startDate && offer.endDate)
      parts.push(`${fmt(offer.startDate)} – ${fmt(offer.endDate)}`);
    else if (offer.startDate) parts.push(`From ${fmt(offer.startDate)}`);
    else if (offer.endDate) parts.push(`Until ${fmt(offer.endDate)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Always active";
}

export default function OffersPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiOffer | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<OfferType>("BILL_DISCOUNT");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);

  // Stats modal
  const [statsModal, setStatsModal] = useState<{
    offer: ApiOffer;
    redemptions: number;
    totalDiscountGiven: number;
  } | null>(null);
  const [statsLoadingId, setStatsLoadingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/offers")
      .then((r) => r.json())
      .then((body) => {
        setOffers(Array.isArray(body.data) ? body.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setName("");
    setType("BILL_DISCOUNT");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxDiscount("");
    setDaysOfWeek([]);
    setStartDate("");
    setEndDate("");
    setPromoCode("");
    setUsageLimit("");
    setModalOpen(true);
  }

  function openEdit(offer: ApiOffer) {
    setEditingId(offer.id);
    setName(offer.name);
    setType(offer.type);
    setDiscountType(offer.discountType);
    setDiscountValue(String(offer.discountValue));
    setMinOrderAmount(
      offer.minOrderAmount != null ? String(offer.minOrderAmount) : "",
    );
    setMaxDiscount(offer.maxDiscount != null ? String(offer.maxDiscount) : "");
    setDaysOfWeek(offer.daysOfWeek);
    setStartDate(offer.startDate ? offer.startDate.slice(0, 10) : "");
    setEndDate(offer.endDate ? offer.endDate.slice(0, 10) : "");
    setPromoCode(offer.promoCode || "");
    setUsageLimit(offer.usageLimit != null ? String(offer.usageLimit) : "");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim() || !discountValue) {
      showToast("Name and discount value are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        daysOfWeek,
        startDate: startDate || null,
        endDate: endDate || null,
        promoCode: promoCode.trim().toUpperCase() || null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
      };

      const url = editingId ? `/api/offers/${editingId}` : "/api/offers";
      const res = await apiFetch(url, {
        method: editingId ? RequestType.Patch : RequestType.Post,
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (res.ok) {
        const data = body.data;
        if (editingId) {
          setOffers((prev) => prev.map((o) => (o.id === editingId ? data : o)));
        } else {
          setOffers((prev) => [data, ...prev]);
        }
        showToast(editingId ? "Offer updated" : "Offer created");
        setModalOpen(false);
      } else {
        showToast(body.message || "Failed to save offer");
      }
    } catch {
      showToast("Failed to save offer");
    }
    setSaving(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    setTogglingId(id);

    try {
      const res = await apiFetch(`/api/offers/${id}`, {
        method: RequestType.Patch,
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, active: !currentActive } : o)),
        );
      }
    } catch {
      showToast("Failed to toggle offer");
    }
    setTogglingId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/offers/${id}`, {
        method: RequestType.Delete,
      });
      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        showToast("Offer deleted");
        setDeleteTarget(null);
      }
    } catch {
      showToast("Failed to delete offer");
    }
    setDeletingId(null);
  }

  async function openStats(offer: ApiOffer) {
    setStatsLoadingId(offer.id);
    try {
      const res = await apiFetch(`/api/offers/${offer.id}/stats`);
      const body = await res.json();
      if (res.ok) {
        setStatsModal({ offer, ...body.data });
      }
    } catch {}
    setStatsLoadingId(null);
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  const activeCount = offers.filter((o) => o.active).length;

  return (
    <>
      {gate}
      <Topbar title="Offers & Discounts" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[10px]">
          <div>
            <div className="text-sm font-semibold">Offers & Discounts</div>
            <div className="mt-0.5 text-xs text-text3">
              {offers.length} offers · {activeCount} active
            </div>
          </div>
          <button
            onClick={() => checkSubscription("Create Offer", openCreate)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-white transition-all hover:bg-accent2 sm:px-[18px] sm:py-[9px]"
          >
            + New Offer
          </button>
        </div>

        {loading ? (
          <GridSkeleton count={4} />
        ) : offers.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-2 text-2xl">🏷</div>
            <div className="text-sm text-text3">
              No offers yet. Create one to attract more customers.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`relative rounded-xl border-[1.5px] p-4 transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] ${offer.active ? "border-accent-border bg-surface" : "border-dashed border-border opacity-60"}`}
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-bold">{offer.name}</div>
                    <div className="mt-0.5 text-[11px] text-text3">
                      {offer.type === "ITEM_DISCOUNT"
                        ? "Item discount"
                        : "Bill discount"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => toggleActive(offer.id, offer.active)}
                      disabled={togglingId === offer.id}
                      className={`relative h-[18px] w-8 shrink-0 cursor-pointer rounded-[9px] border-none transition-colors ${togglingId === offer.id ? "opacity-50" : ""} ${offer.active ? "bg-green-mid" : "bg-border2"}`}
                    >
                      <div
                        className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-[left] ${offer.active ? "left-[17px]" : "left-[3px]"}`}
                      />
                    </button>
                    {togglingId === offer.id && (
                      <div className="text-[10px] text-text3">loading...</div>
                    )}{" "}
                  </div>
                </div>
                {/* Badge */}
                <div className="mb-2 inline-flex items-center gap-1 rounded-[5px] bg-accent-bg px-2 py-0.75 font-mono text-[11px] font-bold text-accent">
                  {offerBadge(offer)}
                  {offer.minOrderAmount
                    ? ` (min ₹${offer.minOrderAmount})`
                    : ""}
                </div>

                {/* Schedule */}
                <div className="mb-3 text-[11px] text-text3">
                  {scheduleLabel(offer)}
                </div>

                {/* Promo code + usage */}
                <div className="flex items-center gap-2 text-[10px]">
                  {offer.promoCode && (
                    <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono font-bold text-text2">
                      {offer.promoCode}
                    </span>
                  )}
                  <span className="text-text3">
                    {offer.usageCount} used
                    {offer.usageLimit ? ` / ${offer.usageLimit}` : ""}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-1.25">
                  <button
                    onClick={() => openStats(offer)}
                    disabled={statsLoadingId === offer.id}
                    className="relative flex-1 overflow-hidden rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-text2 hover:bg-surface2 disabled:cursor-wait disabled:opacity-70"
                  >
                    {statsLoadingId === offer.id ? "Loading…" : "Stats"}
                    {statsLoadingId === offer.id && (
                      <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-border">
                        <span className="animate-loading-bar absolute inset-y-0 left-0 w-1/3 bg-accent" />
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      checkSubscription("Edit Offer", () => openEdit(offer))
                    }
                    className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-text2 hover:bg-surface2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(offer)}
                    disabled={deletingId === offer.id}
                    className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-red hover:bg-red-bg hover:border-[rgba(153,27,27,.2)] disabled:opacity-50"
                  >
                    {deletingId === offer.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="mx-4 flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">
                {editingId ? "Edit Offer" : "Create Offer"}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-[18px]">
              {/* Name */}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Offer Name *
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Tuesday 20% Off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Type */}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Offer Type *
                </label>
                <div className="flex gap-[9px]">
                  <div
                    onClick={() => setType("BILL_DISCOUNT")}
                    className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${type === "BILL_DISCOUNT" ? "border-accent bg-accent-bg" : "border-border"}`}
                  >
                    <div className="mb-[3px] text-lg">🧾</div>
                    <div className="text-xs font-bold">Bill Discount</div>
                    <div className="mt-0.5 text-[10px] text-text3">
                      Off total bill
                    </div>
                  </div>
                  <div
                    onClick={() => setType("ITEM_DISCOUNT")}
                    className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${type === "ITEM_DISCOUNT" ? "border-accent bg-accent-bg" : "border-border"}`}
                  >
                    <div className="mb-[3px] text-lg">🍽</div>
                    <div className="text-xs font-bold">Item Discount</div>
                    <div className="mt-0.5 text-[10px] text-text3">
                      Off specific items
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Discount Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscountType("PERCENTAGE")}
                      className={`flex-1 rounded-lg border-[1.5px] py-2 text-xs font-semibold transition-all ${discountType === "PERCENTAGE" ? "border-accent bg-accent-bg text-accent" : "border-border"}`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setDiscountType("FLAT")}
                      className={`flex-1 rounded-lg border-[1.5px] py-2 text-xs font-semibold transition-all ${discountType === "FLAT" ? "border-accent bg-accent-bg text-accent" : "border-border"}`}
                    >
                      ₹ Flat
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Value *
                  </label>
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                    type="number"
                    placeholder={
                      discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 100"
                    }
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="mb-4 flex gap-3">
                {type === "BILL_DISCOUNT" && (
                  <div className="flex-1">
                    <label className="mb-[5px] block text-xs font-semibold text-text2">
                      Min Order (₹)
                    </label>
                    <input
                      className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                      type="number"
                      placeholder="e.g. 500"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                    />
                  </div>
                )}
                {discountType === "PERCENTAGE" && (
                  <div className="flex-1">
                    <label className="mb-[5px] block text-xs font-semibold text-text2">
                      Max Discount (₹)
                    </label>
                    <input
                      className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                      type="number"
                      placeholder="e.g. 200"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Schedule - Days */}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Active Days{" "}
                  <span className="font-normal text-text3">
                    (empty = every day)
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[11px] font-semibold transition-all ${daysOfWeek.includes(i) ? "border-accent bg-accent-bg text-accent" : "border-border text-text2 hover:bg-surface2"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule - Date range */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Start Date
                  </label>
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none focus:border-accent"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    End Date
                  </label>
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none focus:border-accent"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Promo Code{" "}
                    <span className="font-normal text-text3">
                      (empty = auto-apply)
                    </span>
                  </label>
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] font-mono text-sm uppercase outline-none placeholder:text-text3 placeholder:normal-case focus:border-accent"
                    placeholder="e.g. FLAT20"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Usage Limit{" "}
                    <span className="font-normal text-text3">
                      (empty = unlimited)
                    </span>
                  </label>
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                    type="number"
                    placeholder="e.g. 100"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Offer"
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deletingId === deleteTarget.id}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {statsModal && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setStatsModal(null)}
        >
          <div className="mx-4 w-full max-w-[360px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">{statsModal.offer.name}</div>
              <button
                onClick={() => setStatsModal(null)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="rounded-[10px] border border-border bg-surface2 p-3">
                  <div className="text-[10px] text-text3">Redemptions</div>
                  <div className="font-serif text-xl font-bold">
                    {statsModal.redemptions}
                  </div>
                </div>
                <div className="rounded-[10px] border border-border bg-surface2 p-3">
                  <div className="text-[10px] text-text3">
                    Total Discount Given
                  </div>
                  <div className="font-serif text-xl font-bold">
                    ₹{statsModal.totalDiscountGiven.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="text-xs text-text3">
                {offerBadge(statsModal.offer)} ·{" "}
                {scheduleLabel(statsModal.offer)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
