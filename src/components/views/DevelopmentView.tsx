import { useMemo } from 'react';
import { Bug, CheckCircle2, GitPullRequestArrow, RotateCcw, Timer } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { StatusPill } from '@/components/issues/StatusPill';

const DAY = 86400000;

function MetricCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] px-4 py-4 depth-card">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <div className="mt-2 text-[24px] font-bold leading-none text-[var(--text-primary)]">{value}</div>
      <div className="mt-1.5 text-[12px] text-[var(--text-faint)]">{delta}</div>
    </div>
  );
}

/**
 * Development metrics — same card layout as the reference (work completed,
 * cycle time, bugs created/closed, reopened), computed from local data.
 */
export function DevelopmentView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const now = Date.now();
  const issues = useMemo(() => project.issues.filter((i) => !i.archived), [project.issues]);

  const completed7 = issues.filter(
    (i) => i.completedAt && now - new Date(i.completedAt).getTime() <= 7 * DAY
  );
  const completedPrev7 = issues.filter((i) => {
    if (!i.completedAt) return false;
    const t = now - new Date(i.completedAt).getTime();
    return t > 7 * DAY && t <= 14 * DAY;
  });

  const cycleDays = issues
    .filter((i) => i.completedAt)
    .map((i) => (new Date(i.completedAt!).getTime() - new Date(i.createdAt).getTime()) / DAY)
    .filter((d) => d >= 0);
  const avgCycle = cycleDays.length
    ? (cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length).toFixed(1)
    : '—';

  const bugsCreated7 = issues.filter(
    (i) => i.type === 'bug' && now - new Date(i.createdAt).getTime() <= 7 * DAY
  );
  const bugsClosed7 = issues.filter(
    (i) => i.type === 'bug' && i.completedAt && now - new Date(i.completedAt).getTime() <= 7 * DAY
  );
  const inReview = issues.filter((i) => i.status === 'review');
  const openBugs = issues.filter((i) => i.type === 'bug' && i.status !== 'done');

  const recentDone = [...issues]
    .filter((i) => i.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 6);

  const delta = (cur: number, prev: number) =>
    prev === 0
      ? cur > 0
        ? `up from 0 last week`
        : 'no change vs last week'
      : `${cur >= prev ? '+' : ''}${Math.round(((cur - prev) / prev) * 100)}% vs last week`;

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">Development</h2>
        <span className="text-[12.5px] text-[var(--text-faint)]">Last 7 days · computed from this project</span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard
          icon={<CheckCircle2 size={15} />}
          label="Work items completed"
          value={String(completed7.length)}
          delta={delta(completed7.length, completedPrev7.length)}
        />
        <MetricCard
          icon={<Timer size={15} />}
          label="Cycle time (avg)"
          value={avgCycle === '—' ? '—' : `${avgCycle}d`}
          delta={cycleDays.length ? `across ${cycleDays.length} completed items` : 'complete an item to measure'}
        />
        <MetricCard
          icon={<Bug size={15} />}
          label="Bugs created"
          value={String(bugsCreated7.length)}
          delta={`${openBugs.length} still open`}
        />
        <MetricCard
          icon={<GitPullRequestArrow size={15} />}
          label="Bugs closed"
          value={String(bugsClosed7.length)}
          delta={bugsClosed7.length >= bugsCreated7.length ? 'keeping up with intake' : 'behind intake this week'}
        />
        <MetricCard
          icon={<RotateCcw size={15} />}
          label="In review now"
          value={String(inReview.length)}
          delta={inReview.length ? 'waiting on review' : 'review queue is clear'}
        />
      </div>

      <section className="mt-5 rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Recently completed</h3>
        <div className="divide-y divide-[var(--bg-raised)]/60">
          {recentDone.map((i) => (
            <button
              key={i.id}
              onClick={() => onIssueClick(i)}
              className="w-full flex items-center gap-2.5 py-2 text-left hover:bg-[var(--bg-raised)]/40 rounded-md px-1.5 -mx-1.5 motion-interactive"
            >
              <IssueTypeIcon type={i.type} size={15} />
              <span className="font-mono text-[11.5px] text-[var(--info)] shrink-0">{i.key}</span>
              <span className="flex-1 text-[13px] text-[var(--text-secondary)] truncate">{i.title}</span>
              <StatusPill status={i.status} />
              <span className="text-[11.5px] text-[var(--text-faint)] shrink-0">
                {i.completedAt ? new Date(i.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
              </span>
            </button>
          ))}
          {recentDone.length === 0 && (
            <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">
              Nothing completed yet — finished work lands here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
