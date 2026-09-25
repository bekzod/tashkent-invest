const internalOrigin = "https://invest-tuman.local";
const authPath = /^\/(?:uz|ru)?\/?(?:login|register)(?:\/|$)/;

export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/dashboard/profile",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value) || /%(?:2f|5c)/i.test(value))
    return fallback;

  try {
    const url = new URL(value, internalOrigin);
    if (url.origin !== internalOrigin || authPath.test(url.pathname))
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function withReturnTo(path: string, returnTo?: string | null): string {
  if (!returnTo) return path;
  const safeValue = safeReturnTo(returnTo, "");
  if (!safeValue) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(safeValue)}`;
}
