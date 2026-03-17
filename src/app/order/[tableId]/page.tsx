"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { publicFetch } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useTableInfo } from "./layout";
import type { ApiMenuCategory, ApiMenuItem } from "@/types";

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const tableInfo = useTableInfo();
  const { items: cartItems, addItem, removeItem, totalItems, subtotal } = useCart();

  const [categories, setCategories] = useState<ApiMenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState("");
  type Review = { rating: number; note: string; createdAt: string; customer: { name: string } };
  const [reviewsModal, setReviewsModal] = useState<{ itemId: string; itemName: string; reviews: Review[]; page: number; totalPages: number; starFilter: number | null } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchReviews = useCallback(async (itemId: string, itemName: string, page: number, star: number | null) => {
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (star) params.set("star", String(star));
      const res = await publicFetch(`/public/ratings/${itemId}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviewsModal((prev) => ({
          itemId,
          itemName,
          reviews: page === 1 ? data.ratings : [...(prev?.reviews || []), ...data.ratings],
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          starFilter: star,
        }));
      }
    } catch {
      // silently fail
    }
    setReviewsLoading(false);
  }, []);

  const openReviews = (itemId: string, itemName: string) => {
    setReviewsModal({ itemId, itemName, reviews: [], page: 1, totalPages: 1, starFilter: null });
    fetchReviews(itemId, itemName, 1, null);
  };

  useEffect(() => {
    if (!tableInfo?.restaurant?.id) return;
    setRestaurantId(tableInfo.restaurant.id);
    publicFetch(`/public/menu/${tableInfo.restaurant.id}`)
      .then((r) => r.json())
      .then((cats: ApiMenuCategory[]) => {
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tableInfo]);

  const getItemQty = (menuItemId: string) =>
    cartItems.find((i) => i.menuItemId === menuItemId)?.quantity || 0;

  const filteredCategories = search.trim()
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  const displayCategories = search.trim()
    ? filteredCategories
    : filteredCategories.filter((cat) => cat.id === activeCategory);

  if (loading) {
    return <div className="py-12 text-center text-sm text-text3">Loading menu...</div>;
  }

  return (
    <div className="animate-fadeIn pb-24">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
        />
      </div>

      {/* Category pills */}
      {!search.trim() && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "border-accent bg-accent-bg text-accent"
                  : "border-border bg-surface text-text2 hover:bg-surface2"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {displayCategories.map((cat) => (
        <div key={cat.id} className="px-4 pt-3">
          {search.trim() && (
            <div className="mb-2 text-xs font-semibold text-text2">
              {cat.emoji} {cat.name}
            </div>
          )}
          <div className="space-y-2">
            {cat.items.map((item: ApiMenuItem) => {
              const qty = getItemQty(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3 shadow-[0_1px_3px_rgba(0,0,0,.07)]"
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
                    {item.description && (
                      <div className="mt-0.5 truncate text-xs text-text3">{item.description}</div>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-accent">₹{item.price}</span>
                      {item.averageRating !== undefined && item.ratingCount !== undefined && item.ratingCount > 0 && (
                        <button
                          onClick={() => openReviews(item.id, item.name)}
                          className="flex items-center gap-0.5 text-xs text-text3"
                        >
                          <span className="text-amber-400">★</span>
                          <span className="font-semibold text-text2">{item.averageRating.toFixed(1)}</span>
                          <span>({item.ratingCount})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {qty === 0 ? (
                      <button
                        onClick={() =>
                          addItem({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                            type: item.type,
                          })
                        }
                        className="rounded-lg border border-accent bg-transparent px-4 py-1.5 text-xs font-bold text-accent transition-all hover:bg-accent-bg"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent-bg px-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="px-1.5 py-1 text-sm font-bold text-accent"
                        >
                          −
                        </button>
                        <span className="min-w-[16px] text-center text-sm font-bold text-accent">
                          {qty}
                        </span>
                        <button
                          onClick={() =>
                            addItem({
                              menuItemId: item.id,
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="py-12 text-center text-sm text-text3">No menu items available</div>
      )}

      {/* Reviews modal */}
      {reviewsModal && (
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 backdrop-blur-[4px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setReviewsModal(null)}
        >
          <div className="w-full max-w-lg animate-slideUp rounded-t-2xl bg-surface shadow-[0_-4px_24px_rgba(0,0,0,.12)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-bold">{reviewsModal.itemName}</div>
                <div className="text-xs text-text3">Reviews</div>
              </div>
              <button onClick={() => setReviewsModal(null)} className="text-lg text-text3">✕</button>
            </div>

            {/* Star filter pills */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2 scrollbar-none">
              <button
                onClick={() => fetchReviews(reviewsModal.itemId, reviewsModal.itemName, 1, null)}
                className={`shrink-0 rounded-2xl border px-3 py-1 text-[11px] font-semibold transition-all ${
                  reviewsModal.starFilter === null
                    ? "border-accent bg-accent-bg text-accent"
                    : "border-border bg-surface text-text2"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => fetchReviews(reviewsModal.itemId, reviewsModal.itemName, 1, star)}
                  className={`shrink-0 rounded-2xl border px-3 py-1 text-[11px] font-semibold transition-all ${
                    reviewsModal.starFilter === star
                      ? "border-accent bg-accent-bg text-accent"
                      : "border-border bg-surface text-text2"
                  }`}
                >
                  {star} ★
                </button>
              ))}
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-4 py-3">
              {reviewsLoading && reviewsModal.reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-text3">Loading reviews...</div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-text3">No reviews found</div>
              ) : (
                <div className="space-y-3">
                  {reviewsModal.reviews.map((review, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface2 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= review.rating ? "text-amber-400" : "text-text3"}`}>★</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-text3">
                          {new Date(review.createdAt).toLocaleDateString([], { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      {review.note && <div className="mt-1.5 text-xs text-text2">{review.note}</div>}
                      <div className="mt-1 text-[10px] text-text3">{review.customer.name || "Customer"}</div>
                    </div>
                  ))}

                  {/* Load more */}
                  {reviewsModal.page < reviewsModal.totalPages && (
                    <button
                      onClick={() => fetchReviews(reviewsModal.itemId, reviewsModal.itemName, reviewsModal.page + 1, reviewsModal.starFilter)}
                      disabled={reviewsLoading}
                      className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-50"
                    >
                      {reviewsLoading ? "Loading..." : "Load more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
          <div className="mx-auto max-w-lg px-4 pb-4">
            <Link
              href={`/order/${tableId}/cart`}
              className="flex items-center justify-between rounded-xl bg-accent px-4 py-3 text-white shadow-[0_4px_20px_rgba(212,82,42,.3)] transition-all hover:bg-accent2"
            >
              <div className="text-sm font-bold">
                {totalItems} item{totalItems > 1 ? "s" : ""} · ₹{subtotal.toFixed(2)}
              </div>
              <div className="text-sm font-bold">View Cart →</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
