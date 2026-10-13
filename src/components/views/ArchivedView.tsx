import { useMemo } from 'react';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import type { Issue, Project } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { StatusPill } from '@/components/issues/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectStore } from '@/store/projectStore';

interface Props {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}

export function ArchivedView({ project, onIssueClick }: Props) {
  const unarchiveIssue = useProjectStore((s) => s.unarchiveIssue);
  const deleteIssue = useProjectStore((s) => s.deleteIssue);
  const setShowConfirmDialog = useProjectStore((s) => s.setShowConfirmDialog);

  const archived = useMemo(
    () =>
      project.issues
        .filter((i) => i.archived)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [project.issues]
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[12.5px] text-[var(--text-muted)] mb-4">
          {archived.length} archived issue{archived.length === 1 ? '' : 's'} · hidden from all views
        </p>
        {archived.length === 0 ? (
          <EmptyState
            icon={<ArchiveRestore size={28} />}
            title="Nothing archived"
            hint="Archive finished issues to declutter the board without deleting history."
          />
        ) : (
          <ul className="space-y-2">
            {archived.map((issue) => (
              <li
                key={issue.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)]/40"
              >
                <IssueTypeIcon type={issue.type} size={16} />
                <button
                  onClick={() => onIssueClick(issue)}
                  className="flex-1 min-w-0 text-left hover:underline"
                >
                  <span className="font-mono text-[12px] text-[var(--text-faint)] mr-2">
                    {issue.key}
                  </span>
                  <span className="text-[13.5px] text-[var(--text-secondary)] truncate">
                    {issue.title}
                  </span>
                </button>
                <StatusPill status={issue.status} />
                <button
                  onClick={() => unarchiveIssue(issue.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[var(--accent-bright)] hover:bg-[var(--accent)]/10 motion-press"
                  title={`Restore ${issue.key}`}
                >
                  <ArchiveRestore size={14} /> Restore
                </button>
                <button
                  onClick={() =>
                    setShowConfirmDialog({
                      title: `Delete ${issue.key}?`,
                      message: 'This permanently deletes the issue and its history.',
                      onConfirm: () => deleteIssue(issue.id),
                    })
                  }
                  className="p-1.5 rounded-md text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 motion-press"
                  title={`Delete ${issue.key} permanently`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
