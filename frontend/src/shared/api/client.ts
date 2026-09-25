import { clearSession, readSession } from "@/shared/auth/session";
import { messages, type Locale } from "@/shared/i18n/messages";
import { apiBaseUrl } from "./base-url";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  locale: Locale = "uz",
): Promise<T> {
  const session = typeof window === "undefined" ? null : readSession();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  if (response.status === 401 && typeof window !== "undefined") clearSession();
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      fieldErrors?: Record<string, string>;
    } | null;
    throw new ApiError(
      messages[locale].requestFailed,
      response.status,
      payload?.code,
      payload?.fieldErrors,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
