'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardGuard } from '@/features/admin-objects/admin-dashboard-guard';
import { adminObjectsApi } from '@/features/admin-objects/api';
import { ObjectEditor } from '@/features/admin-objects/object-editor';
import type { AdminObject } from '@/features/admin-objects/types';
import { useLanguage } from '@/shared/i18n/language-provider';

export default function EditDashboardObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const [object, setObject] = useState<AdminObject | null>(null);
  useEffect(() => { void params.then(({ id }) => adminObjectsApi.get(id).then(setObject)); }, [params]);
  return <AdminDashboardGuard activeSection="projects">{object ? <ObjectEditor object={object} /> : <main className="dashboard-route-page">{t('objectLoading')}</main>}</AdminDashboardGuard>;
}
