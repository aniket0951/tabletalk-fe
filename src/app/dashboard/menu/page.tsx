"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../contexts";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { apiFetch, publicFetch } from "@/lib/api";
import type { ApiMenuItem } from "@/types";
import { RequestType } from "@/types/constants";

interface CategoryTab {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  _count: { items: number };
}

export default function MenuPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();

  // Categories (tabs)
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<
    Record<string, ApiMenuItem[]>
  >({});
  const [categoryHasMore, setCategoryHasMore] = useState<
    Record<string, boolean>
  >({});
  const [categoryPage, setCategoryPage] = useState<Record<string, number>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  // Item modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [miName, setMiName] = useState("");
  const [miCat, setMiCat] = useState("");
  const [miPrice, setMiPrice] = useState("");
  const [miType, setMiType] = useState<"VEG" | "NON_VEG" | "">("");
  const [miDesc, setMiDesc] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Category modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("🍽");
  const [catSaving, setCatSaving] = useState(false);

  // Reviews modal state
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
          const body = await res.json();
          const data = body.data;
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
      } catch {}
      setReviewsLoading(false);
    },
    [],
  );

  // Fetch categories (tabs only)
  const fetchCategories = useCallback(() => {
    apiFetch("/api/menu/categories")
      .then((r) => r.json())
      .then((body) => {
        const cats = Array.isArray(body.data) ? body.data : [];
        setCategories(cats);
        if (cats.length > 0 && !activeTab) {
          const firstId = cats[0].id;
          setActiveTab(firstId);
          fetchCategoryItems(firstId);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch items for a single category (page 1)
  function fetchCategoryItems(catId: string, force = false) {
    if (!force && categoryItems[catId]) return;
    const cat = categories.find((c) => c.id === catId);
    if (!force && cat && cat._count.items === 0) {
      setCategoryItems((prev) => ({ ...prev, [catId]: [] }));
      setCategoryHasMore((prev) => ({ ...prev, [catId]: false }));
      return;
    }
    setLoadingItems(catId);
    apiFetch(`/api/menu/categories/${catId}/items?page=1&limit=20`)
      .then((r) => r.json())
      .then((body) => {
        const data = body.data;
        setCategoryItems((prev) => ({ ...prev, [catId]: data?.items || [] }));
        setCategoryHasMore((prev) => ({
          ...prev,
          [catId]: data?.pagination?.hasMore || false,
        }));
        setCategoryPage((prev) => ({ ...prev, [catId]: 1 }));
      })
      .catch(() => {})
      .finally(() => setLoadingItems(null));
  }

  // Load more items for active category
  async function loadMoreItems() {
    if (!activeTab || !categoryHasMore[activeTab]) return;
    const nextPage = (categoryPage[activeTab] || 1) + 1;
    setLoadingMore(true);
    try {
      const res = await apiFetch(
        `/api/menu/categories/${activeTab}/items?page=${nextPage}&limit=20`,
      );
      const body = await res.json();
      const data = body.data;
      setCategoryItems((prev) => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), ...(data?.items || [])],
      }));
      setCategoryHasMore((prev) => ({
        ...prev,
        [activeTab]: data?.pagination?.hasMore || false,
      }));
      setCategoryPage((prev) => ({ ...prev, [activeTab]: nextPage }));
    } catch {}
    setLoadingMore(false);
  }

  function handleTabChange(catId: string) {
    setActiveTab(catId);
    fetchCategoryItems(catId);
  }

  // Current tab items
  const currentItems = activeTab ? categoryItems[activeTab] || [] : [];
  const totalItems = categories.reduce((s, c) => s + c._count.items, 0);

  // Item CRUD
  function openAddModal() {
    setEditItemId(null);
    setMiName("");
    setMiCat(activeTab || "");
    setMiPrice("");
    setMiType("");
    setMiDesc("");
    setModalOpen(true);
  }

  function openEditModal(item: ApiMenuItem) {
    setEditItemId(item.id);
    setMiName(item.name);
    setMiCat(item.categoryId);
    setMiPrice(String(item.price));
    setMiType(item.type as "VEG" | "NON_VEG");
    setMiDesc(item.description);
    setModalOpen(true);
  }

  async function saveItem() {
    if (!miName || !miCat || !miPrice || !miType) {
      alert("Please fill all required fields and select type.");
      return;
    }
    setSavingItem(true);
    try {
      if (editItemId) {
        const res = await apiFetch(`/api/menu/items/${editItemId}`, {
          method: RequestType.Patch,
          body: JSON.stringify({
            name: miName,
            price: Number(miPrice),
            type: miType,
            description: miDesc,
          }),
        });
        if (!res.ok) {
          showToast("Failed to update item");
          setSavingItem(false);
          return;
        }
        showToast(`${miName} updated!`);
      } else {
        const res = await apiFetch("/api/menu/items", {
          method: RequestType.Post,
          body: JSON.stringify({
            name: miName,
            price: Number(miPrice),
            type: miType,
            description: miDesc,
            categoryId: miCat,
          }),
        });
        if (!res.ok) {
          showToast("Failed to add item");
          setSavingItem(false);
          return;
        }
        showToast(`${miName} added!`);
      }
      // Refetch only the affected category's items
      fetchCategoryItems(miCat, true);
      // Update item count locally — no need to refetch all categories
      if (!editItemId) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === miCat
              ? { ...c, _count: { items: c._count.items + 1 } }
              : c,
          ),
        );
      }
    } catch {
      showToast("Failed to save item");
    }
    setSavingItem(false);
    setModalOpen(false);
  }

  async function toggleItem(itemId: string, currentAvailable: boolean) {
    setTogglingId(itemId);
    try {
      await apiFetch(`/api/menu/items/${itemId}`, {
        method: RequestType.Patch,
        body: JSON.stringify({ available: !currentAvailable }),
      });
      // Update locally
      if (activeTab) {
        setCategoryItems((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).map((i) =>
            i.id === itemId ? { ...i, available: !currentAvailable } : i,
          ),
        }));
      }
    } catch {
      showToast("Failed to toggle item");
    }
    setTogglingId(null);
  }

  // Category CRUD
  function openAddCategory() {
    setCatName("");
    setCatEmoji("🍽");
    setCatModalOpen(true);
  }

  async function saveCategory() {
    if (!catName.trim()) {
      alert("Please enter a category name.");
      return;
    }
    setCatSaving(true);
    try {
      const res = await apiFetch("/api/menu/categories", {
        method: RequestType.Post,
        body: JSON.stringify({ name: catName.trim(), emoji: catEmoji }),
      });
      if (res.ok) {
        const body = await res.json();
        const newCat = body.data;
        showToast(`${catEmoji} ${catName} category added!`);
        // Add locally — no full refetch, stays on current tab
        setCategories((prev) => [
          ...prev,
          {
            id: newCat.id,
            name: catName.trim(),
            emoji: catEmoji,
            sortOrder: prev.length,
            _count: { items: 0 },
          },
        ]);
      } else {
        showToast("Failed to add category");
      }
    } catch {
      showToast("Failed to add category");
    } finally {
      setCatSaving(false);
      setCatModalOpen(false);
    }
  }

  return (
    <>
      {gate}
      <Topbar
        title="Menu Editor"
        onAddItem={() => checkSubscription("Add Item", openAddModal)}
        onMenuToggle={toggleSidebar}
      />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Menu Editor</div>
            <div className="mt-0.5 text-xs text-text3">
              {totalItems} items · {categories.length} categories
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => checkSubscription("Add Category", openAddCategory)}
              className="hidden items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2 sm:inline-flex"
            >
              + Add Category
            </button>
            <button
              onClick={() => checkSubscription("Add Item", openAddModal)}
              className="hidden items-center justify-center gap-1.5 rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 sm:inline-flex"
            >
              + Add Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-text3">
            Loading menu...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-2 text-2xl">📋</div>
            <div className="text-sm text-text3">
              No categories yet. Add one to get started.
            </div>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleTabChange(cat.id)}
                  className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === cat.id
                      ? "border-accent bg-accent-bg text-accent"
                      : "border-border bg-surface text-text2 hover:bg-surface2"
                  }`}
                >
                  {cat.emoji} {cat.name} ({cat._count.items})
                </button>
              ))}
            </div>

            {/* Items for active tab */}
            <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              {loadingItems === activeTab ? (
                <div className="space-y-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-[11px] border-b border-border px-[18px] py-[10px] last:border-b-0"
                    >
                      <div className="h-[10px] w-[10px] rounded-[2px] bg-border animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 rounded bg-border animate-pulse" />
                        <div className="h-2 w-48 rounded bg-border animate-pulse" />
                      </div>
                      <div className="h-3 w-12 rounded bg-border animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : currentItems.length === 0 ? (
                <div className="px-[18px] py-8 text-center text-sm text-text3">
                  No items in this category
                </div>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background"
                  >
                    <div
                      className={`h-[10px] w-[10px] shrink-0 rounded-[2px] ${item.type === "VEG" ? "bg-green-mid" : "bg-red"}`}
                    />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{item.name}</div>
                      <div className="mt-[1px] text-[11px] text-text3">
                        {item.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="min-w-[52px] text-right font-mono text-[13px] font-semibold">
                        ₹{item.price}
                      </div>
                      {item.averageRating !== undefined &&
                        item.ratingCount !== undefined &&
                        item.ratingCount > 0 && (
                          <button
                            onClick={() => {
                              setReviewsModal({
                                itemId: item.id,
                                itemName: item.name,
                                reviews: [],
                                page: 1,
                                totalPages: 1,
                                starFilter: null,
                              });
                              fetchReviews(item.id, item.name, 1, null);
                            }}
                            className="flex items-center gap-0.5 text-[11px] text-text3 hover:text-text2"
                          >
                            <span className="text-amber-400">★</span>
                            <span className="font-semibold text-text2">
                              {item.averageRating.toFixed(1)}
                            </span>
                            <span>({item.ratingCount})</span>
                          </button>
                        )}
                    </div>
                    <button
                      onClick={() =>
                        checkSubscription("Edit Item", () =>
                          openEditModal(item),
                        )
                      }
                      className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        checkSubscription("Toggle Availability", () =>
                          toggleItem(item.id, item.available),
                        )
                      }
                      disabled={togglingId === item.id}
                      className={`relative h-[18px] w-8 shrink-0 cursor-pointer rounded-[9px] border-none transition-colors ${togglingId === item.id ? "opacity-50" : ""} ${item.available ? "bg-green-mid" : "bg-border2"}`}
                    >
                      <div
                        className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-[left] ${item.available ? "left-[17px]" : "left-[3px]"}`}
                      />
                    </button>
                  </div>
                ))
              )}

              {/* Load more */}
              {activeTab && categoryHasMore[activeTab] && (
                <div className="border-t border-border px-[18px] py-3">
                  <button
                    onClick={loadMoreItems}
                    disabled={loadingMore}
                    className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-text2 transition-all hover:bg-surface2 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load more items"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Category Modal */}
      {catModalOpen && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) =>
            e.target === e.currentTarget && setCatModalOpen(false)
          }
        >
          <div className="mx-4 w-full max-w-[400px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">Add Category</div>
              <button
                onClick={() => setCatModalOpen(false)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Category Name *
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Starters, Main Course, Drinks"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value.slice(0, 30))}
                />
                <div className="mt-[3px] text-right text-[11px] text-text3">
                  {catName.length}/30
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "🍽",
                    "🥗",
                    "🍛",
                    "🍜",
                    "🥘",
                    "🍰",
                    "☕",
                    "🥤",
                    "🍺",
                    "🧁",
                  ].map((e) => (
                    <div
                      key={e}
                      onClick={() => setCatEmoji(e)}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-[1.5px] text-lg transition-all ${catEmoji === e ? "border-accent bg-accent-bg" : "border-border hover:bg-surface2"}`}
                    >
                      {e}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button
                onClick={() => setCatModalOpen(false)}
                className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                disabled={catSaving}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
              >
                {catSaving ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setReviewsModal(null)}
        >
          <div className="mx-4 w-full max-w-[460px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-bold">{reviewsModal.itemName}</div>
                <div className="text-xs text-text3">Customer Reviews</div>
              </div>
              <button
                onClick={() => setReviewsModal(null)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto border-b border-border px-5 py-2 scrollbar-none">
              <button
                onClick={() =>
                  fetchReviews(
                    reviewsModal.itemId,
                    reviewsModal.itemName,
                    1,
                    null,
                  )
                }
                className={`shrink-0 rounded-2xl border px-3 py-1 text-[11px] font-semibold transition-all ${reviewsModal.starFilter === null ? "border-accent bg-accent-bg text-accent" : "border-border bg-surface text-text2"}`}
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
                  className={`shrink-0 rounded-2xl border px-3 py-1 text-[11px] font-semibold transition-all ${reviewsModal.starFilter === star ? "border-accent bg-accent-bg text-accent" : "border-border bg-surface text-text2"}`}
                >
                  {star} ★
                </button>
              ))}
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-5 py-3">
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

      {/* Menu Item Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="mx-4 flex max-h-[90vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">
                {editItemId ? "Edit Item" : "Add Menu Item"}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-[18px]">
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Item Name *
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Chicken Biryani"
                  value={miName}
                  onChange={(e) => setMiName(e.target.value.slice(0, 50))}
                />
                <div className="mt-[3px] text-right text-[11px] text-text3">
                  {miName.length}/50
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Category *
                </label>
                <select
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none focus:border-accent"
                  value={miCat}
                  onChange={(e) => setMiCat(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Price (₹) *
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  type="number"
                  placeholder="e.g. 320"
                  value={miPrice}
                  onChange={(e) => setMiPrice(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Type *
                </label>
                <div className="flex gap-[9px]">
                  <div
                    onClick={() => setMiType("VEG")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-[9px] py-[9px] text-xs font-semibold transition-all ${miType === "VEG" ? "border-green-mid bg-green-bg text-green-mid" : "border-border"}`}
                  >
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-green-mid" />{" "}
                    Vegetarian
                  </div>
                  <div
                    onClick={() => setMiType("NON_VEG")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-[9px] py-[9px] text-xs font-semibold transition-all ${miType === "NON_VEG" ? "border-red bg-red-bg text-red" : "border-border"}`}
                  >
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-red" />{" "}
                    Non-Veg
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Description
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="Short description"
                  value={miDesc}
                  onChange={(e) => setMiDesc(e.target.value.slice(0, 80))}
                />
                <div className="mt-[3px] text-right text-[11px] text-text3">
                  {miDesc.length}/80
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
                onClick={saveItem}
                disabled={savingItem}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
              >
                {savingItem
                  ? "Saving..."
                  : editItemId
                    ? "Save Changes"
                    : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
