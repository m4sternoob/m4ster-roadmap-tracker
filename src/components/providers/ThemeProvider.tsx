import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const THEMES = [
  { id: 'midnight', name: 'Midnight', swatch: '#0c66e4' },
  { id: 'ocean', name: 'Ocean', swatch: '#0ea5e9' },
  { id: 'ember', name: 'Ember', swatch: '#f97316' },
  { id: 'forest', name: 'Forest', swatch: '#22c55e' },
  { id: 'violet', name: 'Violet', swatch: '#8b5cf6' },
  { id: 'porcelain', name: 'Porcelain', swatch: '#e2e8f0' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));
const STORAGE_KEY = 'm4ster-theme';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Migrate the old binary theme values.
    if (stored === 'dark') return 'midnight';
    if (stored === 'light') return 'porcelain';
    if (stored && THEME_IDS.has(stored)) return stored as ThemeId;
  } catch {
    // Private mode / storage blocked — fall through to default.
  }
  return 'midnight';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    // `data-theme` drives every CSS variable; the `dark` class keeps
    // Tailwind's `dark:` variants and native form controls in sync.
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme !== 'porcelain');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (private mode).
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
