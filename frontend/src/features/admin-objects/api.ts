import { api } from "@/shared/api/client";
import type { AdminObject, AdminObjectPayload } from "./types";

export const adminObjectsApi = {
  list: () => api<{ items: AdminObject[] }>("/admin/objects"),
  get: (id: string) => api<AdminObject>(`/admin/objects/${id}`),
  create: (payload: AdminObjectPayload) =>
    api<AdminObject>("/admin/objects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: AdminObjectPayload) =>
    api<AdminObject>(`/admin/objects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  archive: (id: string) =>
    api<void>(`/admin/objects/${id}`, { method: "DELETE" }),
};
