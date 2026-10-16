import { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Check, Lock, Palette, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePlanStore } from '@/store/planStore';
import { isFreeTheme } from '@/lib/plan';
import { ProGate } from './ProGate';
import {
  AURA_DEFAULTS,
  loadAuraSettings,
  saveAuraSettings,
  type AuraSettings,
} from './auraSettings';
import { normalizeHex } from './colorUtils';

/* ---------- tiny building blocks ---------- */

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
      {children}
    </p>
  );
}

/* ---------- theme profiles (theme + aura snapshots) ---------- */

interface ThemeProfile {
  id: string;
  name: string;
  themeId: string;
  aura: AuraSettings;
}

const PROFILES_KEY = 'mt_theme_profiles_v1';

function loadProfiles(): ThemeProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThemeProfile[];
    return Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
      : [];
  } catch {
    return [];
  }
}

function persistProfiles(list: ThemeProfile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  } catch {
    // Non-fatal.
  }
}

/* ---------- the panel ---------- */

/**
 * Customize panel — theme swatches, a custom theme builder with live
 * preview, theme profiles (theme + aura snapshots), and live controls for
 * the aurora background (the "mouse aura"). Opens from the palette button
 * in the top bar; closes on outside click or Escape.
 */
export function ThemePicker() {
  const {
    theme,
    setTheme,
    themes,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
    previewCustomTheme,
    cancelPreview,
  } = useTheme();
  const [open, setOpen] = useState(false);
  const [aura, setAura] = useState<AuraSettings>(() => loadAuraSettings());
  const rootRef = useRef<HTMLDivElement>(null);

  // Custom theme builder draft.
  const [building, setBuilding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAccent, setDraftAccent] = useState('#0c66e4');
  const [draftBg, setDraftBg] = useState('#1d2125');
  const [draftDark, setDraftDark] = useState(true);
  const [previewing, setPreviewing] = useState(false);

  // Theme profiles.
  const [profiles, setProfiles] = useState<ThemeProfile[]>(() => loadProfiles());
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const closePanel = () => {
    if (previewing) {
      cancelPreview();
      setPreviewing(false);
    }
    setBuilding(false);
    setSavingProfile(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, previewing, building]);

  const patchAura = (patch: Partial<AuraSettings>) => {
    const next = { ...aura, ...patch };
    setAura(next);
    saveAuraSettings(next);
  };

  const resetAura = () => {
    setAura({ ...AURA_DEFAULTS });
    saveAuraSettings({ ...AURA_DEFAULTS });
  };

  /* ----- custom theme builder ----- */

  const startBuilding = () => {
    setDraftName('');
    setDraftAccent('#0c66e4');
    setDraftBg('#1d2125');
    setDraftDark(true);
    setBuilding(true);
  };

  const updateDraft = (patch: { accent?: string; bg?: string; dark?: boolean }) => {
    const accent = patch.accent ?? draftAccent;
    const bg = patch.bg ?? draftBg;
    const dark = patch.dark ?? draftDark;
    if (patch.accent !== undefined) setDraftAccent(patch.accent);
    if (patch.bg !== undefined) setDraftBg(patch.bg);
    if (patch.dark !== undefined) setDraftDark(patch.dark);
    // Live preview as they pick.
    if (normalizeHex(accent) && normalizeHex(bg)) {
      previewCustomTheme(accent, bg, dark);
      setPreviewing(true);
    }
  };

  const cancelBuilding = () => {
    cancelPreview();
    setPreviewing(false);
    setBuilding(false);
  };

  const saveDraft = () => {
    const id = saveCustomTheme(draftName, draftAccent, draftBg, draftDark);
    setPreviewing(false);
    setBuilding(false);
    setTheme(id);
  };

  /* ----- profiles ----- */

  const saveProfile = () => {
    const name = profileName.trim().slice(0, 24);
    if (!name) return;
    const entry: ThemeProfile = {
      id: crypto.randomUUID(),
      name,
      themeId: theme,
      aura: { ...aura },
    };
    const next = [...profiles, entry];
    setProfiles(next);
    persistProfiles(next);
    setProfileName('');
    setSavingProfile(false);
  };

  const applyProfile = (p: ThemeProfile) => {
    // Theme may have been deleted since the profile was saved.
    const themeExists = themes.some((t) => t.id === p.themeId);
    setTheme(themeExists ? p.themeId : 'midnight');
    const nextAura = { ...AURA_DEFAULTS, ...p.aura };
    setAura(nextAura);
    saveAuraSettings(nextAura);
  };

  const deleteProfile = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    persistProfiles(next);
  };

  const active = themes.find((t) => t.id === theme);
  const builtIns = themes.filter((t) => !t.custom);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => (open ? closePanel() : setOpen(true))}
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
          {/* ---- built-in themes ---- */}
          <section>
            <SectionLabel>Theme</SectionLabel>
            <div className="grid grid-cols-3 gap-1" role="listbox" aria-label="Color themes">
              {builtIns.map((t) => {
                const isActive = t.id === theme;
                const locked = !isFreeTheme(t.id);
                return (
                  <button
                    key={t.id}
                    role="option"
                    aria-selected={isActive}
                    title={locked ? `${t.name} — Pro theme` : t.name}
                    onClick={() => {
                      if (locked) {
                        openUpgrade('theme:extra');
                        return;
                      }
                      setTheme(t.id);
                    }}
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
                    {locked && !isActive && (
                      <Lock
                        size={11}
                        className="absolute top-1 right-1 text-[var(--text-faint)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---- custom themes ---- */}
          <section>
            <ProGate feature="theme:custom" title="Custom themes" blurb="Design your own colors, live preview">
            <SectionLabel>Custom themes</SectionLabel>
            {customThemes.length > 0 && (
              <ul className="space-y-1 mb-2">
                {customThemes.map((t) => {
                  const isActive = t.id === theme;
                  return (
                    <li
                      key={t.id}
                      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 motion-interactive ${
                        isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-raised)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className="flex flex-1 items-center gap-2.5 min-w-0"
                        aria-pressed={isActive}
                        title={`Apply ${t.name}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full shrink-0 ring-2 ${
                            isActive ? 'ring-[var(--accent-bright)]' : 'ring-[var(--chrome)]'
                          }`}
                          style={{ backgroundColor: t.swatch }}
                          aria-hidden="true"
                        />
                        <span
                          className={`truncate text-[13px] ${
                            isActive
                              ? 'text-[var(--text-primary)] font-medium'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {t.name}
                        </span>
                        {isActive && (
                          <Check size={14} className="text-[var(--accent-bright)] shrink-0" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomTheme(t.id)}
                        aria-label={`Delete ${t.name}`}
                        title="Delete custom theme"
                        className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 focus:opacity-100 motion-press shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {building ? (
              <div className="rounded-lg border border-[var(--chrome)] p-3 space-y-3 bg-[var(--bg-sunken)]/50">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Theme name (e.g. Sunset)"
                  maxLength={24}
                  aria-label="Custom theme name"
                  className="w-full rounded-lg border border-[var(--chrome)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-bright)]"
                />
                <div className="space-y-2">
                  {(
                    [
                      { label: 'Accent', value: draftAccent, key: 'accent' },
                      { label: 'Background', value: draftBg, key: 'bg' },
                    ] as const
                  ).map(({ label, value, key }) => (
                    <label key={key} className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={normalizeHex(value) ?? '#0c66e4'}
                        onChange={(e) => updateDraft({ [key]: e.target.value })}
                        aria-label={`${label} color`}
                        className="w-9 h-8 rounded-md cursor-pointer bg-transparent p-0 border border-[var(--chrome)]"
                      />
                      <span className="text-[12.5px] text-[var(--text-secondary)] font-medium flex-1">
                        {label}
                      </span>
                      <span className="text-[11.5px] text-[var(--text-faint)] font-mono uppercase">
                        {value}
                      </span>
                    </label>
                  ))}
                </div>
                <div
                  className="flex rounded-lg bg-[var(--bg-raised)] p-0.5"
                  role="group"
                  aria-label="Color mode"
                >
                  {(['dark', 'light'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateDraft({ dark: m === 'dark' })}
                      aria-pressed={draftDark === (m === 'dark')}
                      className={`flex-1 rounded-md py-1 text-[12.5px] font-medium capitalize motion-press ${
                        draftDark === (m === 'dark')
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[11.5px] text-[var(--text-faint)] leading-snug">
                  Previewing live — save to keep it, cancel to revert.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelBuilding}
                    className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] motion-press flex items-center gap-1"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90 motion-press flex items-center gap-1"
                  >
                    <Check size={13} /> Save theme
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startBuilding}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--chrome)] px-2.5 py-2 text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-bright)] motion-interactive"
              >
                <Plus size={14} /> New custom theme
              </button>
            )}
            </ProGate>
          </section>

          <div className="h-px bg-[var(--chrome)]" aria-hidden="true" />

          {/* ---- theme profiles ---- */}
          <section>
            <ProGate feature="theme:profiles" title="Theme profiles" blurb="Save named theme + aura setups">
            <SectionLabel>Profiles</SectionLabel>
            {profiles.length > 0 && (
              <ul className="space-y-1 mb-2">
                {profiles.map((p) => (
                  <li
                    key={p.id}
                    className="group flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-raised)] motion-interactive"
                  >
                    <button
                      type="button"
                      onClick={() => applyProfile(p)}
                      className="flex-1 truncate text-left text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      title="Apply profile (theme + aura)"
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProfile(p.id)}
                      aria-label={`Delete profile ${p.name}`}
                      className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 focus:opacity-100 motion-press shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {savingProfile ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProfile();
                  }}
                  placeholder="Profile name"
                  maxLength={24}
                  autoFocus
                  aria-label="Profile name"
                  className="flex-1 min-w-0 rounded-lg border border-[var(--chrome)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-bright)]"
                />
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={!profileName.trim()}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90 motion-press disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProfileName('');
                  setSavingProfile(true);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] motion-interactive"
              >
                <BookmarkPlus size={14} /> Save current as profile
              </button>
            )}
            <p className="px-1 pt-1.5 text-[11px] text-[var(--text-faint)] leading-snug">
              A profile captures your theme + aura setup in one tap.
            </p>
            </ProGate>
          </section>

          <div className="h-px bg-[var(--chrome)]" aria-hidden="true" />

          {/* ---- background aura ---- */}
          <section className="space-y-3">
            <ProGate feature="theme:aura" title="Background aura" blurb="Ambient glow behind your board">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                Background aura
              </span>
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
            </ProGate>
          </section>
        </div>
      )}
    </div>
  );
}
