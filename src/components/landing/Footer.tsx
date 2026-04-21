import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-4 bg-text px-4 py-8 text-center text-[13px] text-white/60 sm:flex-row sm:justify-between sm:px-6 sm:text-left md:px-12 md:py-10">
      <div className="font-serif text-lg font-bold text-white">FoodRasoi</div>
      <div>Made in India 🇮🇳 · © 2026 FoodRasoi</div>
      <div className="flex gap-5">
        <Link href="/privacy" className="text-inherit hover:text-white/80 transition-colors">Privacy</Link>
        <Link href="/terms" className="text-inherit hover:text-white/80 transition-colors">Terms</Link>
        <Link href="/contact" className="text-inherit hover:text-white/80 transition-colors">Contact</Link>
      </div>
    </footer>
  );
}
