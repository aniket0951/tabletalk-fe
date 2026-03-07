"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../layout";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { apiFetch } from "@/lib/api";
import type { ApiMenuCategory } from "@/types";

export default function MenuPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();
  const [menu, setMenu] = useState<ApiMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("🍽");
  const [catSaving, setCatSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal state
  const [miName, setMiName] = useState("");
  const [miCat, setMiCat] = useState("");
  const [miPrice, setMiPrice] = useState("");
  const [miType, setMiType] = useState<"VEG" | "NON_VEG" | "">("");
  const [miDesc, setMiDesc] = useState("");

  const fetchMenu = useCallback(() => {
    apiFetch("/api/menu/items")
      .then((r) => r.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setMenu(cats);
        if (cats.length > 0 && !expandedCat) setExpandedCat(cats[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useSocketEvent("menu:updated", fetchMenu);

  function openAddModal() {
    setEditItemId(null);
    setMiName(""); setMiCat(""); setMiPrice(""); setMiType(""); setMiDesc("");
    setModalOpen(true);
  }

  function openEditModal(categoryId: string, item: ApiMenuCategory["items"][0]) {
    setEditItemId(item.id);
    setMiName(item.name);
    setMiCat(categoryId);
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
          method: "PATCH",
          body: JSON.stringify({ name: miName, price: Number(miPrice), type: miType, description: miDesc }),
        });
        if (!res.ok) { showToast("Failed to update item"); setSavingItem(false); return; }
        showToast(`${miName} updated!`);
      } else {
        const res = await apiFetch("/api/menu/items", {
          method: "POST",
          body: JSON.stringify({ name: miName, price: Number(miPrice), type: miType, description: miDesc, categoryId: miCat }),
        });
        if (!res.ok) { showToast("Failed to add item"); setSavingItem(false); return; }
        showToast(`${miName} added!`);
      }
      fetchMenu();
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
        method: "PATCH",
        body: JSON.stringify({ available: !currentAvailable }),
      });
    } catch {
      showToast("Failed to toggle item");
    }
    setTogglingId(null);
  }

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
        method: "POST",
        body: JSON.stringify({ name: catName.trim(), emoji: catEmoji }),
      });
      if (res.ok) {
        showToast(`${catEmoji} ${catName} category added!`);
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
      <Topbar title="Menu Editor" onAddItem={() => checkSubscription("Add Item", openAddModal)} onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Menu Editor</div>
            <div className="mt-0.5 text-xs text-text3">
              {menu.reduce((s, c) => s + c.items.length, 0)} items · {menu.length} categories
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
          <div className="py-6 text-center text-sm text-text3">Loading menu...</div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
            {menu.map((cat) => (
              <div key={cat.id}>
                <div
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className={`flex cursor-pointer items-center justify-between border-b border-border px-[18px] py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.10em] transition-colors ${expandedCat === cat.id ? "bg-accent/[0.07] text-accent" : "bg-background text-text3 hover:bg-accent/[0.04] hover:text-accent/70"}`}
                >
                  <span>{cat.emoji} {cat.name} <span className="ml-1 text-[9px] font-semibold normal-case tracking-normal opacity-60">({cat.items.length})</span></span>
                  <span className={`text-[10px] transition-transform ${expandedCat === cat.id ? "rotate-180" : ""}`}>▼</span>
                </div>
                {expandedCat === cat.id && cat.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background">
                    <div className={`h-[10px] w-[10px] shrink-0 rounded-[2px] ${item.type === "VEG" ? "bg-green-mid" : "bg-red"}`} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{item.name}</div>
                      <div className="mt-[1px] text-[11px] text-text3">{item.description}</div>
                    </div>
                    <div className="min-w-[52px] text-right font-mono text-[13px] font-semibold">₹{item.price}</div>
                    <button
                      onClick={() => checkSubscription("Edit Item", () => openEditModal(cat.id, item))}
                      className="rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => checkSubscription("Toggle Availability", () => toggleItem(item.id, item.available))}
                      disabled={togglingId === item.id}
                      className={`relative h-[18px] w-8 shrink-0 cursor-pointer rounded-[9px] border-none transition-colors ${togglingId === item.id ? "opacity-50" : ""} ${item.available ? "bg-green-mid" : "bg-border2"}`}
                    >
                      <div
                        className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-[left] ${item.available ? "left-[17px]" : "left-[3px]"}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO" onClick={(e) => e.target === e.currentTarget && setCatModalOpen(false)}>
          <div className="mx-4 w-full max-w-[400px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">Add Category</div>
              <button onClick={() => setCatModalOpen(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red">✕</button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Category Name *</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="e.g. Starters, Main Course, Drinks" value={catName} onChange={(e) => setCatName(e.target.value.slice(0, 30))} />
                <div className="mt-[3px] text-right text-[11px] text-text3">{catName.length}/30</div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {["🍽", "🥗", "🍛", "🍜", "🥘", "🍰", "☕", "🥤", "🍺", "🧁"].map((e) => (
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
              <button onClick={() => setCatModalOpen(false)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2">Cancel</button>
              <button onClick={saveCategory} disabled={catSaving} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50">{catSaving ? "Adding..." : "Add Category"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="mx-4 flex max-h-[90vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">{editItemId ? "Edit Item" : "Add Menu Item"}</div>
              <button onClick={() => setModalOpen(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-[18px]">
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Item Name *</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="e.g. Chicken Biryani" value={miName} onChange={(e) => setMiName(e.target.value.slice(0, 50))} />
                <div className="mt-[3px] text-right text-[11px] text-text3">{miName.length}/50</div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Category *</label>
                <select className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none focus:border-accent" value={miCat} onChange={(e) => setMiCat(e.target.value)}>
                  <option value="">— Select —</option>
                  {menu.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Price (₹) *</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" type="number" placeholder="e.g. 320" value={miPrice} onChange={(e) => setMiPrice(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Type *</label>
                <div className="flex gap-[9px]">
                  <div
                    onClick={() => setMiType("VEG")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-[9px] py-[9px] text-xs font-semibold transition-all ${miType === "VEG" ? "border-green-mid bg-green-bg text-green-mid" : "border-border"}`}
                  >
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-green-mid" /> Vegetarian
                  </div>
                  <div
                    onClick={() => setMiType("NON_VEG")}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-[9px] py-[9px] text-xs font-semibold transition-all ${miType === "NON_VEG" ? "border-red bg-red-bg text-red" : "border-border"}`}
                  >
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-red" /> Non-Veg
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Description</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="Short description" value={miDesc} onChange={(e) => setMiDesc(e.target.value.slice(0, 80))} />
                <div className="mt-[3px] text-right text-[11px] text-text3">{miDesc.length}/80</div>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2">Cancel</button>
              <button onClick={saveItem} disabled={savingItem} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50">{savingItem ? "Saving..." : editItemId ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
