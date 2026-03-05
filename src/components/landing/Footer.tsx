export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-4 bg-text px-4 py-8 text-center text-[13px] text-white/60 sm:flex-row sm:justify-between sm:px-6 sm:text-left md:px-12 md:py-10">
      <div className="font-serif text-lg font-bold text-white">TableTalk</div>
      <div>Made in India 🇮🇳 · © 2026 TableTalk</div>
      <div className="flex gap-5">
        <a className="cursor-pointer text-inherit hover:text-white/80">Privacy</a>
        <a className="cursor-pointer text-inherit hover:text-white/80">Terms</a>
        <a className="cursor-pointer text-inherit hover:text-white/80">Contact</a>
      </div>
    </footer>
  );
}
