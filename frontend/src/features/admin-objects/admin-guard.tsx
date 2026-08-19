"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/shared/auth/session";
import { AdminShell } from "./admin-shell";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = typeof window === "undefined" ? null : readSession();
  useEffect(() => {
    const current = readSession();
    if (!current) router.replace("/login");
    else if (current.user.role !== "admin") router.replace("/dashboard");
  }, [router]);
  if (!session || session.user.role !== "admin")
    return (
      <main className="admin-loading">Admin kabineti tekshirilmoqda…</main>
    );
  return <AdminShell>{children}</AdminShell>;
}
