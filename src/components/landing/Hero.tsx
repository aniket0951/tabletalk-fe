import Link from "next/link";

export default function Hero() {
  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-4 pb-10 pt-12 sm:px-6 md:gap-[60px] md:px-12 md:pb-[60px] md:pt-20 lg:grid-cols-2">
      {/* Left */}
      <div className="text-center lg:text-left">
        <div className="mb-5 inline-flex items-center gap-[7px] rounded-[20px] border border-accent-border bg-new-bg px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-accent">
          <div className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          Now live across India
        </div>
        <h1 className="mb-5 font-serif text-[clamp(28px,4.5vw,56px)] font-black leading-[1.05] tracking-[-0.03em]">
          Your restaurant,
          <br />
          orders via <em className="text-accent">WhatsApp.</em>
        </h1>
        <p className="mx-auto mb-8 max-w-[440px] text-sm leading-[1.7] text-text2 sm:text-base lg:mx-0">
          Customers scan a QR code, chat with an AI, place orders — you get notified instantly. No app, no waiter, no friction.
        </p>
        <div className="flex flex-col items-center gap-[10px] sm:flex-row sm:justify-center lg:justify-start">
          <Link href="/auth/register" className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-accent px-[26px] py-3 text-[15px] font-semibold text-white transition-all hover:bg-accent2 sm:w-auto">
            Get started free →
          </Link>
          <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-border2 bg-transparent px-[26px] py-3 text-[15px] font-semibold text-text transition-all hover:bg-surface2 sm:w-auto">
            See demo ▶
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 lg:justify-start">
          <div className="flex">
            {[
              { letter: "R", color: "#e07b39" },
              { letter: "S", color: "#2d6a4f" },
              { letter: "P", color: "#1d4ed8" },
              { letter: "A", color: "#7c3aed" },
            ].map((a, i) => (
              <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-white" style={{ background: a.color, marginLeft: i > 0 ? "-8px" : 0 }}>
                {a.letter}
              </div>
            ))}
          </div>
          <div className="text-xs text-text2">
            <strong className="text-text">120+ restaurants</strong> across India using TableTalk
          </div>
        </div>
      </div>

      {/* Right — Phone mockup */}
      <div className="relative mx-auto lg:mx-0">
        <div className="absolute -right-3 -top-3 z-10 hidden rounded-[10px] border-2 border-background bg-green-mid px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,.07)] sm:block">
          ✅ Order confirmed!
        </div>
        <div className="mx-auto max-w-[260px] rounded-[28px] bg-text p-[14px] shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)] sm:max-w-[280px]">
          <div className="overflow-hidden rounded-[18px] bg-[#e5ddd5] px-3 py-4">
            <div className="-mx-3 -mt-4 mb-3 flex items-center gap-2 rounded-t-[10px] bg-accent px-[14px] py-[10px]">
              <span className="text-base">🍽</span>
              <div className="text-xs font-semibold text-white">Saffron House · Table 7</div>
            </div>
            <div className="mb-2 flex justify-start">
              <div className="max-w-[80%] rounded-[0_10px_10px_10px] bg-white px-[10px] py-[7px] text-[11px] leading-[1.5]">Welcome! 🍽 Here&apos;s today&apos;s menu. What would you like?</div>
            </div>
            <div className="mb-2 flex justify-end">
              <div className="max-w-[80%] rounded-[10px_0_10px_10px] bg-[#dcf8c6] px-[10px] py-[7px] text-[11px] leading-[1.5]">1 butter chicken and 2 naans please</div>
            </div>
            <div className="mb-2 flex justify-start">
              <div className="max-w-[80%] rounded-[0_10px_10px_10px] bg-white px-[10px] py-[7px] text-[11px] leading-[1.5]">
                ✅ Got it!<br />• Butter Chicken ×1 — ₹420<br />• Garlic Naan ×2 — ₹160<br /><strong>Total: ₹580</strong><br />Confirm? Reply YES
              </div>
            </div>
            <div className="mb-2 flex justify-end">
              <div className="max-w-[80%] rounded-[10px_0_10px_10px] bg-[#dcf8c6] px-[10px] py-[7px] text-[11px] leading-[1.5]">yes</div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-[0_10px_10px_10px] bg-white px-[10px] py-[7px] text-[11px] leading-[1.5]">🎉 Order placed! Ready in ~25 mins.</div>
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
