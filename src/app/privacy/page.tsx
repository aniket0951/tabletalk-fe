import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: `When you register and use FoodRasoi, we collect information necessary to provide our service:

**Account information:** Name, email address, and password when you create an account.

**Restaurant information:** Restaurant name, phone number, city, and service mode (Dine-In or Walk-In) that you provide during onboarding.

**Payment information:** Subscription payments are processed by Razorpay. We do not store your card details — Razorpay handles all payment data in accordance with PCI-DSS standards.

**Usage data:** Orders placed through your restaurant's QR codes, menu items, table configurations, and staff records you create within the platform.

**Device and technical data:** IP address, browser type, and basic analytics to help us improve the product.`,
  },
  {
    id: "how-we-use-it",
    title: "How We Use Your Information",
    content: `We use your information solely to operate and improve FoodRasoi:

- Provide and maintain the QR ordering and dashboard service
- Process subscription payments through Razorpay
- Send order notifications and alerts to your registered phone number
- Respond to support requests
- Improve the product based on usage patterns

We do not sell your data to third parties. We do not use your customer data for advertising.`,
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    content: `FoodRasoi uses a limited set of third-party services:

**Razorpay** — Payment processing for subscriptions. Subject to Razorpay's privacy policy.

**Vercel** — Hosting and infrastructure for the web application.

**Neon / PostgreSQL** — Database hosting for your restaurant data.

Each of these services has their own privacy policies governing how they handle data.`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: `We retain your data for as long as your account is active. If you cancel your subscription or delete your account, your data will be removed from our systems within 30 days, except where retention is required by law.

Order history data is retained for 12 months from the order date to support any billing disputes or operational queries.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `You have the right to:

- **Access** the personal data we hold about you
- **Correct** inaccurate information
- **Delete** your account and associated data
- **Export** your restaurant and order data

To exercise any of these rights, contact us at the number listed on our Contact page.`,
  },
  {
    id: "security",
    title: "Security",
    content: `We take reasonable measures to protect your data, including encrypted connections (HTTPS), hashed passwords, and restricted database access. However, no method of transmission over the internet is 100% secure.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this policy from time to time. We will notify registered users of significant changes via email or an in-app notice. Continued use of FoodRasoi after changes means you accept the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-text2">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="text-text3">/</span>
          <span>Privacy Policy</span>
        </div>
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Legal
        </div>
        <h1 className="mb-2 font-serif text-[clamp(26px,3vw,40px)] font-extrabold tracking-[-0.02em]">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-text2">Last updated: April 2026</p>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* TOC */}
          <aside className="shrink-0 lg:w-[200px]">
            <div className="sticky top-24 hidden lg:block">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-text3">
                Contents
              </div>
              <ul className="space-y-[6px]">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[12px] text-text2 hover:text-accent transition-colors"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2 className="mb-3 text-[17px] font-bold tracking-[-0.01em]">
                  {s.title}
                </h2>
                <div className="space-y-3 text-[14px] leading-[1.75] text-text2">
                  {s.content.split("\n\n").map((para, i) => {
                    const parts = para.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={j} className="font-semibold text-text">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
