import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const plans = [
  { name: "Starter", price: "₹999", desc: "For small restaurants getting started with WhatsApp ordering", features: ["1 restaurant", "Dine-In or Walk-In mode", "Up to 500 orders/month", "Owner WhatsApp notifications"], cta: "Start free trial", ctaStyle: "outline" as const, popular: false },
  { name: "Growth", price: "₹1,499", desc: "For busy restaurants that need analytics and unlimited orders", features: ["1 restaurant", "Both Dine-In + Walk-In modes", "Unlimited orders", "Order history + analytics", "Daily sales summary"], cta: "Start free trial →", ctaStyle: "primary" as const, popular: true },
  { name: "Multi", price: "₹3,999", desc: "For chains and multi-branch restaurant groups", features: ["Up to 5 branches", "All Growth features", "Central dashboard", "Branch-wise analytics", "Priority support"], cta: "Contact us", ctaStyle: "outline" as const, popular: false },
];

export default function Pricing() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 sm:px-6 md:px-12 md:pb-16">
      <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Pricing</div>
      <h2 className="mb-3 font-serif text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em]">Simple, honest pricing.</h2>
      <p className="mb-8 max-w-[500px] text-sm leading-[1.7] text-text2 sm:text-[15px] md:mb-12">
        Start free. Pay only when you&apos;re ready. No hidden charges, no per-order fees.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((plan, i) => (
          <div key={i} className={`relative rounded-[14px] border-[1.5px] bg-surface p-5 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] sm:p-6 ${plan.popular ? "border-accent shadow-[0_0_0_4px_rgba(212,82,42,.08)]" : "border-border"}`}>
            {plan.popular && (
              <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-lg bg-accent px-3 py-[3px] font-mono text-[9px] font-bold tracking-[0.1em] text-white">MOST POPULAR</div>
            )}
            <div className="mb-1 text-[15px] font-bold">{plan.name}</div>
            <div className="mb-1 font-serif text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
              {plan.price}<span className="font-sans text-[13px] font-normal text-text2">/month</span>
            </div>
            <div className="mb-4 border-b border-border pb-4 text-xs text-text2">{plan.desc}</div>
            {plan.features.map((f, j) => (
              <div key={j} className="mb-[7px] flex items-center gap-[7px] text-[13px] text-text2">
                <span className="shrink-0 text-xs font-bold text-green-mid">✓</span>{f}
              </div>
            ))}
            <div className="mt-4">
              <Link href={ROUTES.AUTH_REGISTER} className={`flex w-full items-center justify-center rounded-lg px-[18px] py-[9px] text-[13px] font-semibold transition-all ${plan.ctaStyle === "primary" ? "bg-accent text-white hover:bg-accent2" : "border-[1.5px] border-border2 bg-transparent text-text hover:bg-surface2"}`}>
                {plan.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
