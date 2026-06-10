// Public, shareable base URL of the app.
// The Lovable *preview* origin (id-preview--*.lovable.app) requires a Lovable
// login, so any link built from it would wrongly send recipients to Lovable.
// For shareable links we always fall back to the public published domain when
// running inside the preview, while keeping custom domains / production origins.
const PUBLIC_APP_URL = 'https://directly-app.lovable.app';

export function getPublicAppUrl(): string {
  if (typeof window === 'undefined') return PUBLIC_APP_URL;
  const origin = window.location.origin;
  // Preview/sandbox hosts are not publicly accessible — use the published URL.
  if (origin.includes('id-preview--') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return PUBLIC_APP_URL;
  }
  return origin;
}

// Build a full shareable link to an in-app path (path must start with "/").
export function buildShareLink(path: string): string {
  const base = getPublicAppUrl().replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
