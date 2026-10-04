'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardGuard } from '@/features/admin-objects/admin-dashboard-guard';
import { adminObjectsApi } from '@/features/admin-objects/api';
import { ObjectEditor } from '@/features/admin-objects/object-editor';
import type { AdminObject } from '@/features/admin-objects/types';
import { useLanguage } from '@/shared/i18n/language-provider';
import { ErrorState } from '@/shared/ui/error-state';
import { PageLayout } from '@/shared/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditDashboardObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const [object, setObject] = useState<AdminObject | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void params
      .then(({ id }) => adminObjectsApi.get(id))
      .then((value) => { if (active) setObject(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [params]);
  return <AdminDashboardGuard activeSection="projects">{object ? <ObjectEditor object={object} /> : <PageLayout>{failed ? <ErrorState title={t('dataLoadFailed')} /> : <Skeleton className="h-96 w-full" aria-label={t('objectLoading')} />}</PageLayout>}</AdminDashboardGuard>;
}
