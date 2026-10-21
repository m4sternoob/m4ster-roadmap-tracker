import { useEffect } from 'react';
import App from './App';
import Landing from './site/Landing';

/**
 * Route split for the single-page bundle (there is no router — Vercel rewrites
 * every non-/api path to index.html, so the path is read once at boot):
 *
 * - Bare `/` with no query string → the public marketing site (Landing).
 * - Everything else boots the tracker app: `/app`, workspace boards at
 *   `/{slug}` and `/w/{slug}`, and ANY URL carrying a query string — invite
 *   links (`/?join=CODE`), OAuth returns (`/?auth=...`), PWA shortcuts
 *   (`/?view=board`) — so existing bookmarks and shared links never land on
 *   the marketing page by accident.
 */
function isAppRoute(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.location.search.length > 1) return true;
  const path = window.location.pathname;
  if (path === '/' || path === '') return false;
  return true;
}

export default function Root() {
  // Tell the boot guard in index.html the bundle mounted. App does this too,
  // but the landing route never mounts App, so without this the guard would
  // flash its "couldn't load" panel over the marketing page after a few
  // seconds.
  useEffect(() => {
    (window as unknown as { __APP_MOUNTED?: boolean }).__APP_MOUNTED = true;
  }, []);

  return isAppRoute() ? <App /> : <Landing />;
}
