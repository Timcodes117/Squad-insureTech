"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { FullPageLoader } from "@/components/AuthGate";

export default function Index() {
  const router = useRouter();
  const { adminKey, ready } = useAuth();
  useEffect(() => {
    if (!ready) return;
    router.replace(adminKey ? "/dashboard" : "/login");
  }, [adminKey, ready, router]);
  return <FullPageLoader />;
}
