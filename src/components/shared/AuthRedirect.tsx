"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { ROUTES } from "@/lib/routes";

function AuthRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN);
    const isVisit = searchParams.get("ref") === "website";
    if (token && !isVisit) router.replace(ROUTES.DASHBOARD);
  }, [router, searchParams]);

  return null;
}

export default function AuthRedirect() {
  return (
    <Suspense fallback={null}>
      <AuthRedirectInner />
    </Suspense>
  );
}
