import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function Hero() {
  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-4 pb-10 pt-12 sm:px-6 md:gap-[60px] md:px-12 md:pb-[60px] md:pt-20 lg:grid-cols-2">
      {/* Left */}
      <div className="text-center lg:text-left">
        {/*<div className="mb-5 inline-flex items-center gap-[7px] rounded-[20px] border border-accent-border bg-new-bg px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-accent">
          <div className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          Now live across India
        </div>*/}
        <h1 className="mb-5 font-serif text-[clamp(28px,4.5vw,56px)] font-black leading-[1.05] tracking-[-0.03em]">
          Your restaurant,
          <br />
          orders via <em className="text-accent">QR code.</em>
        </h1>
        <p className="mx-auto mb-8 max-w-[440px] text-sm leading-[1.7] text-text2 sm:text-base lg:mx-0">
          Customers scan a QR code, browse your menu, and place orders — you get
          notified instantly on the dashboard. No app, no waiter, no friction.
        </p>
        <div className="flex flex-col items-center gap-[10px] sm:flex-row sm:justify-center lg:justify-start">
          <Link
            href={ROUTES.AUTH_REGISTER}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-accent px-[26px] py-3 text-[15px] font-semibold text-white transition-all hover:bg-accent2 sm:w-auto"
          >
            Get started free →
          </Link>
          {/*<button className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-border2 bg-transparent px-[26px] py-3 text-[15px] font-semibold text-text transition-all hover:bg-surface2 sm:w-auto">
            See demo ▶
          </button>*/}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 lg:justify-start">
          <div className="flex">
            {[
              { letter: "R", color: "#e07b39" },
              { letter: "S", color: "#2d6a4f" },
              { letter: "P", color: "#1d4ed8" },
              { letter: "A", color: "#7c3aed" },
            ].map((a, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-white"
                style={{ background: a.color, marginLeft: i > 0 ? "-8px" : 0 }}
              >
                {a.letter}
              </div>
            ))}
          </div>
          <div className="text-xs text-text2">
            <strong className="text-text">120+ restaurants</strong> across India
            using FoodRasoi
          </div>
        </div>
      </div>

      {/* Right — Phone mockup */}
      <div className="relative mx-auto lg:mx-0">
        <div className="absolute -right-3 -top-3 z-10 hidden rounded-[10px] border-2 border-background bg-green-mid px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,.07)] sm:block">
          ✅ Order confirmed!
        </div>
        <div className="mx-auto max-w-[260px] rounded-[28px] bg-text p-[14px] shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)] sm:max-w-[280px]">
          <div className="overflow-hidden rounded-[18px] bg-[#f8f7f5]">
            {/* App header */}
            <div className="flex items-center gap-2 bg-accent px-[14px] py-[10px]">
              <span className="text-base">🍽</span>
              <div>
                <div className="text-[11px] font-bold text-white leading-none">
                  Saffron House
                </div>
                <div className="text-[9px] text-white/70 mt-[2px]">Table 7</div>
              </div>
            </div>
            {/* Category pills */}
            <div className="flex gap-[6px] overflow-hidden px-3 pt-3 pb-2">
              {["All", "Starters", "Main", "Breads"].map((cat, i) => (
                <div
                  key={cat}
                  className={`shrink-0 rounded-full px-[9px] py-[3px] text-[9px] font-semibold ${i === 2 ? "bg-accent text-white" : "bg-white border border-border text-text2"}`}
                >
                  {cat}
                </div>
              ))}
            </div>
            {/* Menu items */}
            <div className="px-3 pb-3 space-y-[7px]">
              {[
                {
                  name: "Butter Chicken",
                  price: "₹420",
                  tag: "🔥 Popular",
                  qty: 1,
                },
                { name: "Garlic Naan", price: "₹80", tag: null, qty: 2 },
                {
                  name: "Dal Makhani",
                  price: "₹280",
                  tag: "Chef's pick",
                  qty: 0,
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-[10px] bg-white px-[10px] py-[8px] shadow-[0_1px_3px_rgba(0,0,0,.06)]"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-text leading-none">
                      {item.name}
                    </div>
                    {item.tag && (
                      <div className="mt-[3px] text-[9px] text-accent font-medium">
                        {item.tag}
                      </div>
                    )}
                    <div className="mt-[3px] text-[10px] font-bold text-text2">
                      {item.price}
                    </div>
                  </div>
                  {item.qty > 0 ? (
                    <div className="flex items-center gap-[5px]">
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                        −
                      </div>
                      <span className="text-[11px] font-bold text-accent">
                        {item.qty}
                      </span>
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                        +
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent text-[13px] font-bold text-white">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Cart bar */}
            <div className="mx-3 mb-3 flex items-center justify-between rounded-[10px] bg-accent px-[12px] py-[8px]">
              <div className="text-[10px] font-semibold text-white/80">
                3 items · ₹580
              </div>
              <div className="text-[10px] font-bold text-white">
                View Cart →
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -left-2 bottom-5 hidden rounded-[10px] border border-border bg-white px-3 py-2 text-[11px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,.08)] sm:block sm:-left-5">
          🆕 Table 7 · ₹580 · Kitchen notified
        </div>
      </div>
    </div>
  );
}
