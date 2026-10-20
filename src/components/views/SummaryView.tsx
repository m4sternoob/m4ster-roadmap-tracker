import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleDot, ListTodo } from 'lucide-react';
import type { Issue, Project, Status } from '@/types';
import { STATUSES } from '@/types';
import { Avatar } from '@/components/issues/Avatar';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { StatusPill } from '@/components/issues/StatusPill';

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] px-4 py-3.5 depth-card">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-[11.5px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5 text-[26px] font-bold leading-none text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[12px] text-[var(--text-faint)]">{sub}</div>
    </div>
  );
}

/** Project summary — the at-a-glance overview tab (status mix, epics, recent). */
export function SummaryView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const issues = useMemo(() => project.issues.filter((i) => !i.archived), [project.issues]);
  const done = issues.filter((i) => i.status === 'done');
  const active = issues.filter((i) => i.status === 'in-progress' || i.status === 'review');
  const overdue = issues.filter(
    (i) => i.status !== 'done' && i.dueDate && new Date(i.dueDate).getTime() < Date.now()
  );
  const totalPoints = issues.reduce((n, i) => n + i.storyPoints, 0);
  const donePoints = done.reduce((n, i) => n + i.storyPoints, 0);
  const pct = issues.length ? Math.round((done.length / issues.length) * 100) : 0;

  const byStatus = STATUSES.map((s) => ({
    ...s,
    count: issues.filter((i) => i.status === s.value).length,
  }));

  const epics = (project.epics ?? []).map((e) => {
    const items = issues.filter((i) => i.epicId === e.id);
    const d = items.filter((i) => i.status === 'done').length;
    return { ...e, total: items.length, doneCount: d, pct: items.length ? Math.round((d / items.length) * 100) : 0 };
  });

  const recent = [...issues].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={<ListTodo size={15} />} label="Work items" value={issues.length} sub={`${done.length} completed · ${pct}%`} />
        <StatCard icon={<CircleDot size={15} />} label="In progress" value={active.length} sub="Across board + review" />
        <StatCard icon={<CheckCircle2 size={15} />} label="Story points done" value={`${donePoints}/${totalPoints}`} sub={totalPoints ? `${Math.round((donePoints / totalPoints) * 100)}% of estimated work` : 'No estimates yet'} />
        <StatCard icon={<AlertTriangle size={15} />} label="Overdue" value={overdue.length} sub={overdue.length ? 'Needs attention' : 'Nothing overdue'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <section className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Status overview</h3>
          <div className="space-y-2.5">
            {byStatus.map((s) => (
              <div key={s.value} className="flex items-center gap-3">
                <span className="w-24 text-[12.5px] text-[var(--text-muted)]">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-raised)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] animate-bar-grow"
                    style={{ width: issues.length ? `${(s.count / issues.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-8 text-right text-[12.5px] font-medium text-[var(--text-secondary)]">{s.count}</span>
              </div>
            ))}
          </div>
          {epics.length > 0 && (
            <>
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mt-5 mb-3">Epics</h3>
              <div className="space-y-2.5">
                {epics.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="w-28 text-[12.5px] text-[var(--text-muted)] truncate">{e.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--bg-raised)] overflow-hidden">
                      <div className="h-full rounded-full animate-bar-grow" style={{ width: `${e.pct}%`, backgroundColor: e.color }} />
                    </div>
                    <span className="w-14 text-right text-[12px] text-[var(--text-faint)]">{e.doneCount}/{e.total} done</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Recently updated</h3>
          <div className="divide-y divide-[var(--bg-raised)]/60">
            {recent.map((i) => (
              <button
                key={i.id}
                onClick={() => onIssueClick(i)}
                className="w-full flex items-center gap-2.5 py-2 text-left hover:bg-[var(--bg-raised)]/40 rounded-md px-1.5 -mx-1.5 motion-interactive"
              >
                <IssueTypeIcon type={i.type} size={15} />
                <span className="font-mono text-[11.5px] text-[var(--info)] shrink-0">{i.key}</span>
                <span className="flex-1 text-[13px] text-[var(--text-secondary)] truncate">{i.title}</span>
                <StatusPill status={i.status} />
                {i.assignee && <Avatar name={i.assignee} size={20} />}
                <span className="text-[11.5px] text-[var(--text-faint)] w-16 text-right shrink-0">{relTime(i.updatedAt)}</span>
              </button>
            ))}
            {recent.length === 0 && (
              <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">No work items yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export type { Status };
