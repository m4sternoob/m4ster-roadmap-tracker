import { Plus } from 'lucide-react';
import type { Issue, Status } from '@/types';
import { IssueCard } from '@/components/ui/IssueCard';
import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnFilter } from '@/components/ui/ColumnFilter';

const STATUS_LABELS: Record<Status, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

const STATUS_ACCENTS: Record<Status, string> = {
  backlog: 'bg-slate-400',
  todo: 'bg-sky-500',
  'in-progress': 'bg-amber-500',
  review: 'bg-violet-500',
  done: 'bg-emerald-500',
};

export function Column({
  status,
  issues,
  isDragOver,
  onIssueClick,
}: {
  status: Status;
  issues: Issue[];
  isDragOver: boolean;
  onIssueClick: (issue: Issue) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleIssues = showAll || issues.length <= 8 ? issues : issues.slice(0, 8);
  const hasMore = issues.length > 8 && !showAll;

  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      id={status}
      className={`flex flex-col w-[280px] min-w-[280px] rounded-xl border motion-layout ${
        isDragOver
          ? 'border-primary-400 bg-primary-50/60 dark:bg-primary-900/10 ring-2 ring-primary-400/40'
          : 'border-slate-200/80 dark:border-dark-border bg-slate-100/50 dark:bg-dark-card/40'
      }`}
      role="list"
      aria-label={`${STATUS_LABELS[status]} column`}
      aria-roledescription="kanban column"
    >
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_ACCENTS[status]}`} aria-hidden="true" />
          <h3 className="font-semibold text-[13px] uppercase tracking-wide text-slate-600 dark:text-dark-muted">
            {STATUS_LABELS[status]}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium min-w-[20px] text-center px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-dark-muted">
            {issues.length}
          </span>
          <ColumnFilter status={status} />
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-2 min-h-[160px] px-2.5 pb-2.5 overflow-y-auto"
        role="list"
        aria-label={`${STATUS_LABELS[status]} issues`}
      >
        <SortableContext
          items={visibleIssues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {visibleIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </SortableContext>

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline py-1.5 self-start px-1"
          >
            Show {issues.length - 8} more
          </button>
        )}

        {visibleIssues.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center text-slate-400 dark:text-dark-muted/60 text-xs rounded-lg border border-dashed border-slate-300 dark:border-dark-border min-h-[100px]"
            role="status"
            aria-live="polite"
          >
            Drop issues here
          </div>
        )}
      </div>

      <div className="px-2.5 pb-2.5">
        <button
          onClick={() => {
            useProjectStore.getState().setNewIssueDefaultStatus(status);
            useProjectStore.getState().setSelectedIssue(null);
            useProjectStore.getState().setShowIssueModal(true);
          }}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-dark-muted hover:bg-white dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 motion-press flex items-center justify-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-dark-border"
          aria-label={`Add issue to ${STATUS_LABELS[status]}`}
        >
          <Plus size={14} aria-hidden="true" /> Add issue
        </button>
      </div>
    </div>
  );
}
