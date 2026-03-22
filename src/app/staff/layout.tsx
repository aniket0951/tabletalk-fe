"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SocketProvider } from "@/contexts/SocketContext";
import { apiFetch } from "@/lib/api";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { ROUTES } from "@/lib/routes";

interface StaffProfile {
  staffId: string;
  name: string;
  role: string;
  restaurantName: string;
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === ROUTES.STAFF_LOGIN) {
      setChecking(false);
      return;
    }

    apiFetch("/api/staff/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((body) => { setStaff(body.data); setChecking(false); })
      .catch(() => { setChecking(false); router.push(ROUTES.STAFF_LOGIN); });
  }, [pathname, router]);

  async function handleLogout() {
    await apiFetch("/api/staff/auth/logout", { method: "POST" });
    localStorage.removeItem(STORAGE_KEY.STAFF);
    router.push(ROUTES.STAFF_LOGIN);
  }

  // Login page renders without header
  if (pathname === ROUTES.STAFF_LOGIN) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-text3">Loading...</div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-100 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-[9px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-accent text-sm">🍽</div>
            <div>
              <div className="text-[13px] font-bold">{staff?.restaurantName}</div>
              <div className="font-mono text-[10px] text-text3">{staff?.name} · {staff?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-border bg-transparent px-3 py-[5px] text-xs font-semibold text-text2 transition-all hover:bg-surface2"
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SocketProvider>
  );
}
