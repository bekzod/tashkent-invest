'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardGuard } from '@/features/admin-objects/admin-dashboard-guard';
import { adminObjectsApi } from '@/features/admin-objects/api';
import { ObjectEditor } from '@/features/admin-objects/object-editor';
import type { AdminObject } from '@/features/admin-objects/types';

export default function EditDashboardObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [object, setObject] = useState<AdminObject | null>(null);
  useEffect(() => { void params.then(({ id }) => adminObjectsApi.get(id).then(setObject)); }, [params]);
  return <AdminDashboardGuard activeSection="projects">{object ? <ObjectEditor object={object} /> : <main className="dashboard-route-page">Obyekt yuklanmoqda…</main>}</AdminDashboardGuard>;
}
