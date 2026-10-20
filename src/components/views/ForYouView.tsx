import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { StatusPill } from '@/components/issues/StatusPill';
import { LogoMark } from '@/components/ui/LogoMark';
import { useProjectStore } from '@/store/projectStore';

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** "For you" landing: recommended spaces + your recent work feed. */
export function ForYouView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const setActiveView = useProjectStore((s) => s.setActiveView);
  const issues = useMemo(
    () =>
      [...project.issues]
        .filter((i) => !i.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [project.issues]
  );
  const today = issues.filter((i) => isToday(i.updatedAt));
  const earlier = issues.filter((i) => !isToday(i.updatedAt)).slice(0, 8);
  const shownToday = today.slice(0, 8);

  const Row = ({ issue }: { issue: Issue }) => (
    <button
      onClick={() => onIssueClick(issue)}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-[var(--bg-surface)] motion-interactive"
    >
      <IssueTypeIcon type={issue.type} size={16} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] text-[var(--text-primary)] truncate">{issue.title}</span>
        <span className="block text-[11.5px] text-[var(--text-faint)]">
          {issue.key} · {project.name}
        </span>
      </span>
      <StatusPill status={issue.status} />
      <span className="text-[11.5px] text-[var(--text-faint)] w-20 text-right shrink-0">{relTime(issue.updatedAt)}</span>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">For you</h2>

      <h3 className="mt-6 mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        Recommended spaces
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveView('board')}
          className="flex items-center gap-3 rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-4 text-left depth-card motion-interactive hover:border-[var(--chrome)]"
        >
          <span className="icon-pack w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <LogoMark size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-[var(--text-primary)] truncate">{project.name}</span>
            <span className="block text-[12px] text-[var(--text-muted)]">
              {project.key} · {issues.length} work items
            </span>
          </span>
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--chrome)] p-4 text-[var(--text-faint)]">
          <Plus size={18} />
          <span className="text-[13px]">More spaces show up here as your team grows</span>
        </div>
      </div>

      <h3 className="mt-8 mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        For you
      </h3>
      {shownToday.length > 0 && (
        <>
          <p className="px-2 pt-2 pb-1 text-[12px] font-semibold text-[var(--text-muted)]">Today</p>
          {shownToday.map((i) => (
            <Row key={i.id} issue={i} />
          ))}
        </>
      )}
      {earlier.length > 0 && (
        <>
          <p className="px-2 pt-3 pb-1 text-[12px] font-semibold text-[var(--text-muted)]">Earlier</p>
          {earlier.map((i) => (
            <Row key={i.id} issue={i} />
          ))}
        </>
      )}
      {issues.length === 0 && (
        <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">
          Nothing here yet — open the board and your recent work will land on this page.
        </p>
      )}
    </div>
  );
}
