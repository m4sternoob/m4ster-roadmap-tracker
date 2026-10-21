/**
 * Workspace slug helpers.
 *
 * `/`                → the default workspace (current local behavior)
 * `/m4sterpersonal`  → a named workspace that syncs across devices
 */

export const DEFAULT_SLUG = 'default';
const SLUG_RE = /^[a-z0-9-_]{1,32}$/i;

/** Read the workspace slug from the current URL path. */
export function getWorkspaceSlug(): string {
  if (typeof window === 'undefined') return DEFAULT_SLUG;
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  if (!seg) return DEFAULT_SLUG;
  // `/app` is the tracker app's front door (the marketing site lives at `/`),
  // never a workspace slug.
  if (seg === 'app') return DEFAULT_SLUG;
  // Ignore well-known non-workspace paths.
  if (seg === 'api' || seg === 'w') {
    const next = window.location.pathname.split('/').filter(Boolean)[1];
    return next && SLUG_RE.test(next) ? next.toLowerCase() : DEFAULT_SLUG;
  }
  return SLUG_RE.test(seg) ? seg.toLowerCase() : DEFAULT_SLUG;
}

/** Local storage key for a workspace's data. */
export function workspaceStorageKey(slug: string): string {
  // Keep the historic key for the default workspace so existing
  // local data keeps working.
  if (slug === DEFAULT_SLUG) return 'm4ster-tracker-project';
  return `m4ster-tracker-workspace:${slug}`;
}

/** A stable per-device id for last-write-wins bookkeeping. */
export function getDeviceId(): string {
  try {
    let id = window.localStorage.getItem('m4ster-tracker-device');
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem('m4ster-tracker-device', id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}
