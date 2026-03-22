"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../contexts";
import { apiFetch } from "@/lib/api";
import { cachedFetch, clearCache, TTL } from "@/lib/cache";

export default function SettingsPage() {
  const toggleSidebar = useSidebarToggle();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [restName, setRestName] = useState("");
  const [phone, setPhone] = useState("");
  const [upi, setUpi] = useState("");
  const [mode, setMode] = useState<"DINE_IN" | "WALK_IN">("DINE_IN");
  const [tableCount, setTableCount] = useState(0);
  const [restaurantCode, setRestaurantCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    // Use cached restaurant data, fall back to fresh fetch
    cachedFetch<Record<string, unknown>>(
      "restaurant",
      () => apiFetch("/api/restaurant"),
      TTL.ONE_DAY,
    )
      .then((data) => {
        if (data && !data.error) {
          setRestName((data.name as string) || "");
          setPhone((data.phone as string) || "");
          setUpi((data.upiId as string) || "");
          setMode((data.serviceMode as "DINE_IN" | "WALK_IN") || "DINE_IN");
          setTableCount((data.tableCount as number) || 0);
          setRestaurantCode((data.restaurantCode as string) || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerateCode() {
    setGeneratingCode(true);
    try {
      const res = await apiFetch("/api/restaurant/code", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        setRestaurantCode(body.data.restaurantCode);
        showToast("Restaurant code generated!");
      } else {
        showToast("Failed to generate code");
      }
    } catch {
      showToast("Failed to generate code");
    }
    setGeneratingCode(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch("/api/restaurant", {
        method: "PATCH",
        body: JSON.stringify({
          name: restName,
          phone,
          upiId: upi,
          serviceMode: mode,
        }),
      });
      if (res.ok) {
        clearCache("restaurant"); // invalidate cached restaurant data
        showToast("Settings saved!");
      } else {
        showToast("Failed to save settings");
      }
    } catch {
      showToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await apiFetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        localStorage.clear();
        router.push(ROUTES.AUTH_LOGIN);
      } else {
        showToast("Failed to delete account");
        setDeleting(false);
      }
    } catch {
      showToast("Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar title="Settings" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-text3">
            Loading settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {/* Left column */}
            <div>
              <div className="mb-[14px] overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
                <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
                  <div className="text-[13px] font-semibold">
                    Restaurant Details
                  </div>
                </div>
                <div className="p-4">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Restaurant Name
                  </label>
                  <input
                    className="mb-[14px] w-full rounded-[7px] border-[1.5px] border-border bg-surface px-[11px] py-2 text-[13px] text-text outline-none focus:border-accent"
                    value={restName}
                    onChange={(e) => setRestName(e.target.value)}
                  />

                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Owner WhatsApp
                  </label>
                  <input
                    className="mb-1 w-full rounded-[7px] border-[1.5px] border-border bg-surface px-[11px] py-2 text-[13px] text-text outline-none focus:border-accent"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="mb-[14px] text-[11px] text-text3">
                    New orders sent here
                  </div>

                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    UPI ID
                  </label>
                  <input
                    className="mb-[14px] w-full rounded-[7px] border-[1.5px] border-border bg-surface px-[11px] py-2 text-[13px] text-text outline-none focus:border-accent"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                  />

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="overflow-hidden rounded-[10px] border border-[rgba(239,68,68,.3)] bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
                <div className="flex items-center justify-between border-b border-[rgba(239,68,68,.2)] px-[18px] py-[14px]">
                  <div className="text-[13px] font-semibold text-[#f87171]">
                    Danger Zone
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 text-xs text-text2">
                    Permanently delete your account and all associated data
                    including restaurants, menus, tables, and orders.
                  </div>
                  <button
                    onClick={() => {
                      setDeleteConfirm("");
                      setDeleteModal(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-[rgba(239,68,68,.4)] bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-[#f87171] transition-all hover:bg-red-bg"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              <div className="mb-[14px] overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
                <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
                  <div className="text-[13px] font-semibold">Service Mode</div>
                </div>
                <div className="p-4">
                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    How do customers order?
                  </label>
                  <div className="mb-[14px] flex gap-[9px]">
                    <div
                      onClick={() => setMode("DINE_IN")}
                      className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${mode === "DINE_IN" ? "border-accent bg-accent-bg" : "border-border"}`}
                    >
                      <div className="mb-[3px] text-lg">🪑</div>
                      <div className="text-xs font-bold">Dine-In</div>
                    </div>
                    <div
                      onClick={() => setMode("WALK_IN")}
                      className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${mode === "WALK_IN" ? "border-accent bg-accent-bg" : "border-border"}`}
                    >
                      <div className="mb-[3px] text-lg">🎫</div>
                      <div className="text-xs font-bold">Walk-In</div>
                    </div>
                  </div>

                  <label className="mb-[5px] block text-xs font-semibold text-text2">
                    Number of Tables
                  </label>
                  <input
                    className="mb-[14px] w-full rounded-[7px] border-[1.5px] border-border bg-surface px-[11px] py-2 text-[13px] text-text outline-none focus:border-accent"
                    type="number"
                    value={tableCount}
                    readOnly
                  />
                  <div className="mb-[14px] text-[11px] text-text3">
                    Manage tables from the Tables &amp; QR page
                  </div>

                  <button
                    onClick={() => showToast("Generating QR codes...")}
                    className="flex w-full items-center justify-center rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2"
                  >
                    Generate QR Codes
                  </button>
                </div>
              </div>

              {/* Staff Login Code */}
              <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
                <div className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
                  <div className="text-[13px] font-semibold">
                    Staff Login Code
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 text-xs text-text2">
                    Staff use this code along with their PIN to log in at{" "}
                    <span className="font-mono text-text">/staff/login</span>
                  </div>
                  {restaurantCode ? (
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex-1 rounded-lg border border-border bg-surface2 px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em]">
                        {restaurantCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(restaurantCode);
                          showToast("Code copied!");
                        }}
                        className="rounded-lg border border-border bg-transparent px-3 py-3 text-xs font-semibold text-text2 transition-all hover:bg-surface2"
                      >
                        📋
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 text-xs text-text3">
                      No code generated yet
                    </div>
                  )}
                  <button
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="flex w-full items-center justify-center rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
                  >
                    {generatingCode
                      ? "Generating..."
                      : restaurantCode
                        ? "Regenerate Code"
                        : "Generate Code"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 backdrop-blur-[3px]"
          onClick={(e) =>
            e.target === e.currentTarget && !deleting && setDeleteModal(false)
          }
        >
          <div className="mx-4 w-full max-w-[420px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold text-[#f87171]">
                Delete Account
              </div>
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 transition-all hover:bg-red-bg hover:text-red disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-start gap-[9px] rounded-lg border border-[rgba(239,68,68,.3)] bg-red-bg px-[14px] py-[10px] text-xs text-[#f87171]">
                <div>
                  This action is <b>permanent</b> and cannot be undone. All your
                  restaurants, menus, tables, orders, and subscription data will
                  be deleted.
                </div>
              </div>
              <label className="mb-[5px] block text-xs font-semibold text-text2">
                Type <span className="font-mono text-[#f87171]">DELETE</span> to
                confirm
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-border bg-surface px-[11px] py-2 font-mono text-[13px] text-text outline-none focus:border-[#f87171]"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="rounded-lg bg-[#ef4444] px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all hover:bg-[#dc2626] disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
