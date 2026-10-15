import { ChevronsLeft, ChevronsRight, Ellipsis, Plus } from 'lucide-react';
import type { Issue } from '@/types';
import type { BoardDensity } from '@/components/board/boardFilters';
import { IssueCard } from '@/components/ui/IssueCard';
import { Pill } from '@/components/ui/Pill';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Column({
  id,
  title,
  issues,
  epicsById,
  isDragOver,
  onIssueClick,
  onAddIssue,
  collapsed = false,
  onToggleCollapse,
  density = 'comfortable',
}: {
  id: string;
  title: string;
  issues: Issue[];
  epicsById: Map<string, { name: string; color: string }>;
  isDragOver: boolean;
  onIssueClick: (issue: Issue) => void;
  onAddIssue: () => void;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  density?: BoardDensity;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleIssues = showAll || issues.length <= 8 ? issues : issues.slice(0, 8);
  const hasMore = issues.length > 8 && !showAll;

  const { setNodeRef } = useDroppable({ id });

  // Collapsed: slim rail with the title written vertically. Still a drop
  // target, and one click brings the column back.
  if (collapsed) {
    return (
      <button
        ref={setNodeRef}
        onClick={onToggleCollapse}
        aria-expanded={false}
        aria-label={`Expand ${title} column (${issues.length} issues)`}
        title={`Expand ${title}`}
        className={`motion-collapse shrink-0 w-11 min-w-[44px] self-stretch rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface)] hover:border-[var(--chrome)] flex flex-col items-center py-2 gap-2 ${
          isDragOver
            ? 'ring-2 ring-[var(--accent)]/50 bg-[var(--accent)]/10 animate-drop-breathe'
            : ''
        }`}
      >
        <ChevronsRight size={15} className="text-[var(--text-faint)] shrink-0" aria-hidden="true" />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] truncate"
          style={{ writingMode: 'vertical-rl' }}
        >
          {title}
        </span>
        <Pill tone="neutral">{issues.length}</Pill>
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`motion-collapse flex flex-col min-h-0 w-[86vw] min-w-[86vw] md:w-[270px] md:min-w-[270px] max-h-full rounded-lg border border-transparent ${
        isDragOver
          ? 'bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/50 animate-drop-breathe'
          : 'bg-[var(--bg-sunken)]/60'
      }`}
      role="list"
      aria-label={`${title} column`}
    >
      {/* Header: micro-label + count pill (Linear/Jira style) */}
      <div className="group flex items-center gap-1.5 px-2.5 pt-2.5 pb-2">
        <button
          onClick={onToggleCollapse}
          aria-expanded={true}
          aria-label={`Collapse ${title} column`}
          title={`Collapse ${title}`}
          className="p-1 rounded text-[var(--text-faint)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
        >
          <ChevronsLeft size={13} aria-hidden="true" />
        </button>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] truncate">
          {title}
        </h3>
        <Pill tone="neutral">{issues.length}</Pill>
        <span className="flex-1" />
        <button
          className="p-1 rounded text-[var(--text-faint)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 motion-press"
          aria-label={`Column options for ${title}`}
          title="Column options"
        >
          <Ellipsis size={13} />
        </button>
      </div>

      {/* Cards */}
      <div
        className="flex-1 min-h-0 flex flex-col gap-2 px-1 pb-1 overflow-y-auto"
        role="list"
        aria-label={`${title} issues`}
      >
        <SortableContext
          items={visibleIssues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {visibleIssues.map((issue) => {
            const epic = issue.epicId ? epicsById.get(issue.epicId) : undefined;
            return (
              <IssueCard
                key={issue.id}
                issue={issue}
                epicColor={epic?.color}
                epicName={epic?.name}
                onClick={onIssueClick}
                density={density}
              />
            );
          })}
        </SortableContext>

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[12px] font-medium text-[var(--accent-bright)] hover:underline py-1.5 self-start px-1"
          >
            Show {issues.length - 8} more
          </button>
        )}

        {visibleIssues.length === 0 && (
          <div className="flex items-center justify-center min-h-[88px] rounded-lg border border-dashed border-[var(--chrome)]/70 px-3">
            <span className="text-[12px] text-[var(--text-faint)]">Drop issues here</span>
          </div>
        )}
      </div>

      {/* Dashed create button */}
      <div className="px-1 pb-1 pt-1">
        <button
          onClick={onAddIssue}
          className="w-full py-2 px-3 rounded-lg text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-dashed border-[var(--bg-raised)] hover:border-[var(--chrome)] motion-interactive flex items-center justify-center gap-1.5"
          aria-label={`Create issue in ${title}`}
        >
          <Plus size={14} aria-hidden="true" /> Create
        </button>
      </div>
    </div>
  );
}
