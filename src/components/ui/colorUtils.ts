/**
 * Tiny hex/HSL color helpers for the custom theme builder.
 * No dependencies — just enough to derive a full theme palette
 * from an accent color + background color + dark/light mode.
 */

export function normalizeHex(input: string): string | null {
  let h = input.trim().toLowerCase();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9a-f]{3}$/.test(h)) {
    h = `#${h
      .slice(1)
      .split('')
      .map((c) => c + c)
      .join('')}`;
  }
  return /^#[0-9a-f]{6}$/.test(h) ? h : null;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HSL {
  const n = normalizeHex(hex) ?? '#0c66e4';
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s));
  l = Math.min(100, Math.max(0, l));
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Shift lightness by percentage points (negative = darker). Clamped 0..100. */
export function shiftLightness(hex: string, amt: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, l + amt);
}

/** Shift hue by degrees. */
export function shiftHue(hex: string, deg: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h + deg, s, l);
}

export function withAlpha(hex: string, alpha: number): string {
  const n = normalizeHex(hex) ?? '#0c66e4';
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build a complete theme variable map from three choices:
 * an accent color, a background color, and dark/light mode.
 * Mirrors the variable set in themes.css so custom themes
 * repaint the whole app exactly like built-ins.
 */
export function generateThemeVars(
  accent: string,
  bg: string,
  dark: boolean
): Record<string, string> {
  const a = normalizeHex(accent) ?? '#0c66e4';
  const b = normalizeHex(bg) ?? (dark ? '#1d2125' : '#f1f2f4');

  const surface = shiftLightness(b, dark ? 4 : 3.5);
  const raised = shiftLightness(b, dark ? 9 : 1.5);
  const sunken = shiftLightness(b, dark ? 2.5 : -4);
  const deep = shiftLightness(b, dark ? -2.5 : -8);
  const chrome = shiftLightness(b, dark ? 15 : -17);

  const text = dark
    ? {
        primary: '#e9eef4',
        secondary: '#b7c3d1',
        muted: '#8c9aab',
        faint: '#5f6b7d',
      }
    : {
        primary: '#172b4d',
        secondary: '#44546f',
        muted: '#626f86',
        faint: '#8993a4',
      };

  return {
    'color-scheme': dark ? 'dark' : 'light',
    '--bg-app': b,
    '--bg-surface': surface,
    '--bg-raised': raised,
    '--bg-sunken': sunken,
    '--bg-deep': deep,
    '--chrome': chrome,
    '--text-primary': text.primary,
    '--text-secondary': text.secondary,
    '--text-muted': text.muted,
    '--text-faint': text.faint,
    '--accent': a,
    '--accent-bright': shiftLightness(a, 12),
    '--accent-deep': shiftLightness(a, -14),
    '--accent-soft': withAlpha(a, 0.14),
    '--danger': '#e5493a',
    '--info': '#0ea5e9',
    '--success': dark ? '#36b37e' : '#1f8455',
    '--muted-foreground': text.muted,
    '--orb-1': a,
    '--orb-2': shiftHue(a, 45),
    '--orb-3': shiftHue(a, -45),
    '--orb-opacity': dark ? '0.5' : '0.7',
  };
}

/** Every variable generateThemeVars() sets — used to clear custom themes. */
export const CUSTOM_VAR_NAMES = [
  'color-scheme',
  '--bg-app',
  '--bg-surface',
  '--bg-raised',
  '--bg-sunken',
  '--bg-deep',
  '--chrome',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-faint',
  '--accent',
  '--accent-bright',
  '--accent-deep',
  '--accent-soft',
  '--danger',
  '--info',
  '--success',
  '--muted-foreground',
  '--orb-1',
  '--orb-2',
  '--orb-3',
  '--orb-opacity',
];
