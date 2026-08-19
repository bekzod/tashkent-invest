import type { ReactNode } from "react";
import { AdminGuard } from "@/features/admin-objects/admin-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
