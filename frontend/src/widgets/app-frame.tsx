"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PublicHeader } from "@/widgets/public-header";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return <>{children}</>;

  return (
    <>
      <PublicHeader />
      {children}
      <footer id="contacts">
        <strong>Invest Tuman</strong>
        <span>© 2026 · Tashkent investment portal</span>
      </footer>
    </>
  );
}
