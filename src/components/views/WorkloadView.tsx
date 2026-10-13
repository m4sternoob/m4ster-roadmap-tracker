import { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { Issue, Project, Status } from '@/types';
import { Avatar } from '@/components/issues/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}

const STATUS_ORDER: Status[] = ['in-progress', 'review', 'todo', 'backlog', 'done'];
const STATUS_COLOR: Record<Status, string> = {
  backlog: '#64748b',
  todo: '#0ea5e9',
  'in-progress': '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
};

export function WorkloadView({ project, onIssueClick }: Props) {
  const people = useMemo(() => {
    const map = new Map<string, Issue[]>();
    const unassigned: Issue[] = [];
    for (const issue of project.issues) {
      if (issue.archived) continue;
      if (issue.assignee) {
        const arr = map.get(issue.assignee) ?? [];
        arr.push(issue);
        map.set(issue.assignee, arr);
      } else {
        unassigned.push(issue);
      }
    }
    const list = [...map.entries()].map(([name, issues]) => ({
      name,
      issues: [...issues].sort(
        (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      ),
      points: issues.reduce((s, i) => s + (i.storyPoints || 0), 0),
      open: issues.filter((i) => i.status !== 'done').length,
    }));
    list.sort((a, b) => b.open - a.open || b.points - a.points);
    return { list, unassigned };
  }, [project.issues]);

  if (people.list.length === 0 && people.unassigned.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <EmptyState icon={<Users size={28} />} title="No issues yet" hint="Assign issues to people to see workload here." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[12.5px] text-[var(--text-muted)] mb-4">
          Open work per person · sorted by load
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.list.map((p) => {
            const max = Math.max(1, ...people.list.map((x) => x.open));
            return (
              <div
                key={p.name}
                className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)]/40 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={p.name} size={36} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                      {p.name}
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)]">
                      {p.open} open · {p.points} pts
                    </div>
                  </div>
                </div>
                {/* load bar */}
                <div className="h-1.5 rounded-full bg-[var(--bg-raised)] mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${(p.open / max) * 100}%` }}
                  />
                </div>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                  {p.issues.slice(0, 8).map((issue) => (
                    <li key={issue.id}>
                      <button
                        onClick={() => onIssueClick(issue)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--bg-raised)] text-left motion-press"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLOR[issue.status] }}
                        />
                        <span className="font-mono text-[11.5px] text-[var(--text-faint)] shrink-0">
                          {issue.key}
                        </span>
                        <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
                          {issue.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {p.issues.length > 8 && (
                  <p className="text-[11.5px] text-[var(--text-faint)] mt-2">
                    +{p.issues.length - 8} more
                  </p>
                )}
              </div>
            );
          })}
          {people.unassigned.length > 0 && (
            <div className="rounded-xl border border-dashed border-[var(--chrome)] p-4">
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
                Unassigned
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mb-3">
                {people.unassigned.length} issue{people.unassigned.length === 1 ? '' : 's'} need an owner
              </p>
              <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                {people.unassigned.slice(0, 8).map((issue) => (
                  <li key={issue.id}>
                    <button
                      onClick={() => onIssueClick(issue)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--bg-raised)] text-left motion-press"
                    >
                      <span className="font-mono text-[11.5px] text-[var(--text-faint)] shrink-0">
                        {issue.key}
                      </span>
                      <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
                        {issue.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
