'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { readSession, type Session } from '@/shared/auth/session';
import type { DashboardSection } from '@/shared/lib/dashboard';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { useLanguage } from '@/shared/i18n/language-provider';
import { localizedPath } from '@/shared/i18n/routing';
import { DashboardLoadingShell, dashboardLoadingPreset } from '@/shared/ui/dashboard-loading';

export function AdminDashboardGuard({ activeSection, children }: { activeSection: DashboardSection; children: ReactNode }) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace(localizedPath(locale, '/login'));
      return;
    }
    if (current.user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    queueMicrotask(() => setSession(current));
  }, [locale, router]);

  if (!session) return <DashboardLoadingShell label={t('dashboardLoading')} preset={dashboardLoadingPreset(activeSection)} />;
  return <DashboardShell activeSection={activeSection} role="admin" session={session}>{children}</DashboardShell>;
}
