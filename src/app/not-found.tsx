import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-bg text-3xl">
          404
        </div>
        <h1 className="mb-2 font-serif text-[28px] font-bold tracking-[-0.02em]">
          Page not found
        </h1>
        <p className="mb-6 max-w-[360px] text-sm leading-[1.6] text-text2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.DASHBOARD}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-accent2"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-border2 bg-transparent px-5 py-[10px] text-[13px] font-semibold text-text transition-all hover:bg-surface2"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
