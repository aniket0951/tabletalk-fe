const features = [
  { icon: "📱", bg: "#fff3ef", title: "WhatsApp Native", desc: "Customers order on WhatsApp — the app they already use every day. Zero downloads, zero friction." },
  { icon: "🤖", bg: "#e8f5ee", title: "Claude AI Brain", desc: 'Understands typos, shorthand, and natural language. "1 butter chikn n 2 naan" works perfectly.' },
  { icon: "⚡", bg: "#eff6ff", title: "Instant Notifications", desc: "Owner gets WhatsApp ping the moment an order is placed — table number, items, total." },
  { icon: "🪑", bg: "#f5f3ff", title: "Dine-In + Walk-In", desc: "QR codes per table for restaurants. Single QR + token system for breakfast centres and canteens." },
  { icon: "📊", bg: "#fef3c7", title: "Live Dashboard", desc: "Track every order in real-time. See what's cooking, what's ready, revenue today and this week." },
  { icon: "☰", bg: "#fef2f2", title: "Easy Menu Management", desc: "Add, edit, or hide items from your dashboard. Changes reflect instantly on the bot." },
];

export default function Features() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
      <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
        Why TableTalk
      </div>
      <h2 className="mb-3 font-serif text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em]">
        Everything your restaurant needs,
        <br className="hidden sm:block" />
        nothing it doesn&apos;t.
      </h2>
      <p className="mb-8 max-w-[500px] text-sm leading-[1.7] text-text2 sm:text-[15px] md:mb-12">
        Built specifically for Indian restaurants — dine-in, breakfast centres, canteens, and dhabas.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {features.map((f, i) => (
          <div key={i} className="rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.08),0_2px_6px_rgba(0,0,0,.04)] sm:p-6">
            <div className="mb-[14px] flex h-10 w-10 items-center justify-center rounded-[10px] text-xl" style={{ background: f.bg }}>{f.icon}</div>
            <div className="mb-1.5 text-[15px] font-bold">{f.title}</div>
            <div className="text-[13px] leading-[1.6] text-text2">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
