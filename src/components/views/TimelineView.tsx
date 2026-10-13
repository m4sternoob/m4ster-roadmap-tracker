import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, GanttChart } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}

const DAY = 86400000;
const PX_PER_DAY = 9;

function parse(d?: string): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return isNaN(t) ? null : t;
}

export function TimelineView({ project, onIssueClick }: Props) {
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  const rows = useMemo(() => {
    // Sprint lanes first, then issues with any date info.
    const lanes: { label: string; kind: 'sprint' | 'issue'; start: number; end: number; issue?: Issue; color?: string }[] = [];
    for (const s of project.sprints) {
      const a = parse(s.startDate);
      const b = parse(s.endDate);
      if (a === null || b === null) continue;
      lanes.push({ label: s.name, kind: 'sprint', start: a, end: Math.max(b, a + DAY) });
    }
    for (const issue of project.issues) {
      const due = parse(issue.dueDate);
      const created = parse(issue.createdAt) ?? Date.now();
      const start = due !== null ? Math.min(created, due - 3 * DAY) : created;
      const end = due !== null ? due : created + 3 * DAY;
      lanes.push({ label: `${issue.key} ${issue.title}`, kind: 'issue', start, end, issue });
    }
    return lanes.sort((a, b) => a.start - b.start);
  }, [project.issues, project.sprints]);

  const { viewStart, viewEnd } = useMemo(() => {
    const now = Date.now() + offsetWeeks * 7 * DAY;
    return { viewStart: now - 14 * DAY, viewEnd: now + 70 * DAY };
  }, [offsetWeeks]);

  if (rows.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <EmptyState
          icon={<GanttChart size={28} />}
          title="Nothing to plot yet"
          hint="Issues with due dates and sprints with date ranges show up on the timeline."
        />
      </div>
    );
  }

  const totalDays = Math.ceil((viewEnd - viewStart) / DAY);
  const width = totalDays * PX_PER_DAY;
  const todayX = ((Date.now() - viewStart) / DAY) * PX_PER_DAY;

  // Month header ticks
  const ticks: { x: number; label: string }[] = [];
  {
    const d = new Date(viewStart);
    d.setDate(1);
    while (d.getTime() < viewEnd) {
      ticks.push({
        x: ((d.getTime() - viewStart) / DAY) * PX_PER_DAY,
        label: d.toLocaleDateString(undefined, { month: 'short' }),
      });
      d.setMonth(d.getMonth() + 1);
    }
  }

  const STATUS_BAR: Record<string, string> = {
    backlog: 'var(--text-faint)',
    todo: '#0ea5e9',
    'in-progress': '#f59e0b',
    review: '#8b5cf6',
    done: '#22c55e',
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-4">
        <p className="text-[12.5px] text-[var(--text-muted)]">
          {rows.length} lanes · drag the scrollbar to pan
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffsetWeeks(0)}
            className="px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] motion-press"
          >
            Today
          </button>
          <button
            onClick={() => setOffsetWeeks((w) => w - 4)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] motion-press"
            aria-label="Earlier"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setOffsetWeeks((w) => w + 4)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] motion-press"
            aria-label="Later"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto w-full flex-1 overflow-auto rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)]/40">
        <div style={{ width: 260 + width }} className="min-w-full">
          {/* header */}
          <div className="flex sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--chrome)]">
            <div style={{ width: 260 }} className="shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Lane
            </div>
            <div className="relative flex-1 h-8">
              {ticks.map((t, i) => (
                <span
                  key={i}
                  style={{ left: t.x }}
                  className="absolute top-2 text-[11px] font-medium text-[var(--text-faint)] border-l border-[var(--chrome)] pl-1.5"
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          {/* rows */}
          {rows.map((r, i) => {
            const x = Math.max(0, ((r.start - viewStart) / DAY) * PX_PER_DAY);
            const w = Math.max(14, ((r.end - r.start) / DAY) * PX_PER_DAY);
            const barColor = r.kind === 'sprint' ? 'var(--accent)' : STATUS_BAR[r.issue?.status ?? 'todo'];
            return (
              <div key={i} className="flex border-b border-[var(--bg-raised)] last:border-0 hover:bg-[var(--bg-raised)]/30">
                <div style={{ width: 260 }} className="shrink-0 px-3 py-2 truncate text-[12.5px] text-[var(--text-secondary)]">
                  {r.kind === 'sprint' ? (
                    <span className="font-medium text-[var(--accent-bright)]">◆ {r.label}</span>
                  ) : (
                    <button
                      onClick={() => r.issue && onIssueClick(r.issue)}
                      className="truncate hover:text-[var(--text-primary)] hover:underline text-left w-full"
                      title={r.label}
                    >
                      {r.label}
                    </button>
                  )}
                </div>
                <div className="relative flex-1 h-9">
                  {todayX >= 0 && todayX <= width && i === 0 && (
                    <div
                      style={{ left: todayX }}
                      className="absolute top-0 bottom-0 w-px bg-[var(--danger)]/70 z-[5]"
                    />
                  )}
                  <div
                    style={{ left: x, width: w, backgroundColor: barColor }}
                    className={`absolute top-2.5 h-4 rounded-full opacity-80 ${
                      r.kind === 'issue' ? 'cursor-pointer hover:opacity-100' : ''
                    }`}
                    title={`${r.label}\n${new Date(r.start).toLocaleDateString()} → ${new Date(r.end).toLocaleDateString()}`}
                    onClick={() => r.issue && onIssueClick(r.issue)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
