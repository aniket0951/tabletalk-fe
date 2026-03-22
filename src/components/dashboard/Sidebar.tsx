"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

const mainNav = [
  { icon: "◈", label: "Dashboard", href: "/dashboard" },
  { icon: "📋", label: "Orders", href: "/dashboard/orders" },
  { icon: "👥", label: "Customers", href: "/dashboard/customers" },
  { icon: "📣", label: "Campaigns", href: "/dashboard/campaigns" },
];

const setupNav = [
  { icon: "☰", label: "Menu Editor", href: "/dashboard/menu" },
  { icon: "🪑", label: "Tables & QR", href: "/dashboard/tables" },
  { icon: "👤", label: "Staff", href: "/dashboard/staff" },
  { icon: "⚙", label: "Settings", href: "/dashboard/settings" },
];

const accountNav = [
  { icon: "◎", label: "Billing", href: "/dashboard/billing" },
];

interface SidebarProps {
  restName: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  trialDaysLeft: number | null;
  activeOrderCount: number;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ restName, subscriptionPlan, subscriptionStatus, trialDaysLeft, activeOrderCount, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.clear();
    router.push(ROUTES.AUTH_LOGIN);
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-[2px] md:hidden" onClick={onClose} />
      )}

      <aside className={`fixed bottom-0 left-0 top-0 z-200 flex w-[220px] flex-col bg-text transition-transform duration-300 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-white/[0.07] px-[18px] py-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[9px]">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-[15px]">🍽</div>
              <div className="font-serif text-[17px] text-white tracking-[-0.02em]">TableTalk</div>
            </div>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:text-white md:hidden">✕</button>
          </div>
          <div className="mt-[5px] font-mono text-[10px] tracking-[0.08em] text-white/25">RESTAURANT OS</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-[10px] py-3">
          <div className="px-2 pb-[5px] pt-[10px] font-mono text-[9px] uppercase tracking-[0.12em] text-white/[0.22]">Main</div>
          {mainNav.map((item) => {
            const badge = item.label === "Orders" && activeOrderCount > 0 ? String(activeOrderCount) : null;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={`mb-px flex items-center gap-[9px] rounded-[7px] px-[10px] py-2 text-[13px] font-medium transition-all ${isActive(item.href) ? "bg-accent text-white" : "text-white/50 hover:bg-white/[0.07] hover:text-white/80"}`}>
                <span className="w-4 shrink-0 text-center text-sm">{item.icon}</span>
                {item.label}
                {badge && <span className={`ml-auto rounded-[9px] px-1.5 py-px text-[9px] font-bold text-white ${isActive(item.href) ? "bg-white/20" : "bg-accent2"}`}>{badge}</span>}
              </Link>
            );
          })}

          <div className="px-2 pb-[5px] pt-[10px] font-mono text-[9px] uppercase tracking-[0.12em] text-white/[0.22]">Setup</div>
          {setupNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className={`mb-px flex items-center gap-[9px] rounded-[7px] px-[10px] py-2 text-[13px] font-medium transition-all ${isActive(item.href) ? "bg-accent text-white" : "text-white/50 hover:bg-white/[0.07] hover:text-white/80"}`}>
              <span className="w-4 shrink-0 text-center text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="px-2 pb-[5px] pt-[10px] font-mono text-[9px] uppercase tracking-[0.12em] text-white/[0.22]">Account</div>
          {accountNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className={`mb-px flex items-center gap-[9px] rounded-[7px] px-[10px] py-2 text-[13px] font-medium transition-all ${isActive(item.href) ? "bg-accent text-white" : "text-white/50 hover:bg-white/[0.07] hover:text-white/80"}`}>
              <span className="w-4 shrink-0 text-center text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/[0.07] px-[10px] py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-[10px] py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[13px]">🏠</div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">{restName}</div>
              {subscriptionPlan ? (
                <>
                  <div className="mt-[3px] inline-block rounded-[5px] bg-[rgba(34,197,94,.2)] px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[0.08em] text-[#4ade80]">● {subscriptionPlan} PLAN</div>
                  {subscriptionStatus === "TRIAL" && trialDaysLeft != null && (
                    <div className={`mt-[3px] font-mono text-[9px] font-bold tracking-[0.04em] ${trialDaysLeft <= 3 ? "text-[#fbbf24]" : "text-white/40"}`}>
                      {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-[3px] inline-block rounded-[5px] bg-[rgba(239,68,68,.2)] px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[0.08em] text-[#f87171]">✕ NO SUBSCRIPTION</div>
              )}
            </div>
          </div>
          <div className="mt-2 px-1">
            <button onClick={handleLogout} className="flex w-full items-center justify-start rounded-lg bg-transparent px-[11px] py-[5px] text-xs font-semibold text-white/40 transition-all hover:bg-white/[0.07] hover:text-red">⏻ Logout</button>
          </div>
        </div>
      </aside>
    </>
  );
}
