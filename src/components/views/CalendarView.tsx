import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}

interface RepoStat {
  name: string;
  openPRs: number;
  merged: number;
}

/** Extract machine-readable stats embedded by the status-ingest API. */
function parseStatusStats(issue: Issue): RepoStat[] {
  const m = issue.description.match(/<!--status-stats:(.*?)-->/s);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed.repos)) return parsed.repos;
  } catch {
    /* ignore malformed stats */
  }
  return [];
}

/** Strip the embedded stats marker so it never renders as text. */
function cleanStatusDescription(issue: Issue): string {
  return issue.description.replace(/\n\n<!--status-stats:.*?-->/s, '').trim();
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dueKey(iso?: string): string | null {
  if (!iso) return null;
  // Date-only strings (YYYY-MM-DD) are calendar days, not UTC instants:
  // parsing via `new Date(iso)` shifts them a day back for timezones
  // behind UTC. Use the date part directly.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(iso);
  return isNaN(+d) ? null : dayKey(d);
}
function prettyDay(k: string): string {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Full status report card, as shown when a calendar day is opened. */
function FullReportCard({ issue }: { issue: Issue }) {
  const stats = parseStatusStats(issue);
  const maxVal = Math.max(1, ...stats.flatMap((s) => [s.openPRs, s.merged]));
  const barH = 26;
  const gap = 14;
  const labelW = 170;
  const chartH = stats.length * (barH + gap);

  return (
    <div className="rounded-lg border border-[var(--chrome)] bg-[var(--bg-raised)]/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{issue.title}</h3>
        <span className="text-[11px] font-mono text-[var(--text-faint)] shrink-0">{issue.key}</span>
      </div>

      {stats.length > 0 && (
        <div className="my-4">
          <svg
            width="100%"
            height={chartH + 30}
            viewBox={`0 0 600 ${chartH + 30}`}
            className="w-full"
            role="img"
            aria-label="Per-repo open PRs and merges"
          >
            {stats.map((s, i) => {
              const y = i * (barH + gap);
              const openW = (s.openPRs / maxVal) * (600 - labelW - 60);
              const mergedW = (s.merged / maxVal) * (600 - labelW - 60);
              return (
                <g key={s.name}>
                  <text x={0} y={y + barH / 2 + 4} fontSize="12" fill="currentColor" opacity="0.8">
                    {s.name}
                  </text>
                  <rect x={labelW} y={y} width={Math.max(openW, 2)} height={barH / 2 - 2} rx={3} fill="#f59e0b" opacity="0.85">
                    <title>{s.openPRs} open PRs</title>
                  </rect>
                  <rect x={labelW} y={y + barH / 2 + 2} width={Math.max(mergedW, 2)} height={barH / 2 - 2} rx={3} fill="#22c55e" opacity="0.85">
                    <title>{s.merged} merged</title>
                  </rect>
                  <text x={labelW + Math.max(openW, mergedW) + 8} y={y + barH / 2 + 4} fontSize="11" fill="currentColor" opacity="0.6">
                    {s.openPRs} open · {s.merged} merged
                  </text>
                </g>
              );
            })}
            <g fontSize="11" fill="currentColor" opacity="0.6">
              <rect x={labelW} y={chartH + 8} width={12} height={12} rx={3} fill="#f59e0b" />
              <text x={labelW + 18} y={chartH + 18}>Open PRs</text>
              <rect x={labelW + 100} y={chartH + 8} width={12} height={12} rx={3} fill="#22c55e" />
              <text x={labelW + 118} y={chartH + 18}>Merged</text>
            </g>
          </svg>
        </div>
      )}

      <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
        {cleanStatusDescription(issue)}
      </div>
    </div>
  );
}

/** Day-detail overlay: click any calendar day → everything due that day, reports fully expanded. */
function DayDetail({
  day,
  issues,
  onClose,
  onIssueClick,
}: {
  day: string;
  issues: Issue[];
  onClose: () => void;
  onIssueClick: (issue: Issue) => void;
}) {
  const reports = issues.filter((i) => i.labels.includes('status-report'));
  const others = issues.filter((i) => !i.labels.includes('status-report'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={prettyDay(day)}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--chrome)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">{prettyDay(day)}</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              {issues.length} item{issues.length === 1 ? '' : 's'} due
              {reports.length > 0 && ` · ${reports.length} report${reports.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close day details"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] motion-press"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {reports.map((r) => (
            <FullReportCard key={r.id} issue={r} />
          ))}
          {others.map((issue) => (
            <button
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--chrome)] bg-[var(--bg-raised)]/40 hover:bg-[var(--accent)]/10 text-left motion-press"
            >
              <IssueTypeIcon type={issue.type} size={14} />
              <span className="text-[12px] font-mono text-[var(--text-faint)] shrink-0">{issue.key}</span>
              <span className="truncate text-[13.5px] text-[var(--text-secondary)]">{issue.title}</span>
            </button>
          ))}
          {issues.length === 0 && (
            <p className="text-[13px] text-[var(--text-muted)] text-center py-6">
              Nothing due this day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ project, onIssueClick }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const today = dayKey(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of project.issues) {
      if (issue.archived) continue;
      const k = dueKey(issue.dueDate);
      if (!k) continue;
      const arr = map.get(k) ?? [];
      arr.push(issue);
      map.set(k, arr);
    }
    return map;
  }, [project.issues]);

  const cells = useMemo(() => {
    // Monday-first grid covering the month.
    const first = startOfMonth(month);
    const lead = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(start.getDate() - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [month]);

  const datedCount = useMemo(() => {
    let n = 0;
    for (const arr of byDay.values()) n += arr.length;
    return n;
  }, [byDay]);

  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedIssues = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">{monthLabel}</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              {datedCount} issue{datedCount === 1 ? '' : 's'} with due dates · click a day for the full report
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] motion-press"
            >
              Today
            </button>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {datedCount === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} />}
            title="No due dates yet"
            hint="Set a due date on an issue and it'll appear on this calendar."
          />
        ) : (
          <div className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)]/40 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[var(--chrome)]">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)] text-center"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const k = dayKey(d);
                const inMonth = d.getMonth() === month.getMonth();
                const issues = byDay.get(k) ?? [];
                const isToday = k === today;
                const hasReport = issues.some((x) => x.labels.includes('status-report'));
                return (
                  <div
                    key={i}
                    onClick={() => issues.length > 0 && setSelectedDay(k)}
                    className={`min-h-[88px] sm:min-h-[104px] p-1.5 border-b border-r border-[var(--bg-raised)] [&:nth-child(7n)]:border-r-0 ${
                      inMonth ? '' : 'opacity-40'
                    } ${issues.length > 0 ? 'cursor-pointer hover:bg-[var(--accent)]/5' : ''} ${
                      hasReport ? 'bg-[var(--accent)]/[0.04]' : ''
                    }`}
                    role={issues.length > 0 ? 'button' : undefined}
                    aria-label={issues.length > 0 ? `${prettyDay(k)}: ${issues.length} items` : undefined}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium mb-1 ${
                        isToday
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                    <div className="space-y-1">
                      {issues.slice(0, 3).map((issue) => (
                        <button
                          key={issue.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onIssueClick(issue);
                          }}
                          title={`${issue.key}: ${issue.title}`}
                          className="w-full flex items-center gap-1 px-1.5 py-1 rounded-md bg-[var(--bg-raised)] hover:bg-[var(--accent)]/20 text-left motion-press"
                        >
                          <IssueTypeIcon type={issue.type} size={12} />
                          <span className="truncate text-[11.5px] text-[var(--text-secondary)]">
                            {issue.key}
                          </span>
                        </button>
                      ))}
                      {issues.length > 3 && (
                        <span className="block text-[11px] text-[var(--text-faint)] px-1">
                          +{issues.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDay && (
        <DayDetail
          day={selectedDay}
          issues={selectedIssues}
          onClose={() => setSelectedDay(null)}
          onIssueClick={(issue) => {
            setSelectedDay(null);
            onIssueClick(issue);
          }}
        />
      )}
    </div>
  );
}
