import { ChevronsLeft, ChevronsRight, Ellipsis, Plus } from 'lucide-react';
import type { Issue } from '@/types';
import type { BoardDensity } from '@/components/board/boardFilters';
import { IssueCard } from '@/components/ui/IssueCard';
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
        className={`motion-collapse shrink-0 w-11 min-w-[44px] self-stretch rounded-xl border border-[#2c333a] bg-[#1d2125] hover:bg-[#22272b] hover:border-[#3d474f] flex flex-col items-center py-2 gap-2 ${
          isDragOver ? 'ring-2 ring-[#0c66e4]/50 bg-[#0c66e4]/10' : ''
        }`}
      >
        <ChevronsRight size={15} className="text-[#626f86] shrink-0" aria-hidden="true" />
        <span
          className="text-[12px] font-semibold uppercase tracking-wide text-[#8c9bab] truncate"
          style={{ writingMode: 'vertical-rl' }}
        >
          {title}
        </span>
        <span className="text-[11px] font-semibold text-[#626f86]">{issues.length}</span>
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`motion-collapse flex flex-col w-[270px] min-w-[270px] max-h-full rounded-xl ${
        isDragOver ? 'bg-[#0c66e4]/10 ring-2 ring-[#0c66e4]/50' : 'bg-[#1d2125]'
      }`}
      role="list"
      aria-label={`${title} column`}
    >
      {/* Header: plain label + count */}
      <div className="flex items-center gap-2 px-2 pt-2 pb-2">
        <button
          onClick={onToggleCollapse}
          aria-expanded={true}
          aria-label={`Collapse ${title} column`}
          title={`Collapse ${title}`}
          className="p-1 rounded text-[#626f86] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
        >
          <ChevronsLeft size={14} aria-hidden="true" />
        </button>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#8c9bab] truncate">
          {title}
        </h3>
        <span className="text-[12px] text-[#626f86] font-medium">{issues.length}</span>
        <span className="flex-1" />
        <button
          className="p-1 rounded text-[#626f86] hover:bg-[#22272b] hover:text-[#b6c2cf] opacity-0 hover:opacity-100 focus:opacity-100 motion-press"
          aria-label={`Column options for ${title}`}
          title="Column options"
        >
          <Ellipsis size={14} />
        </button>
      </div>

      {/* Cards */}
      <div
        className="flex-1 flex flex-col gap-2 min-h-[120px] px-1 pb-1 overflow-y-auto"
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
            className="text-[12px] font-medium text-[#579dff] hover:underline py-1.5 self-start px-1"
          >
            Show {issues.length - 8} more
          </button>
        )}

        {visibleIssues.length === 0 && (
          <div className="flex items-center justify-center text-[#626f86] text-[12px] rounded-lg border border-dashed border-[#2c333a] min-h-[80px]">
            Drop issues here
          </div>
        )}
      </div>

      {/* Dashed create button */}
      <div className="px-1 pb-1 pt-1">
        <button
          onClick={onAddIssue}
          className="w-full py-2 px-3 rounded-lg text-[13px] font-medium text-[#8c9bab] hover:text-[#e6edf3] hover:bg-[#22272b] border border-dashed border-[#2c333a] hover:border-[#3d474f] motion-interactive flex items-center justify-center gap-1.5"
          aria-label={`Create issue in ${title}`}
        >
          <Plus size={14} aria-hidden="true" /> Create
        </button>
      </div>
    </div>
  );
}
