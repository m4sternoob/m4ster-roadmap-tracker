import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CUSTOM_VAR_NAMES, generateThemeVars, normalizeHex } from '@/components/ui/colorUtils';
import { applyIconPack } from '@/components/ui/iconPack';

export const THEMES = [
  { id: 'midnight', name: 'Midnight', swatch: '#0c66e4' },
  { id: 'ocean', name: 'Ocean', swatch: '#0ea5e9' },
  { id: 'ember', name: 'Ember', swatch: '#f97316' },
  { id: 'forest', name: 'Forest', swatch: '#22c55e' },
  { id: 'violet', name: 'Violet', swatch: '#8b5cf6' },
  { id: 'porcelain', name: 'Porcelain', swatch: '#e2e8f0' },
  { id: 'crimson', name: 'Crimson', swatch: '#ef4444' },
  { id: 'gold', name: 'Gold', swatch: '#f59e0b' },
  { id: 'rose', name: 'Rose', swatch: '#ec4899' },
  { id: 'mint', name: 'Mint', swatch: '#14b8a6' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/** A user-built theme: three choices generate the full palette. */
export interface CustomTheme {
  id: string;
  name: string;
  accent: string;
  bg: string;
  dark: boolean;
  custom: true;
  swatch: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  swatch: string;
  custom?: boolean;
}

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));
const STORAGE_KEY = 'm4ster-theme';
const CUSTOM_KEY = 'mt_custom_themes_v1';

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
  themes: ThemeOption[];
  customThemes: CustomTheme[];
  saveCustomTheme: (name: string, accent: string, bg: string, dark: boolean) => string;
  deleteCustomTheme: (id: string) => void;
  /** Live-preview a draft without persisting it (custom theme builder). */
  previewCustomTheme: (accent: string, bg: string, dark: boolean) => void;
  /** Drop the preview and re-apply the actual selected theme. */
  cancelPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadCustomThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomTheme[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t) =>
          t &&
          typeof t.id === 'string' &&
          typeof t.name === 'string' &&
          normalizeHex(t.accent) &&
          normalizeHex(t.bg)
      )
      .map((t) => ({
        id: t.id,
        name: t.name.slice(0, 24),
        accent: normalizeHex(t.accent) as string,
        bg: normalizeHex(t.bg) as string,
        dark: t.dark !== false,
        custom: true as const,
        swatch: normalizeHex(t.accent) as string,
      }));
  } catch {
    return [];
  }
}

function persistCustomThemes(list: CustomTheme[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // Private mode — the theme still works for this session.
  }
}

function readStoredTheme(customs: CustomTheme[]): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Migrate the old binary theme values.
    if (stored === 'dark') return 'midnight';
    if (stored === 'light') return 'porcelain';
    if (stored && (THEME_IDS.has(stored) || customs.some((c) => c.id === stored))) return stored;
  } catch {
    // Private mode / storage blocked — fall through to default.
  }
  return 'midnight';
}

/** Apply a variable map as the active custom theme. */
function applyCustomVars(vars: Record<string, string>, dark: boolean) {
  const root = document.documentElement;
  root.dataset.theme = 'custom';
  for (const name of CUSTOM_VAR_NAMES) {
    const value = vars[name];
    if (value !== undefined) root.style.setProperty(name, value);
  }
  root.classList.toggle('dark', dark);
}

function clearCustomVars() {
  const root = document.documentElement;
  for (const name of CUSTOM_VAR_NAMES) root.style.removeProperty(name);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [customs, setCustoms] = useState<CustomTheme[]>(loadCustomThemes);
  const [theme, setThemeState] = useState<string>(() => readStoredTheme(loadCustomThemes()));

  const applyThemeById = (id: string, list: CustomTheme[]) => {
    const root = document.documentElement;
    const custom = list.find((c) => c.id === id);
    if (custom) {
      applyCustomVars(generateThemeVars(custom.accent, custom.bg, custom.dark), custom.dark);
    } else {
      clearCustomVars();
      root.dataset.theme = THEME_IDS.has(id) ? id : 'midnight';
      root.classList.toggle('dark', id !== 'porcelain');
    }
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore storage failures (private mode).
    }
  };

  useEffect(() => {
    applyThemeById(theme, customs);
    // Re-resolve the icon pack (auto follows the theme's dark/light mode).
    applyIconPack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, customs]);

  const saveCustomTheme = (name: string, accent: string, bg: string, dark: boolean): string => {
    const cleanName = name.trim().slice(0, 24) || 'My theme';
    const cleanAccent = normalizeHex(accent) ?? '#0c66e4';
    const cleanBg = normalizeHex(bg) ?? (dark ? '#1d2125' : '#f1f2f4');
    const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
    const entry: CustomTheme = {
      id,
      name: cleanName,
      accent: cleanAccent,
      bg: cleanBg,
      dark,
      custom: true,
      swatch: cleanAccent,
    };
    const next = [...customs, entry];
    setCustoms(next);
    persistCustomThemes(next);
    return id;
  };

  const deleteCustomTheme = (id: string) => {
    const next = customs.filter((c) => c.id !== id);
    setCustoms(next);
    persistCustomThemes(next);
    if (theme === id) setThemeState('midnight');
  };

  const previewCustomTheme = (accent: string, bg: string, dark: boolean) => {
    applyCustomVars(generateThemeVars(accent, bg, dark), dark);
  };

  const cancelPreview = () => {
    applyThemeById(theme, customs);
  };

  const themes: ThemeOption[] = [
    ...THEMES.map((t) => ({ id: t.id, name: t.name, swatch: t.swatch })),
    ...customs.map((c) => ({ id: c.id, name: c.name, swatch: c.swatch, custom: true })),
  ];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        themes,
        customThemes: customs,
        saveCustomTheme,
        deleteCustomTheme,
        previewCustomTheme,
        cancelPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
