import { useMemo, useState } from 'react';
import { ChevronDown, Play, CheckCheck, Plus, Inbox } from 'lucide-react';
import type { Issue, Project, Sprint } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { Avatar } from '@/components/issues/Avatar';
import { StatusPill } from '@/components/issues/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectStore } from '@/store/projectStore';

function IssueRow({ issue, onClick }: { issue: Issue; onClick: (i: Issue) => void }) {
  return (
    <button
      onClick={() => onClick(issue)}
      className="w-full flex items-center gap-2.5 px-3 py-[7px] hover:bg-[#22272b] text-left motion-interactive border-b border-[#2c333a]/40 last:border-0"
    >
      <IssueTypeIcon type={issue.type} size={15} />
      <span className="font-mono text-[11.5px] text-[#626f86] w-[68px] shrink-0">{issue.key}</span>
      <span className="flex-1 text-[13px] text-[#e6edf3] truncate">{issue.title}</span>
      <StatusPill status={issue.status} className="hidden sm:inline-flex" />
      {issue.storyPoints > 0 && (
        <span
          className="min-w-[20px] h-5 px-1 rounded-full bg-[#3d474f]/70 text-[#b6c2cf] text-[11px] font-semibold hidden sm:inline-flex items-center justify-center"
          title="Story points"
        >
          {issue.storyPoints}
        </span>
      )}
      {issue.assignee ? <Avatar name={issue.assignee} size={22} /> : <span className="w-[22px]" />}
    </button>
  );
}

function SprintPanel({
  sprint,
  issues,
  defaultOpen,
  onIssueClick,
}: {
  sprint: Sprint;
  issues: Issue[];
  defaultOpen: boolean;
  onIssueClick: (i: Issue) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { startSprint, completeSprint, setShowConfirmDialog } = useProjectStore();
  const points = issues.reduce((n, i) => n + i.storyPoints, 0);

  const confirmComplete = () =>
    setShowConfirmDialog({
      title: `Complete ${sprint.name}?`,
      message: 'Open issues will return to the backlog.',
      onConfirm: () => completeSprint(sprint.id),
    });

  return (
    <section className="rounded-xl border border-[#2c333a] bg-[#1d2125] overflow-hidden mb-3">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#22272b]/60">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1 rounded text-[#8c9bab] hover:bg-[#2c333a] motion-press"
          aria-expanded={open}
          aria-label={open ? `Collapse ${sprint.name}` : `Expand ${sprint.name}`}
        >
          <ChevronDown size={15} className={`motion-interactive ${open ? '' : '-rotate-90'}`} />
        </button>
        <span className="text-[13.5px] font-semibold text-[#e6edf3]">{sprint.name}</span>
        <span className="text-[12px] text-[#626f86]">
          {issues.length} issue{issues.length === 1 ? '' : 's'}
          {points > 0 && ` · ${points} pts`}
        </span>
        {sprint.status === 'active' && (
          <span className="text-[10.5px] font-bold uppercase tracking-wide px-1.5 py-px rounded bg-[#36b37e]/15 text-[#36b37e]">
            Active
          </span>
        )}
        <span className="flex-1" />
        {sprint.status === 'planning' && (
          <button
            onClick={() => startSprint(sprint.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12.5px] font-medium bg-[#22272b] border border-[#2c333a] text-[#b6c2cf] hover:border-[#3d474f] hover:text-[#e6edf3] motion-press"
          >
            <Play size={12} /> Start sprint
          </button>
        )}
        {sprint.status === 'active' && (
          <button
            onClick={confirmComplete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12.5px] font-medium bg-[#0c66e4] hover:bg-[#0055cc] text-white motion-press"
          >
            <CheckCheck size={12} /> Complete sprint
          </button>
        )}
      </div>
      {open && (
        <div>
          {issues.length === 0 ? (
            <p className="px-3 py-4 text-[12.5px] text-[#626f86]">
              No issues in this sprint yet. Open an issue and assign it to {sprint.name}.
            </p>
          ) : (
            issues.map((i) => <IssueRow key={i.id} issue={i} onClick={onIssueClick} />)
          )}
        </div>
      )}
    </section>
  );
}

export function BacklogView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const { setShowSprintModal, setShowIssueModal, setNewIssueDefaultStatus, setSelectedIssue } =
    useProjectStore();

  const handleCreateIssue = () => {
    setNewIssueDefaultStatus('backlog');
    setSelectedIssue(null);
    setShowIssueModal(true);
  };

  const sprints = useMemo(() => {
    const rank = { active: 0, planning: 1, completed: 2 } as const;
    return [...project.sprints].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [project.sprints]);

  const issuesBySprint = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const s of project.sprints) map.set(s.id, []);
    for (const i of project.issues) {
      if (i.sprintId && map.has(i.sprintId)) map.get(i.sprintId)!.push(i);
    }
    return map;
  }, [project.issues, project.sprints]);

  const backlogIssues = useMemo(() => project.issues.filter((i) => !i.sprintId), [project.issues]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#e6edf3]">
          Backlog{' '}
          <span className="text-[#626f86] font-normal text-[13px]">
            {backlogIssues.length} unscheduled
          </span>
        </h2>
        <button
          onClick={() => setShowSprintModal(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium bg-[#22272b] border border-[#2c333a] text-[#b6c2cf] hover:border-[#3d474f] hover:text-[#e6edf3] motion-press"
        >
          <Plus size={14} /> Create sprint
        </button>
      </div>

      {sprints.map((s) => (
        <SprintPanel
          key={s.id}
          sprint={s}
          issues={issuesBySprint.get(s.id) ?? []}
          defaultOpen={s.status !== 'completed'}
          onIssueClick={onIssueClick}
        />
      ))}

      <section className="rounded-xl border border-[#2c333a] bg-[#1d2125] overflow-hidden">
        <div className="px-3 py-2.5 bg-[#22272b]/60 flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-[#e6edf3]">Backlog</span>
          <span className="text-[12px] text-[#626f86]">{backlogIssues.length} issues</span>
        </div>
        {backlogIssues.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} aria-hidden="true" />}
            title="Backlog is empty"
            hint="Everything is scheduled. Add new work here and it waits until a sprint picks it up."
            actionLabel="Create issue"
            onAction={handleCreateIssue}
          />
        ) : (
          backlogIssues.map((i) => <IssueRow key={i.id} issue={i} onClick={onIssueClick} />)
        )}
      </section>
    </div>
  );
}
