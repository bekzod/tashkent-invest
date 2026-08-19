import { clearSession, readSession } from '@/shared/auth/session';
import type { Locale } from '@/shared/i18n/messages';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function api<T>(path: string, options: RequestInit = {}, locale: Locale = 'uz'): Promise<T> {
  const session = typeof window === 'undefined' ? null : readSession();
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', 'Accept-Language': locale, ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...options.headers }, cache: 'no-store' });
  if (response.status === 401 && typeof window !== 'undefined') clearSession();
  if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new ApiError(payload.error || 'Request failed', response.status); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

