import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PHONE = "+91 82628 61157";
const WHATSAPP_LINK = `https://wa.me/918262861157`;

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[700px] px-4 py-12 sm:px-6 md:px-12 md:py-20">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-text2">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="text-text3">/</span>
          <span>Contact</span>
        </div>
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Support
        </div>
        <h1 className="mb-3 font-serif text-[clamp(26px,3vw,40px)] font-extrabold tracking-[-0.02em]">
          Get in touch
        </h1>
        <p className="mb-10 max-w-[460px] text-sm leading-[1.7] text-text2">
          Have a question about FoodRasoi? Need help setting up your restaurant?
          Reach us on WhatsApp — we typically respond within a few hours.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* WhatsApp */}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f5ee] text-2xl">
              💬
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text">WhatsApp</div>
              <div className="mt-[2px] text-[13px] text-text2">{PHONE}</div>
              <div className="mt-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-green-mid">
                Preferred channel
              </div>
            </div>
          </a>

          {/* Call */}
          <a
            href="tel:+918262861157"
            className="flex items-center gap-4 rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#fff3ef] text-2xl">
              📞
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text">Phone</div>
              <div className="mt-[2px] text-[13px] text-text2">{PHONE}</div>
              <div className="mt-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-text3">
                Mon – Sat, 10am – 7pm
              </div>
            </div>
          </a>
        </div>

        <div className="mt-10 rounded-[14px] border border-border bg-surface p-6">
          <div className="mb-4 text-[13px] font-semibold text-text">
            Common questions
          </div>
          <ul className="space-y-3">
            {[
              "How do I set up QR codes for my tables?",
              "Can I change my subscription plan?",
              "How do I add staff members?",
              "I need help with my Razorpay payment",
            ].map((q) => (
              <li key={q} className="flex items-start gap-2 text-[13px] text-text2">
                <span className="mt-[1px] shrink-0 text-accent">→</span>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  {q}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
