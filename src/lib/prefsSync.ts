/**
 * User preferences sync — saves theme, iconPack, and aura settings to the
 * backend (tied to Google account) so they sync across devices.
 * Falls back to localStorage when not logged in.
 */

export interface UserPrefs {
  theme?: string;
  iconPack?: string;
  aura?: Record<string, any>;
}

/** Check if the user has an active session (logged in). */
async function isLoggedIn(): Promise<boolean> {
  try {
    const res = await fetch('/api/user/prefs', { method: 'GET', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Push prefs to the backend (if logged in). Fire-and-forget. */
export function syncPrefsToCloud(prefs: UserPrefs): void {
  // Don't await — save to localStorage is the source of truth locally.
  fetch('/api/user/prefs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  }).catch(() => {
    // Non-fatal: localStorage still has it.
  });
}

/**
 * Pull prefs from the backend on login and apply them.
 * Returns the cloud prefs (empty object if not logged in or none saved).
 */
export async function pullPrefsFromCloud(): Promise<UserPrefs> {
  try {
    const res = await fetch('/api/user/prefs', { method: 'GET', credentials: 'include' });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.prefs ?? {}) as UserPrefs;
  } catch {
    return {};
  }
}

export { isLoggedIn };
