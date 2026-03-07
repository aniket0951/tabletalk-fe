import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import AuthRedirect from "@/components/shared/AuthRedirect";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthRedirect />
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
