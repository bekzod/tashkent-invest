"use client";
import { useEffect, useState } from "react";
import { ObjectEditor } from "@/features/admin-objects/object-editor";
import { adminObjectsApi } from "@/features/admin-objects/api";
import type { AdminObject } from "@/features/admin-objects/types";
export default function EditAdminObjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [object, setObject] = useState<AdminObject | null>(null);
  useEffect(() => {
    void params.then(({ id }) => adminObjectsApi.get(id).then(setObject));
  }, [params]);
  return object ? (
    <ObjectEditor object={object} />
  ) : (
    <main className="admin-loading">Obyekt yuklanmoqda…</main>
  );
}
