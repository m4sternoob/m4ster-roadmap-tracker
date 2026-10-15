/**
 * Aura settings — user customization for the LiveBackground aurora.
 * Persisted to localStorage; LiveBackground subscribes via onAuraSettingsChange
 * and applies them live without a reload.
 */

export interface AuraSettings {
  /** Aurora orbs on/off. */
  enabled: boolean;
  /** 0..1 — orb opacity/size multiplier. */
  intensity: number;
  /** 0..2 — orb drift speed multiplier (0 = frozen). */
  speed: number;
  /** Soft glow that follows the cursor/finger. */
  glow: boolean;
  /** Expanding ring on tap/click. */
  ripples: boolean;
}

export const AURA_DEFAULTS: AuraSettings = {
  enabled: true,
  intensity: 0.7,
  speed: 1,
  glow: true,
  ripples: true,
};

const STORAGE_KEY = 'mt_aura_v1';
const EVENT_NAME = 'mt:aura-change';

function sanitize(raw: unknown): AuraSettings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<AuraSettings>;
  const clamp = (v: unknown, min: number, max: number, fb: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fb;
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : AURA_DEFAULTS.enabled,
    intensity: clamp(r.intensity, 0, 1, AURA_DEFAULTS.intensity),
    speed: clamp(r.speed, 0, 2, AURA_DEFAULTS.speed),
    glow: typeof r.glow === 'boolean' ? r.glow : AURA_DEFAULTS.glow,
    ripples: typeof r.ripples === 'boolean' ? r.ripples : AURA_DEFAULTS.ripples,
  };
}

export function loadAuraSettings(): AuraSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...AURA_DEFAULTS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...AURA_DEFAULTS };
  }
}

export function saveAuraSettings(settings: AuraSettings): void {
  const clean = sanitize(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Non-fatal — the live update below still applies for this session.
  }
  window.dispatchEvent(new CustomEvent<AuraSettings>(EVENT_NAME, { detail: clean }));
}

/** Subscribe to aura changes (fires on every save). Returns an unsubscribe fn. */
export function onAuraSettingsChange(cb: (s: AuraSettings) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<AuraSettings>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
