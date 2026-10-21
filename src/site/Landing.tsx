import { useEffect, useState } from 'react';
import {
  Apple,
  Check,
  Columns3,
  FileDown,
  LayoutGrid,
  Monitor,
  MonitorDown,
  Palette,
  Smartphone,
  Users,
} from 'lucide-react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LogoMark } from '@/components/ui/LogoMark';
import { PRO_FEATURE_LIST, PRO_PRICE } from '@/lib/plan';

/**
 * Public marketing site served at the bare `/` route. The tracker app itself
 * lives at `/app` (and on every workspace/invite URL) — see src/Root.tsx.
 *
 * Business design only: the app's theme variables, no aura/orb effects,
 * subtle hover transitions. Saved themes apply because the page is wrapped
 * in ThemeProvider exactly like the app.
 */

const REPO_URL = 'https://github.com/m4sternoob/m4ster-roadmap-tracker';
const DESKTOP_RELEASES_API =
  'https://api.github.com/repos/m4sternoob/m4ster-tracker-desktop/releases/latest';

/* ---------------------------------- plans --------------------------------- */

const FREE_FEATURES = [
  'Board + List views',
  '1 project, core tracking',
  'Midnight + Porcelain themes',
  'Local data on your device',
];

const TEAM_FEATURES = [
  'Everything in Pro',
  'Shared boards with invite links',
  'Live presence + team chat',
  'One flat price per workspace — never per seat',
];

/* -------------------------------- features -------------------------------- */

const FEATURES = [
  {
    icon: Columns3,
    title: 'Kanban board',
    text: 'Drag-and-drop board with stages from Backlog to Done. The whole board scrolls as one — no scroll traps, no lost cards.',
  },
  {
    icon: LayoutGrid,
    title: 'List, calendar & timeline views',
    text: 'See the same work four ways: a sortable list, a calendar, a timeline, and a workload view so nobody is quietly overloaded.',
  },
  {
    icon: FileDown,
    title: 'Sprints & downloadable reports',
    text: 'Plan sprints, watch the burndown, and export reports as HTML, CSV or JSON — ready to share with anyone, in or out of the app.',
  },
  {
    icon: Users,
    title: 'Real-time multiplayer',
    text: 'Share a board with an invite link and work together live — shared edits, live presence and team chat built right in.',
  },
  {
    icon: Palette,
    title: '10 themes & customization',
    text: 'Ten built-in themes, icon packs, a custom theme builder and saved profiles. Make the workspace look like yours.',
  },
  {
    icon: MonitorDown,
    title: 'PWA — installable, works on every device',
    text: 'Install it straight from the browser on any device. It runs full-screen like a native app and keeps your boards in sync.',
  },
];

/* ------------------------------ board preview ----------------------------- */

const PREVIEW_COLUMNS: { name: string; dot: string; cards: { title: string; tag: string }[] }[] = [
  {
    name: 'To Do',
    dot: 'var(--text-faint)',
    cards: [
      { title: 'Design the new onboarding flow', tag: 'Design' },
      { title: 'Write launch announcement', tag: 'Docs' },
    ],
  },
  {
    name: 'In Progress',
    dot: 'var(--accent)',
    cards: [
      { title: 'Fix checkout double-submit', tag: 'Bug' },
      { title: 'API rate limits for exports', tag: 'Backend' },
      { title: 'Empty-state illustrations', tag: 'Design' },
    ],
  },
  {
    name: 'Done',
    dot: 'var(--success)',
    cards: [
      { title: 'Sprint 12 retrospective', tag: 'Team' },
      { title: 'Dark theme polish pass', tag: 'Design' },
    ],
  },
];

function BoardPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-2xl p-3 sm:p-4 select-none"
    >
      <div className="grid grid-cols-3 gap-3">
        {PREVIEW_COLUMNS.map((col) => (
          <div key={col.name} className="rounded-xl bg-[var(--bg-app)] p-2.5 min-w-0">
            <div className="flex items-center gap-2 px-1 pb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: col.dot }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] truncate">
                {col.name}
              </span>
              <span className="ml-auto text-[11px] text-[var(--text-faint)]">
                {col.cards.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg bg-[var(--bg-raised)] border border-[var(--chrome)] p-2.5"
                >
                  <p className="text-[12px] leading-snug text-[var(--text-primary)]">
                    {card.title}
                  </p>
                  <span className="inline-block mt-2 rounded-full bg-[var(--accent-soft)] text-[var(--accent-bright)] px-2 py-0.5 text-[10px] font-medium">
                    {card.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- downloads ------------------------------- */

interface DownloadState {
  url: string | null;
  version: string | null;
}

const PLATFORMS = [
  { key: 'windows', label: 'Windows', ext: '.exe', icon: Monitor, note: '.exe installer' },
  { key: 'macos', label: 'macOS', ext: '.dmg', icon: Apple, note: '.dmg disk image' },
  { key: 'android', label: 'Android', ext: '.apk', icon: Smartphone, note: '.apk package' },
] as const;

function DownloadSection() {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(DESKTOP_RELEASES_API, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) return;
        const release = (await res.json()) as {
          tag_name?: string;
          assets?: { name: string; browser_download_url: string }[];
        };
        if (cancelled || !release.assets) return;
        const next: Record<string, DownloadState> = {};
        for (const platform of PLATFORMS) {
          const asset = release.assets.find((a) =>
            a.name.toLowerCase().includes(platform.ext)
          );
          next[platform.key] = {
            url: asset ? asset.browser_download_url : null,
            version: asset ? (release.tag_name ?? null) : null,
          };
        }
        setDownloads(next);
      } catch {
        // Offline or API unavailable — buttons stay in the "In development"
        // state below. Never guess a download URL.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const anyMissing = PLATFORMS.some((p) => !downloads[p.key]?.url);

  return (
    <section id="download" className="border-t border-[var(--chrome)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Download M4ster Tracker
        </h2>
        <p className="mt-3 text-[15px] text-[var(--text-secondary)] max-w-xl mx-auto">
          Native apps for your desktop and phone — same boards, same account.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-2xl mx-auto">
          {PLATFORMS.map((platform) => {
            const state = downloads[platform.key];
            const Icon = platform.icon;
            if (state?.url) {
              return (
                <a
                  key={platform.key}
                  href={state.url}
                  className="flex-1 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] px-5 py-4 flex items-center gap-3 text-left transition hover:border-[var(--accent)]"
                >
                  <Icon size={26} className="shrink-0 text-[var(--accent-bright)]" />
                  <span>
                    <span className="block text-[14px] font-semibold text-[var(--text-primary)]">
                      {platform.label}
                    </span>
                    <span className="block text-[12px] text-[var(--text-muted)]">
                      {state.version ? `${state.version} · ` : ''}
                      {platform.note}
                    </span>
                  </span>
                </a>
              );
            }
            return (
              <button
                key={platform.key}
                type="button"
                disabled
                className="flex-1 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] px-5 py-4 flex items-center gap-3 text-left opacity-60 cursor-not-allowed"
              >
                <Icon size={26} className="shrink-0 text-[var(--text-faint)]" />
                <span>
                  <span className="block text-[14px] font-semibold text-[var(--text-primary)]">
                    {platform.label}
                  </span>
                  <span className="block text-[12px] text-[var(--text-muted)]">
                    In development
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {anyMissing && (
          <p className="mt-4 text-[12.5px] text-[var(--text-faint)] max-w-xl mx-auto">
            Native desktop &amp; mobile apps are in active development — the web app
            above is the full product today.
          </p>
        )}

        <div className="mt-10 mx-auto max-w-2xl rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] px-5 py-4 text-left flex flex-col sm:flex-row sm:items-center gap-3">
          <MonitorDown size={22} className="shrink-0 text-[var(--accent-bright)]" />
          <p className="text-[13.5px] text-[var(--text-secondary)] flex-1">
            <span className="font-semibold text-[var(--text-primary)]">Install App:</span>{' '}
            the web app is a PWA — open it in your browser and choose “Install app” to
            pin it like a native app, no download needed.
          </p>
          <a
            href="/app"
            className="shrink-0 text-[13.5px] font-semibold text-[var(--accent-bright)] hover:underline"
          >
            Open the web app
          </a>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- landing -------------------------------- */

function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--chrome)] bg-[var(--bg-app)]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-[6px] flex items-center justify-center bg-[var(--bg-raised)] border border-[var(--chrome)] text-[var(--accent-bright)]">
              <LogoMark size={19} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">M4ster Tracker</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-[13.5px] text-[var(--text-secondary)]">
            <a href="#features" className="transition hover:text-[var(--text-primary)]">
              Features
            </a>
            <a href="#plans" className="transition hover:text-[var(--text-primary)]">
              Plans
            </a>
            <a href="#download" className="transition hover:text-[var(--text-primary)]">
              Download
            </a>
          </nav>
          <a
            href="/app"
            className="ml-auto h-9 px-4 rounded-full bg-[var(--accent)] text-white text-[13.5px] font-semibold flex items-center transition hover:opacity-90"
          >
            Open Tracker
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 sm:pt-20 sm:pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Project boards for small teams that ship.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-lg">
            Boards, sprints and reports in one calm workspace — free to start, one flat
            price when you grow. No per-seat math, ever.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/app"
              className="h-11 px-6 rounded-full bg-[var(--accent)] text-white text-[14.5px] font-semibold flex items-center transition hover:opacity-90"
            >
              Open Tracker
            </a>
            <a
              href="#download"
              className="h-11 px-6 rounded-full border border-[var(--chrome)] text-[14.5px] font-medium text-[var(--text-primary)] flex items-center transition hover:bg-[var(--bg-raised)]"
            >
              Download apps
            </a>
          </div>
          <p className="mt-4 text-[12.5px] text-[var(--text-faint)]">
            Free forever plan · No sign-up needed to look around · Works in any browser
          </p>
        </div>
        <BoardPreview />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[var(--chrome)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Everything a small team needs
          </h2>
          <p className="mt-3 text-[15px] text-[var(--text-secondary)] max-w-xl">
            The full workflow — plan it, track it, ship it, report on it — without the
            enterprise bloat.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] p-5 transition hover:border-[var(--accent)]"
              >
                <span className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-bright)] flex items-center justify-center">
                  <feature.icon size={20} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="border-t border-[var(--chrome)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Simple pricing, honestly priced
          </h2>
          <p className="mt-3 text-[15px] text-[var(--text-secondary)] max-w-xl">
            One flat yearly price. No per-seat math, no “contact sales”, no enterprise
            tier. Ever.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-4 items-stretch max-w-4xl">
            {/* Free */}
            <div className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] p-5 flex flex-col">
              <div className="text-[15px] font-semibold">Free</div>
              <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
                For trying things out
              </p>
              <div className="mt-3 text-[26px] font-bold">
                $0
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  {' '}
                  forever
                </span>
              </div>
              <ul className="mt-4 space-y-2 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                className="mt-5 w-full h-10 rounded-full border border-[var(--chrome)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center justify-center transition hover:bg-[var(--bg-raised)]"
              >
                Start free
              </a>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-[var(--accent)] bg-[var(--bg-raised)] p-5 flex flex-col overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-[var(--accent)] text-white text-center text-[10.5px] font-bold uppercase tracking-widest py-1">
                Most popular
              </div>
              <div className="mt-4 text-[15px] font-semibold">Pro</div>
              <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
                For makers who ship
              </p>
              <div className="mt-3 text-[26px] font-bold">
                {PRO_PRICE.replace('/year', '')}
                <span className="text-[13px] font-medium text-[var(--text-muted)]">/year</span>
              </div>
              <p className="text-[12px] text-[var(--text-faint)]">
                One price. Every feature. No per-seat math.
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {PRO_FEATURE_LIST.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-[var(--accent-bright)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                className="mt-5 w-full h-10 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold flex items-center justify-center transition hover:opacity-90"
              >
                Go Pro
              </a>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] p-5 flex flex-col">
              <div className="text-[15px] font-semibold">Team</div>
              <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
                Pro, shared with your crew
              </p>
              <div className="mt-3 text-[26px] font-bold">
                {PRO_PRICE.replace('/year', '')}
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  /year flat
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-faint)]">
                Per workspace, not per person.
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {TEAM_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-[var(--accent-bright)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                className="mt-5 w-full h-10 rounded-full border border-[var(--chrome)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center justify-center transition hover:bg-[var(--bg-raised)]"
              >
                Start with Team
              </a>
            </div>
          </div>
        </div>
      </section>

      <DownloadSection />

      {/* Footer */}
      <footer className="border-t border-[var(--chrome)]">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-[6px] flex items-center justify-center bg-[var(--bg-raised)] border border-[var(--chrome)] text-[var(--accent-bright)]">
              <LogoMark size={16} />
            </span>
            <span className="text-[14px] font-semibold tracking-tight">M4ster Tracker</span>
          </a>
          <p className="text-[13px] text-[var(--text-muted)]">
            M4ster Tracker — boards, sprints and reports for small teams.
          </p>
          <div className="sm:ml-auto flex items-center gap-5 text-[13px] text-[var(--text-secondary)]">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--text-primary)]"
            >
              GitHub
            </a>
            <a
              href={`${REPO_URL}/issues`}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--text-primary)]"
            >
              Report an issue
            </a>
            <a href="/app" className="transition hover:text-[var(--text-primary)]">
              Open Tracker
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Landing() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  );
}
