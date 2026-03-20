"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { publicFetch } from "@/lib/api";

export default function CartPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, subtotal } = useCart();
  const { showToast } = useToast();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  async function placeOrder() {
    if (!phone.trim()) {
      showToast("Please enter your phone number");
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const res = await publicFetch("/public/orders", {
        method: "POST",
        body: JSON.stringify({
          tableId,
          customerPhone: phone.trim(),
          customerName: name.trim(),
          specialNote: specialNote.trim(),
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.code === "TABLE_OCCUPIED") {
          setOrderError("This table is currently occupied. Please wait for the current order to be settled before placing a new one.");
        } else {
          showToast(err.error || "Failed to place order");
        }
        setPlacing(false);
        return;
      }

      const order = await res.json();
      clearCart();
      router.push(`/order/${tableId}/status/${order.id}`);
    } catch {
      showToast("Something went wrong");
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="animate-fadeIn px-4 py-12 text-center">
        <div className="mb-2 text-4xl">🛒</div>
        <div className="text-sm font-semibold">Your cart is empty</div>
        <Link
          href={`/order/${tableId}`}
          className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent2"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn px-4 py-4">
      {orderError && (
        <div className="mb-4 rounded-[10px] border border-[#fca5a5] bg-[rgba(239,68,68,.08)] p-4">
          <div className="mb-1 text-sm font-bold text-[#f87171]">Cannot place order</div>
          <div className="text-xs text-[#f87171]">{orderError}</div>
          <Link
            href={`/order/${tableId}`}
            className="mt-3 inline-block rounded-lg border border-[#fca5a5] px-4 py-2 text-xs font-semibold text-[#f87171] hover:bg-[rgba(239,68,68,.12)]"
          >
            ← Back to Menu
          </Link>
        </div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <Link href={`/order/${tableId}`} className="text-sm text-accent font-semibold">
          ← Menu
        </Link>
        <div className="text-sm font-bold">Your Cart</div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
                    item.type === "VEG"
                      ? "border-green-mid bg-green-mid"
                      : "border-red bg-red"
                  }`}
                />
                <span className="truncate text-sm font-semibold">{item.name}</span>
              </div>
              <div className="mt-0.5 text-xs text-text2">
                ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent-bg px-1">
              <button
                onClick={() => removeItem(item.menuItemId)}
                className="px-1.5 py-1 text-sm font-bold text-accent"
              >
                −
              </button>
              <span className="min-w-[16px] text-center text-sm font-bold text-accent">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  addItem({
                    menuItemId: item.menuItemId,
                    name: item.name,
                    price: item.price,
                    type: item.type,
                  })
                }
                className="px-1.5 py-1 text-sm font-bold text-accent"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Special notes */}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold text-text2">Special Instructions</label>
        <textarea
          value={specialNote}
          onChange={(e) => setSpecialNote(e.target.value)}
          placeholder="e.g. No onions, extra spicy..."
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent resize-none"
        />
      </div>

      {/* Customer info */}
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text2">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text2">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-[10px] border border-border bg-surface p-3">
        <div className="flex justify-between text-sm">
          <span className="text-text2">Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-text2">GST (5%)</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
          <span>Total</span>
          <span className="text-accent">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Place order */}
      <button
        onClick={placeOrder}
        disabled={placing}
        className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-all hover:bg-accent2 disabled:opacity-50"
      >
        {placing ? "Placing Order..." : `Place Order · ₹${total.toFixed(2)}`}
      </button>

      <div className="mt-2 text-center text-[11px] text-text3">
        Pay at the table · No online payment required
      </div>
    </div>
  );
}
