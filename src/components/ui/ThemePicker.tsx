import { useEffect, useRef, useState } from 'react';
import { Check, Palette, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  AURA_DEFAULTS,
  loadAuraSettings,
  saveAuraSettings,
  type AuraSettings,
} from './auraSettings';

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-150 motion-press shrink-0 ${
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-raised)]'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--text-secondary)] font-medium">{label}</span>
        <span className="text-[var(--text-faint)] tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 cursor-pointer"
        style={{ accentColor: 'var(--accent-bright)' }}
      />
    </div>
  );
}

/**
 * Customize panel — theme swatches plus live controls for the aurora
 * background (the "mouse aura"). Opens from the palette button in the top
 * bar; closes on outside click or Escape. Aura edits apply instantly.
 */
export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const [aura, setAura] = useState<AuraSettings>(() => loadAuraSettings());
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
  }, [open]);

  const patchAura = (patch: Partial<AuraSettings>) => {
    const next = { ...aura, ...patch };
    setAura(next);
    saveAuraSettings(next);
  };

  const resetAura = () => {
    setAura({ ...AURA_DEFAULTS });
    saveAuraSettings({ ...AURA_DEFAULTS });
  };

  const active = themes.find((t) => t.id === theme);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press flex items-center gap-1.5"
        aria-label="Customize appearance"
        title={`Customize — theme: ${active?.name ?? theme}`}
        aria-expanded={open}
        aria-haspopup="dialog"
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
          role="dialog"
          aria-label="Customize appearance"
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-xl p-3 z-50 animate-scale-in space-y-4 max-h-[80vh] overflow-y-auto"
        >
          <section>
            <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1" role="listbox" aria-label="Color themes">
              {themes.map((t) => {
                const isActive = t.id === theme;
                return (
                  <button
                    key={t.id}
                    role="option"
                    aria-selected={isActive}
                    title={t.name}
                    onClick={() => setTheme(t.id)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-lg px-1 py-2.5 motion-interactive ${
                      isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-raised)]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full ring-2 ${
                        isActive ? 'ring-[var(--accent-bright)]' : 'ring-[var(--chrome)]'
                      }`}
                      style={{ backgroundColor: t.swatch }}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-[11.5px] leading-none ${
                        isActive
                          ? 'text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.name}
                    </span>
                    {isActive && (
                      <Check
                        size={13}
                        className="absolute top-1 right-1 text-[var(--accent-bright)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-[var(--chrome)]" aria-hidden="true" />

          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                Background aura
              </p>
              <Toggle
                checked={aura.enabled}
                onChange={(v) => patchAura({ enabled: v })}
                label="Aurora background"
              />
            </div>

            <div
              className={`space-y-3 px-1 ${aura.enabled ? '' : 'opacity-40 pointer-events-none'}`}
              aria-disabled={!aura.enabled}
            >
              <SliderRow
                label="Intensity"
                value={Math.round(aura.intensity * 100)}
                min={0}
                max={100}
                disabled={!aura.enabled}
                onChange={(v) => patchAura({ intensity: v / 100 })}
                format={(v) => `${v}%`}
              />
              <SliderRow
                label="Motion speed"
                value={Math.round(aura.speed * 50)}
                min={0}
                max={100}
                disabled={!aura.enabled}
                onChange={(v) => patchAura({ speed: v / 50 })}
                format={(v) => (v === 0 ? 'Still' : `${v}%`)}
              />
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[12.5px] text-[var(--text-secondary)] font-medium">
                  Cursor glow
                </span>
                <Toggle
                  checked={aura.glow}
                  onChange={(v) => patchAura({ glow: v })}
                  label="Cursor glow"
                  disabled={!aura.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-[var(--text-secondary)] font-medium">
                  Tap ripples
                </span>
                <Toggle
                  checked={aura.ripples}
                  onChange={(v) => patchAura({ ripples: v })}
                  label="Tap ripples"
                  disabled={!aura.enabled}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={resetAura}
              className="flex items-center gap-1.5 px-1 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] motion-interactive"
            >
              <RotateCcw size={12} />
              Reset aura to defaults
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
