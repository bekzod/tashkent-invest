'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { readSession, type Session } from '@/shared/auth/session';
import type { DashboardSection } from '@/shared/lib/dashboard';
import { DashboardShell } from '@/widgets/dashboard-shell';

export function AdminDashboardGuard({ activeSection, children }: { activeSection: DashboardSection; children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace('/login');
      return;
    }
    if (current.user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    queueMicrotask(() => setSession(current));
  }, [router]);

  if (!session) return <main className="dashboard-route-page">Kabinet yuklanmoqda…</main>;
  return <DashboardShell activeSection={activeSection} role="admin" session={session}>{children}</DashboardShell>;
}
