/**
 * Turn a stored upload URL into a same-origin path.
 * The API saves files as http://localhost:8000/uploads/... which the browser
 * often cannot load (localhost prefers IPv6, while the API listens on IPv4).
 * Next proxies /uploads to the API, so the page can request the file on its own host.
 */
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads/')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
