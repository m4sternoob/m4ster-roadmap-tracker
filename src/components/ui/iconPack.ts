/**
 * Icon packs — swappable treatments for the logo squares (sidebar, top bar,
 * project header). Packs adapt to the active theme: `auto` follows the
 * theme's dark/light mode, `neon` glows in the theme's accent color.
 */

export type IconPackId = 'auto' | 'dark' | 'light' | 'neon' | 'outline' | 'gradient' | 'glass' | 'hologram';

export const ICON_PACKS: { id: IconPackId; name: string; blurb: string }[] = [
  { id: 'auto', name: 'Auto', blurb: 'Dark on dark themes, light on light' },
  { id: 'dark', name: 'Dark', blurb: 'Solid dark squares' },
  { id: 'light', name: 'Light', blurb: 'Solid light squares' },
  { id: 'neon', name: 'Neon', blurb: 'Dark squares, theme-colored glow' },
  { id: 'outline', name: 'Outline', blurb: 'Accent ring, transparent' },
  { id: 'gradient', name: 'Gradient', blurb: 'Theme accent gradient' },
  { id: 'glass', name: 'Glass', blurb: 'Frosted accent glass' },
  { id: 'hologram', name: 'Hologram', blurb: 'Animated iridescent shimmer' },
];

const STORAGE_KEY = 'mt_icon_pack_v1';
const IDS = new Set<IconPackId>(['auto', 'dark', 'light', 'neon', 'outline', 'gradient', 'glass', 'hologram']);

export function loadIconPack(): IconPackId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && IDS.has(raw as IconPackId)) return raw as IconPackId;
  } catch {
    // Private mode — fall through to default.
  }
  return 'auto';
}

export function saveIconPack(pack: IconPackId): void {
  try {
    localStorage.setItem(STORAGE_KEY, pack);
  } catch {
    // Non-fatal.
  }
  // Sync to cloud (if logged in) — fire-and-forget.
  import('@/lib/prefsSync').then(m => m.syncPrefsToCloud({ iconPack: pack })).catch(() => {});
}

/**
 * Resolve `auto` against the theme's dark/light mode, then set
 * `data-iconpack` on <html>. The CSS variables (--icon-bg, --icon-fg,
 * --icon-glow) do the rest. Call after the theme is applied.
 */
export function applyIconPack(pack: IconPackId = loadIconPack()): void {
  const root = document.documentElement;
  const resolved: Exclude<IconPackId, 'auto'> =
    pack === 'auto' ? (root.classList.contains('dark') ? 'dark' : 'light') : pack;
  root.dataset.iconpack = resolved;
}
