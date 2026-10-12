import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * ThemePicker — a compact popover in the top bar for switching color themes.
 * Closes on outside click or Escape; the choice persists via ThemeProvider.
 */
export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  const active = themes.find((t) => t.id === theme);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press flex items-center gap-1.5"
        aria-label="Change theme"
        title={`Theme: ${active?.name ?? theme}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Palette size={17} />
        <span
          className="w-3.5 h-3.5 rounded-full ring-2 ring-[var(--chrome)]"
          style={{ backgroundColor: active?.swatch }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Color themes"
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-xl p-1.5 z-50 animate-scale-in"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Theme
          </p>
          {themes.map((t) => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] motion-interactive ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 ring-1 ring-[var(--chrome)]"
                  style={{ backgroundColor: t.swatch }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left font-medium">{t.name}</span>
                {isActive && <Check size={15} className="text-[var(--accent-bright)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
