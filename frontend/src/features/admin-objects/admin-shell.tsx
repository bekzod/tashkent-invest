"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { clearSession, readSession } from "@/shared/auth/session";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session = readSession();
  const nav = [
    {
      href: "/admin",
      label: "Boshqaruv paneli",
      icon: LayoutDashboard,
      exact: true,
    },
    { href: "/admin/objects", label: "Obyektlar", icon: Building2 },
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span>
            <MapPinned size={22} />
          </span>
          <b>
            Invest Tuman<small>ADMIN PANEL</small>
          </b>
        </Link>
        <Link className="admin-sidebar-create" href="/admin/objects/new">
          <Plus size={17} /> Yangi obyekt
        </Link>
        <nav>
          {nav.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={
                (exact ? pathname === href : pathname?.startsWith(href))
                  ? "active"
                  : ""
              }
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <p>
            {session?.user.name || "Administrator"}
            <small>{session?.user.email}</small>
          </p>
          <button
            type="button"
            onClick={() => {
              clearSession();
              window.location.assign("/login");
            }}
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>
      <main className="admin-stage">
        <header>
          <span>
            Hokimlik /{" "}
            <b>
              {pathname?.includes("/objects")
                ? "Obyektlar boshqaruvi"
                : "Boshqaruv paneli"}
            </b>
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}
