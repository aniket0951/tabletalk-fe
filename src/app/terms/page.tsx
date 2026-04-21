import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By creating an account on FoodRasoi, you agree to these Terms of Service. If you do not agree, do not use the service.

These terms apply to all restaurant owners and operators who access FoodRasoi's dashboard, as well as customers who place orders via QR codes generated through the platform.`,
  },
  {
    id: "service-description",
    title: "Service Description",
    content: `FoodRasoi provides a QR code-based ordering platform for restaurants. The service includes:

- A web dashboard for managing menus, tables, staff, and orders
- Customer-facing QR code ordering pages
- Real-time order notifications
- Subscription billing and management

We reserve the right to modify, suspend, or discontinue any part of the service with reasonable notice.`,
  },
  {
    id: "accounts",
    title: "Accounts and Eligibility",
    content: `You must be at least 18 years old and legally authorised to operate a food service business in your jurisdiction to use FoodRasoi.

You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorised access.

Each account may operate multiple restaurant branches depending on your subscription plan.`,
  },
  {
    id: "subscription-billing",
    title: "Subscription & Billing",
    content: `FoodRasoi is a paid subscription service. Pricing is listed on our website and may change with 30 days' notice to existing subscribers.

**Trial period:** New accounts receive a free trial period. No charge is made until the trial ends.

**Billing:** Subscriptions are billed monthly via Razorpay. By subscribing, you authorise recurring charges to your payment method.

**Refunds:** We do not offer refunds for partial billing periods. If you cancel, your access continues until the end of the current billing cycle.

**Failed payments:** If a payment fails, your account may be downgraded or suspended until the balance is resolved.`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: `You agree not to use FoodRasoi to:

- Violate any applicable law or regulation
- Sell or serve illegal goods or services
- Misrepresent your restaurant or menu to customers
- Reverse engineer, copy, or resell any part of the platform
- Attempt to gain unauthorised access to other accounts or our infrastructure
- Use automated scripts to generate fake orders or data

We may suspend or terminate accounts that violate these rules without prior notice.`,
  },
  {
    id: "customer-data",
    title: "Customer Data",
    content: `Orders placed by your customers through QR codes are stored in your account. You are responsible for handling this data in accordance with applicable privacy laws.

FoodRasoi acts as a data processor on your behalf for customer order data. We do not use your customer data for our own marketing or analytics.`,
  },
  {
    id: "uptime",
    title: "Uptime and Support",
    content: `We aim for high availability but do not guarantee 100% uptime. Scheduled maintenance will be communicated in advance where possible.

Support is available via WhatsApp and email. Response times may vary based on volume.`,
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: `FoodRasoi is provided "as is." To the maximum extent permitted by law, we are not liable for:

- Loss of revenue or profits due to service downtime
- Errors in order processing resulting from customer or staff misuse
- Any indirect, incidental, or consequential damages

Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months prior to the claim.`,
  },
  {
    id: "termination",
    title: "Termination",
    content: `You may cancel your account at any time from the Billing section of your dashboard.

We may terminate your account for violation of these terms, non-payment, or at our discretion with 14 days' notice. Upon termination, your data will be retained for 30 days and then deleted.`,
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-text2">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="text-text3">/</span>
          <span>Terms of Service</span>
        </div>
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Legal
        </div>
        <h1 className="mb-2 font-serif text-[clamp(26px,3vw,40px)] font-extrabold tracking-[-0.02em]">
          Terms of Service
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
