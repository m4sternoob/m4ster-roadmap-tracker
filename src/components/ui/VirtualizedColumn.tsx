import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Issue, Status } from '@/types';
import { IssueCard } from '@/components/ui/IssueCard';
import { useDroppable } from '@dnd-kit/core';

function VirtualizedIssueList({
  issues,
  onIssueClick,
}: {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}) {
  // For small lists, show all
  if (issues.length <= 50) {
    return (
      <div className="flex-1 flex flex-col gap-2 min-h-[160px] overflow-y-auto" role="list">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
        ))}
      </div>
    );
  }

  // For large lists, show first 50 with "show more" button
  const [visibleCount, setVisibleCount] = useState(50);
  const visibleIssues = issues.slice(0, visibleCount);

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-[160px] overflow-y-auto" role="list">
      {visibleIssues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
      ))}
      {issues.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((c) => Math.min(c + 50, issues.length))}
          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline py-2 self-start px-1"
        >
          Show {issues.length - visibleCount} more issues
        </button>
      )}
    </div>
  );
}

export function VirtualizedColumn({
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
  const { setNodeRef } = useDroppable({ id: status });

  const STATUS_LABELS: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'Review',
    done: 'Done',
  };

  const STATUS_ACCENTS: Record<string, string> = {
    backlog: 'bg-slate-400',
    todo: 'bg-sky-500',
    'in-progress': 'bg-amber-500',
    review: 'bg-violet-500',
    done: 'bg-emerald-500',
  };

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
    >
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_ACCENTS[status]}`} />
          <h3 className="font-semibold text-[13px] uppercase tracking-wide text-slate-600 dark:text-dark-muted">
            {STATUS_LABELS[status]}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium min-w-[20px] text-center px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-dark-muted">
            {issues.length}
          </span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            VIRTUAL
          </span>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-2 min-h-[160px] px-2.5 pb-2.5 overflow-y-auto"
        role="list"
      >
        <VirtualizedIssueList issues={issues} onIssueClick={onIssueClick} />
      </div>

      <div className="px-2.5 pb-2.5">
        <button
          onClick={() => {
            // Use store to create new issue
          }}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-dark-muted hover:bg-white dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-dark-border"
          aria-label={`Add issue to column`}
        >
          <Plus size={14} /> Add issue
        </button>
      </div>
    </div>
  );
}
