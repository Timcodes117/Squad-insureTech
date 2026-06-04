"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [session, ready, router]);

  if (!ready) return <FullPageLoader />;
  if (!session) return null;
  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="h-4 w-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        Loading…
      </div>
    </div>
  );
}
