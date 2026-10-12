import { useState } from 'react';
import { ChevronDown, ListFilter, Search, User } from 'lucide-react';
import type { Issue } from '@/types';
import { Avatar } from '@/components/issues/Avatar';
import { useProjectStore } from '@/store/projectStore';
import {
  CURRENT_USER,
  UNASSIGNED,
  countActiveFilters,
  type BoardDensity,
  type BoardFilters,
  type GroupBy,
} from '@/components/board/boardFilters';
import { FilterPanel } from '@/components/board/FilterPanel';

const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'priority', label: 'Priority' },
];

export function BoardToolbar({
  filters,
  setFilters,
  groupBy,
  setGroupBy,
  density,
  setDensity,
  issues,
  epics,
}: {
  filters: BoardFilters;
  setFilters: (f: BoardFilters) => void;
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  density: BoardDensity;
  setDensity: (d: BoardDensity) => void;
  issues: Issue[];
  epics: { id: string; name: string; color: string }[];
}) {
  // Filter panel visibility lives in the store so the sidebar can open it.
  const filterOpen = useProjectStore((s) => s.boardFilterPanelOpen);
  const setFilterOpen = useProjectStore((s) => s.setBoardFilterPanelOpen);
  const [groupOpen, setGroupOpen] = useState(false);

  const assignees = Array.from(new Set(issues.map((i) => i.assignee ?? UNASSIGNED))).sort((a, b) =>
    a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b)
  );
  const labels = Array.from(new Set(issues.flatMap((i) => i.labels))).sort();

  const activeCount = countActiveFilters(filters);
  const groupLabel = GROUP_OPTIONS.find((g) => g.id === groupBy)?.label;

  const toggleQuickAssignee = (a: string) =>
    setFilters({ ...filters, quickAssignee: filters.quickAssignee === a ? null : a });

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
        />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search board"
          aria-label="Search board"
          className="h-8 w-48 md:w-56 pl-8 pr-3 rounded-md bg-[var(--bg-surface)] border border-[var(--bg-raised)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] hover:border-[var(--chrome)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 motion-interactive"
        />
      </div>

      {/* Assignee quick filters */}
      <div className="flex items-center -space-x-1.5" role="group" aria-label="Filter by assignee">
        <button
          onClick={() => setFilters({ ...filters, onlyMine: !filters.onlyMine })}
          title="Only my issues"
          aria-pressed={filters.onlyMine}
          className={`relative z-10 mr-2 w-7 h-7 rounded-full flex items-center justify-center border motion-press ${
            filters.onlyMine
              ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
              : 'bg-[var(--bg-surface)] border-[var(--bg-raised)] text-[var(--text-muted)] hover:border-[var(--chrome)]'
          }`}
        >
          <User size={13} />
        </button>
        {assignees.slice(0, 6).map((a) =>
          a === UNASSIGNED ? null : (
            <button
              key={a}
              onClick={() => toggleQuickAssignee(a)}
              title={a}
              aria-pressed={filters.quickAssignee === a}
              className={`rounded-full motion-press ${
                filters.quickAssignee === a
                  ? 'ring-2 ring-[var(--accent-bright)] ring-offset-2 ring-offset-[var(--bg-app)]'
                  : 'hover:ring-2 hover:ring-[var(--chrome)] hover:ring-offset-2 hover:ring-offset-[var(--bg-app)]'
              } ${filters.quickAssignee && filters.quickAssignee !== a ? 'opacity-40' : ''}`}
            >
              <Avatar name={a} size={28} />
            </button>
          )
        )}
        {filters.quickAssignee && (
          <button
            onClick={() => setFilters({ ...filters, quickAssignee: null })}
            className="ml-2 text-[12px] text-[var(--accent-bright)] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter button + panel */}
      <div className="relative">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          aria-expanded={filterOpen}
          className={`h-8 px-3 rounded-md flex items-center gap-1.5 text-[13px] font-medium border motion-interactive whitespace-nowrap shrink-0 ${
            activeCount > 0 || filterOpen
              ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent-bright)]'
              : 'bg-[var(--bg-surface)] border-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[var(--chrome)]'
          }`}
        >
          <ListFilter size={14} />
          Filter
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {filterOpen && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            epics={epics}
            assignees={assignees}
            labels={labels}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      {/* Group by */}
      <div className="relative">
        <button
          onClick={() => setGroupOpen((v) => !v)}
          aria-expanded={groupOpen}
          className={`h-8 px-3 rounded-md flex items-center gap-1.5 text-[13px] font-medium border motion-interactive whitespace-nowrap shrink-0 ${
            groupOpen || groupBy !== 'status'
              ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent-bright)]'
              : 'bg-[var(--bg-surface)] border-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[var(--chrome)]'
          }`}
        >
          Group
          <span className="text-[var(--text-faint)] font-normal">: {groupLabel}</span>
          <ChevronDown size={13} />
        </button>
        {groupOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setGroupOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-44 rounded-lg border border-[var(--bg-raised)] bg-[var(--bg-sunken)] shadow-2xl shadow-black/50 py-1 z-50 animate-scale-in">
              {GROUP_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGroupBy(g.id);
                    setGroupOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] motion-interactive ${
                    groupBy === g.id
                      ? 'text-[var(--accent-bright)] font-medium bg-[var(--accent)]/10'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Density toggle */}
      <div
        className="flex items-center rounded-md border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-0.5"
        role="group"
        aria-label="Board density"
      >
        {(['comfortable', 'compact'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDensity(d)}
            aria-pressed={density === d}
            title={d === 'compact' ? 'Compact density' : 'Comfortable density'}
            className={`h-7 px-2.5 rounded text-[12px] font-medium capitalize motion-interactive ${
              density === d
                ? 'bg-[var(--accent)]/20 text-[var(--accent-bright)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <span className="ml-auto text-[12px] text-[var(--text-faint)] select-none hidden md:inline">
        {issues.length} issue{issues.length === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// Re-export for the "only my issues" affordance used elsewhere.
export { CURRENT_USER };
