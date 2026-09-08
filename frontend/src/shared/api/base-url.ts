const fallbackApiUrl = 'http://localhost:8080/api';

export function resolveApiBaseUrl(
  value = process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl,
) {
  const normalized = value.trim().replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export const apiBaseUrl = resolveApiBaseUrl();
