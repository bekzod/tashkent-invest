"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PublicHeader } from "@/widgets/public-header";
import { useLanguage } from "@/shared/i18n/language-provider";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return <>{children}</>;

  return (
    <>
      <PublicHeader />
      {children}
      <footer id="contacts">
        <strong>Invest Tuman</strong>
        <span>© 2026 · {t("portalName")}</span>
      </footer>
    </>
  );
}
