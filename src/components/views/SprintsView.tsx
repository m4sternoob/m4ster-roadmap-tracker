import { Calendar, Play, CheckCheck, Trash2 } from 'lucide-react';
import type { Project, Issue } from '@/types';
import { IssueCard } from '@/components/ui/IssueCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SPRINT_STATUS_STYLES } from '@/utils/constants';
import { useProjectStore } from '@/store/projectStore';

export function SprintsView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const { startSprint, completeSprint, deleteSprint, setShowConfirmDialog } =
    useProjectStore.getState();

  const confirmDeleteSprint = (sprintId: string, sprintName: string) => {
    setShowConfirmDialog({
      title: 'Delete sprint',
      message: `Delete "${sprintName}"? Its issues will be kept and unassigned from the sprint.`,
      onConfirm: () => deleteSprint(sprintId),
    });
  };

  return (
    <div>
      <SectionHeader
        icon={Calendar}
        title="Sprints"
        subtitle="Planned and active iterations"
        count={project.sprints.length}
      />
      {project.sprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-dark-border py-16 text-center text-sm text-slate-400 dark:text-dark-muted">
          <p className="mb-4">No sprints yet — start one from the toolbar</p>
          <button
            onClick={() => useProjectStore.getState().setShowSprintModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press"
          >
            Create First Sprint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {project.sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                  {sprint.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${SPRINT_STATUS_STYLES[sprint.status]}`}
                  >
                    {sprint.status}
                  </span>
                  {sprint.status === 'planning' && (
                    <button
                      onClick={() => startSprint(sprint.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press flex items-center gap-1.5"
                      aria-label={`Start ${sprint.name}`}
                    >
                      <Play size={13} aria-hidden="true" /> Start
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button
                      onClick={() => completeSprint(sprint.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 motion-press flex items-center gap-1.5"
                      aria-label={`Complete ${sprint.name}`}
                    >
                      <CheckCheck size={13} aria-hidden="true" /> Complete
                    </button>
                  )}
                  <button
                    onClick={() => confirmDeleteSprint(sprint.id, sprint.name)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-dark-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 motion-press"
                    aria-label={`Delete ${sprint.name}`}
                    title="Delete sprint"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {sprint.goal && (
                <p className="text-sm text-slate-500 dark:text-dark-muted mb-4">{sprint.goal}</p>
              )}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {sprint.issues.map((issueId) => {
                  const issue = project.issues.find((i) => i.id === issueId);
                  return issue ? (
                    <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
