"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { publicFetch } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useTableInfo } from "./layout";
import type { ApiMenuItem, ApiOrder } from "@/types";

interface CategorySummary {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  _count: { items: number };
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const tableInfo = useTableInfo();
  const {
    items: cartItems,
    addItem,
    removeItem,
    totalItems,
    subtotal,
  } = useCart();

  const searchParams = useSearchParams();
  const addToOrderId = searchParams.get("addTo");
  const [activeOrder, setActiveOrder] = useState<ApiOrder | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const [phoneLookup, setPhoneLookup] = useState("");
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [phoneLookupResult, setPhoneLookupResult] = useState<ApiOrder[] | null>(
    null,
  );

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<
    Record<string, ApiMenuItem[]>
  >({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState("");

  type Review = {
    rating: number;
    note: string;
    createdAt: string;
    customer: { name: string };
  };
  const [reviewsModal, setReviewsModal] = useState<{
    itemId: string;
    itemName: string;
    reviews: Review[];
    page: number;
    totalPages: number;
    starFilter: number | null;
  } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchReviews = useCallback(
    async (
      itemId: string,
      itemName: string,
      page: number,
      star: number | null,
    ) => {
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
            reviews:
              page === 1
                ? data.ratings
                : [...(prev?.reviews || []), ...data.ratings],
            page: data.pagination.page,
            totalPages: data.pagination.totalPages,
            starFilter: star,
          }));
        }
      } catch {
        // silently fail
      }
      setReviewsLoading(false);
    },
    [],
  );

  const openReviews = (itemId: string, itemName: string) => {
    setReviewsModal({
      itemId,
      itemName,
      reviews: [],
      page: 1,
      totalPages: 1,
      starFilter: null,
    });
    fetchReviews(itemId, itemName, 1, null);
  };

  // Check for active order on this table first
  useEffect(() => {
    publicFetch(`/public/orders/active/${tableId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.active && data.order) {
          setActiveOrder(data.order);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingOrder(false));
  }, [tableId]);

  // Fetch categories only (lightweight)
  useEffect(() => {
    if (!tableInfo?.restaurant?.id) return;
    const rid = tableInfo.restaurant.id;
    setRestaurantId(rid);
    publicFetch(`/public/menu/${rid}`)
      .then((r) => r.json())
      .then((cats: CategorySummary[]) => {
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
          fetchCategoryItems(rid, cats[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tableInfo]);

  // Fetch items for a single category (cached in state)
  function fetchCategoryItems(rid: string, catId: string) {
    if (categoryItems[catId]) return; // already cached
    setLoadingCategory(catId);
    publicFetch(`/public/menu/${rid}/category/${catId}`)
      .then((r) => r.json())
      .then((items: ApiMenuItem[]) => {
        setCategoryItems((prev) => ({ ...prev, [catId]: items }));
      })
      .catch(() => {})
      .finally(() => setLoadingCategory(null));
  }

  function handleCategoryChange(catId: string) {
    setActiveCategory(catId);
    fetchCategoryItems(restaurantId, catId);
  }

  async function lookupByPhone() {
    if (!phoneLookup.trim()) return;
    setPhoneLookupLoading(true);
    try {
      const res = await publicFetch(
        `/public/orders/active-by-phone/${encodeURIComponent(phoneLookup.trim())}`,
      );
      const data = await res.json();
      setPhoneLookupResult(data.orders || []);
    } catch {
      setPhoneLookupResult([]);
    }
    setPhoneLookupLoading(false);
  }

  const getItemQty = (menuItemId: string) =>
    cartItems.find((i) => i.menuItemId === menuItemId)?.quantity || 0;

  // For search: search across all loaded categories
  const allLoadedItems = Object.entries(categoryItems).flatMap(
    ([catId, items]) => {
      const cat = categories.find((c) => c.id === catId);
      return items.map((item) => ({
        ...item,
        catName: cat?.name || "",
        catEmoji: cat?.emoji || "",
      }));
    },
  );

  const searchResults = search.trim()
    ? allLoadedItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  // Current category items
  const currentItems = activeCategory
    ? categoryItems[activeCategory] || []
    : [];

  if (checkingOrder || loading) {
    return (
      <div className="py-12 text-center text-sm text-text3">Loading...</div>
    );
  }

  return (
    <div className="animate-fadeIn pb-24">
      {/* Add-to-order mode banner */}
      {addToOrderId && (
        <div className="mx-4 mt-3 rounded-[10px] border border-green-mid/30 bg-green-bg p-3">
          <div className="text-sm font-bold text-green-mid">
            Adding items to your order
          </div>
          <div className="mt-0.5 text-xs text-text2">
            Select items below, then view cart to submit
          </div>
        </div>
      )}

      {/* Active order banner */}
      {activeOrder && !addToOrderId && (
        <div className="mx-4 mt-3 rounded-[10px] border border-accent-border bg-accent-bg p-4">
          <div className="mb-1 text-sm font-bold">
            Your order is being prepared
          </div>
          <div className="mb-2 text-xs text-text2">
            {activeOrder.orderCode} · {activeOrder.items?.length || 0} item
            {(activeOrder.items?.length || 0) !== 1 ? "s" : ""} · ₹
            {activeOrder.total}
          </div>
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${
                activeOrder.status === "NEW"
                  ? "bg-new-bg text-accent"
                  : activeOrder.status === "COOKING"
                    ? "bg-amber-bg text-amber"
                    : activeOrder.status === "READY"
                      ? "bg-green-bg text-green-mid"
                      : "bg-blue-bg text-blue"
              }`}
            >
              {activeOrder.status === "NEW"
                ? "Order placed"
                : activeOrder.status === "COOKING"
                  ? "Being cooked"
                  : activeOrder.status === "READY"
                    ? "Ready to serve"
                    : "Bill sent"}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/order/${tableId}/status/${activeOrder.id}`}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-center text-xs font-semibold text-white hover:bg-accent2"
            >
              Track Order →
            </Link>
            <button
              onClick={() => setActiveOrder(null)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text2 hover:bg-surface2"
            >
              New Order
            </button>
          </div>
        </div>
      )}

      {/* Track order by phone */}
      {!activeOrder && (
        <div className="mx-4 mt-3 rounded-[10px] border border-border bg-surface p-3">
          <div className="mb-2 text-xs font-semibold text-text2">
            Already ordered? Track by phone number
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneLookup}
              onChange={(e) => {
                setPhoneLookup(e.target.value);
                setPhoneLookupResult(null);
              }}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
            />
            <button
              onClick={lookupByPhone}
              disabled={phoneLookupLoading || !phoneLookup.trim()}
              className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent2 disabled:opacity-50"
            >
              {phoneLookupLoading ? "..." : "Track"}
            </button>
          </div>
          {phoneLookupResult !== null && (
            <div className="mt-2">
              {phoneLookupResult.length === 0 ? (
                <div className="text-xs text-text3">
                  No active orders found for this number
                </div>
              ) : (
                <div className="space-y-2">
                  {phoneLookupResult.map((o) => (
                    <Link
                      key={o.id}
                      href={`/order/${tableId}/status/${o.id}`}
                      className="flex items-center justify-between rounded-lg border border-accent-border bg-accent-bg p-3 transition-all hover:border-accent"
                    >
                      <div>
                        <div className="text-xs font-bold">
                          {o.orderCode} · {o.table?.label}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text2">
                          ₹{o.total}
                        </div>
                      </div>
                      <span
                        className={`rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold ${
                          o.status === "COOKING"
                            ? "bg-amber-bg text-amber"
                            : o.status === "READY"
                              ? "bg-green-bg text-green-mid"
                              : "bg-new-bg text-accent"
                        }`}
                      >
                        {o.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            // Load all categories for search if not loaded
            if (e.target.value.trim()) {
              categories.forEach((cat) =>
                fetchCategoryItems(restaurantId, cat.id),
              );
            }
          }}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text3 focus:border-accent"
        />
      </div>

      {/* Category pills */}
      {!search.trim() && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "border-accent bg-accent-bg text-accent"
                  : "border-border bg-surface text-text2 hover:bg-surface2"
              }`}
            >
              {cat.emoji} {cat.name} ({cat._count.items})
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {search.trim() ? (
        // Search results across all loaded categories
        <div className="px-4 pt-3">
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-text3">
              No items found
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  qty={getItemQty(item.id)}
                  addItem={addItem}
                  removeItem={removeItem}
                  openReviews={openReviews}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Single category view
        <div className="px-4 pt-3">
          {loadingCategory === activeCategory ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-border animate-pulse" />
                    <div className="h-2 w-40 rounded bg-border animate-pulse" />
                    <div className="h-3 w-12 rounded bg-border animate-pulse" />
                  </div>
                  <div className="h-8 w-16 rounded-lg bg-border animate-pulse" />
                </div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-text3">
              No items in this category
            </div>
          ) : (
            <div className="space-y-2">
              {currentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  qty={getItemQty(item.id)}
                  addItem={addItem}
                  removeItem={removeItem}
                  openReviews={openReviews}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {categories.length === 0 && (
        <div className="py-12 text-center text-sm text-text3">
          No menu items available
        </div>
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
              <button
                onClick={() => setReviewsModal(null)}
                className="text-lg text-text3"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2 scrollbar-none">
              <button
                onClick={() =>
                  fetchReviews(
                    reviewsModal.itemId,
                    reviewsModal.itemName,
                    1,
                    null,
                  )
                }
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
                  onClick={() =>
                    fetchReviews(
                      reviewsModal.itemId,
                      reviewsModal.itemName,
                      1,
                      star,
                    )
                  }
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
                <div className="py-6 text-center text-xs text-text3">
                  Loading reviews...
                </div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-text3">
                  No reviews found
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewsModal.reviews.map((review, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-surface2 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`text-sm ${s <= review.rating ? "text-amber-400" : "text-text3"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-text3">
                          {new Date(review.createdAt).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      {review.note && (
                        <div className="mt-1.5 text-xs text-text2">
                          {review.note}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-text3">
                        {review.customer.name || "Customer"}
                      </div>
                    </div>
                  ))}
                  {reviewsModal.page < reviewsModal.totalPages && (
                    <button
                      onClick={() =>
                        fetchReviews(
                          reviewsModal.itemId,
                          reviewsModal.itemName,
                          reviewsModal.page + 1,
                          reviewsModal.starFilter,
                        )
                      }
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
              href={`/order/${tableId}/cart${addToOrderId ? `?addTo=${addToOrderId}` : ""}`}
              className="flex items-center justify-between rounded-xl bg-accent px-4 py-3 text-white shadow-[0_4px_20px_rgba(212,82,42,.3)] transition-all hover:bg-accent2"
            >
              <div className="text-sm font-bold">
                {totalItems} item{totalItems > 1 ? "s" : ""} · ₹
                {subtotal.toFixed(2)}
              </div>
              <div className="text-sm font-bold">View Cart →</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Extracted item card component to avoid repetition
function ItemCard({
  item,
  qty,
  addItem,
  removeItem,
  openReviews,
}: {
  item: ApiMenuItem;
  qty: number;
  addItem: (
    item: Omit<import("@/contexts/CartContext").CartItem, "quantity">,
  ) => void;
  removeItem: (id: string) => void;
  openReviews: (id: string, name: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3 shadow-[0_1px_3px_rgba(0,0,0,.07)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${item.type === "VEG" ? "border-green-mid bg-green-mid" : "border-red bg-red"}`}
          />
          <span className="truncate text-sm font-semibold">{item.name}</span>
        </div>
        {item.description && (
          <div className="mt-0.5 truncate text-xs text-text3">
            {item.description}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-accent">₹{item.price}</span>
          {item.averageRating !== undefined &&
            item.ratingCount !== undefined &&
            item.ratingCount > 0 && (
              <button
                onClick={() => openReviews(item.id, item.name)}
                className="flex items-center gap-0.5 text-xs text-text3"
              >
                <span className="text-amber-400">★</span>
                <span className="font-semibold text-text2">
                  {item.averageRating.toFixed(1)}
                </span>
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
}
