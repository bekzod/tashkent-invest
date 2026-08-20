import { api } from "@/shared/api/client";
import type {
  AdminObject,
  AdminObjectPayload,
  AdminObjectsListResponse,
  AdminObjectsMeta,
} from "./types";

type AdminObjectListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
};

function listQuery(params: AdminObjectListParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.status) search.set("status", params.status);
  const value = search.toString();
  return value ? `?${value}` : "";
}

type AdminObjectsApiResponse = AdminObjectsListResponse | AdminObject[] | null | undefined;

function fallbackMeta(
  items: AdminObject[],
  params: AdminObjectListParams = {},
): AdminObjectsMeta {
  const limit = params.limit || Math.max(items.length, 10);
  const total = items.length;
  return {
    page: params.page || 1,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function normalizeListResponse(
  response: AdminObjectsApiResponse,
  params?: AdminObjectListParams,
): AdminObjectsListResponse {
  if (Array.isArray(response)) {
    return { items: response, meta: fallbackMeta(response, params) };
  }

  const items = Array.isArray(response?.items) ? response.items : [];
  const defaults = fallbackMeta(items, params);
  return {
    items,
    meta: {
      page: response?.meta?.page || defaults.page,
      limit: response?.meta?.limit || defaults.limit,
      total: response?.meta?.total ?? defaults.total,
      totalPages: response?.meta?.totalPages || defaults.totalPages,
    },
  };
}

export const adminObjectsApi = {
  list: async (params?: AdminObjectListParams) =>
    normalizeListResponse(
      await api<AdminObjectsApiResponse>(`/admin/objects${listQuery(params)}`),
      params,
    ),
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
