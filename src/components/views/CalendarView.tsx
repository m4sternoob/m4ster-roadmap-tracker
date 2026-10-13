import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dueKey(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(+d) ? null : dayKey(d);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({ project, onIssueClick }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = dayKey(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of project.issues) {
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

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">{monthLabel}</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              {datedCount} issue{datedCount === 1 ? '' : 's'} with due dates
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
              onClick={() => setMonth(addMonths(month, -1))}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
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
                return (
                  <div
                    key={i}
                    className={`min-h-[88px] sm:min-h-[104px] p-1.5 border-b border-r border-[var(--bg-raised)] [&:nth-child(7n)]:border-r-0 ${
                      inMonth ? '' : 'opacity-40'
                    }`}
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
                          onClick={() => onIssueClick(issue)}
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
    </div>
  );
}
