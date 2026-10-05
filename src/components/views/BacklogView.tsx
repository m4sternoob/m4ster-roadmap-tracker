import { Layers } from 'lucide-react';
import type { Project, Issue } from '@/types';
import { IssueCard } from '@/components/ui/IssueCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useProjectStore } from '@/store/projectStore';

export function BacklogView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const backlogIssues = project.issues.filter((i) => i.status === 'backlog');

  return (
    <div>
      <SectionHeader
        icon={Layers}
        title="Backlog"
        subtitle="Unscheduled work, ready to be planned"
        count={backlogIssues.length}
      />
      {backlogIssues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-dark-border py-16 text-center text-sm text-slate-400 dark:text-dark-muted">
          <p className="mb-4">Backlog is empty — create an issue to get started</p>
          <button
            onClick={() => {
              useProjectStore.getState().setSelectedIssue(null);
              useProjectStore.getState().setShowIssueModal(true);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press"
          >
            Create First Issue
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {backlogIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </div>
      )}
    </div>
  );
}
