import { useState } from 'react';
import { ChevronDown, ListFilter, Search, User } from 'lucide-react';
import type { Issue } from '@/types';
import { Avatar } from '@/components/issues/Avatar';
import {
  CURRENT_USER,
  UNASSIGNED,
  countActiveFilters,
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
  issues,
  epics,
}: {
  filters: BoardFilters;
  setFilters: (f: BoardFilters) => void;
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  issues: Issue[];
  epics: { id: string; name: string; color: string }[];
}) {
  const [filterOpen, setFilterOpen] = useState(false);
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
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#626f86] pointer-events-none"
        />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search board"
          aria-label="Search board"
          className="h-8 w-48 md:w-56 pl-8 pr-3 rounded-md bg-[#22272b] border border-[#2c333a] text-[13px] text-[#e6edf3] placeholder:text-[#626f86] hover:border-[#3d474f] focus:outline-none focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4]/40 motion-interactive"
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
              ? 'bg-[#0c66e4] border-[#0c66e4] text-white'
              : 'bg-[#22272b] border-[#2c333a] text-[#8c9bab] hover:border-[#3d474f]'
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
                  ? 'ring-2 ring-[#579dff] ring-offset-2 ring-offset-[#1d2125]'
                  : 'hover:ring-2 hover:ring-[#3d474f] hover:ring-offset-2 hover:ring-offset-[#1d2125]'
              } ${filters.quickAssignee && filters.quickAssignee !== a ? 'opacity-40' : ''}`}
            >
              <Avatar name={a} size={28} />
            </button>
          )
        )}
        {filters.quickAssignee && (
          <button
            onClick={() => setFilters({ ...filters, quickAssignee: null })}
            className="ml-2 text-[12px] text-[#579dff] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter button + panel */}
      <div className="relative">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          className={`h-8 px-3 rounded-md flex items-center gap-1.5 text-[13px] font-medium border motion-interactive ${
            activeCount > 0 || filterOpen
              ? 'bg-[#0c66e4]/15 border-[#0c66e4] text-[#579dff]'
              : 'bg-[#22272b] border-[#2c333a] text-[#b6c2cf] hover:border-[#3d474f]'
          }`}
        >
          <ListFilter size={14} />
          Filter
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0c66e4] text-white text-[11px] font-semibold flex items-center justify-center">
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
          className={`h-8 px-3 rounded-md flex items-center gap-1.5 text-[13px] font-medium border motion-interactive ${
            groupOpen || groupBy !== 'status'
              ? 'bg-[#0c66e4]/15 border-[#0c66e4] text-[#579dff]'
              : 'bg-[#22272b] border-[#2c333a] text-[#b6c2cf] hover:border-[#3d474f]'
          }`}
        >
          Group
          <span className="text-[#626f86] font-normal">: {groupLabel}</span>
          <ChevronDown size={13} />
        </button>
        {groupOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setGroupOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-44 rounded-lg border border-[#2c333a] bg-[#282e33] shadow-2xl shadow-black/50 py-1 z-50 animate-scale-in">
              {GROUP_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGroupBy(g.id);
                    setGroupOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] motion-interactive ${
                    groupBy === g.id
                      ? 'text-[#579dff] font-medium bg-[#0c66e4]/10'
                      : 'text-[#b6c2cf] hover:bg-[#22272b]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <span className="ml-auto text-[12px] text-[#626f86] select-none hidden md:inline">
        {issues.length} issue{issues.length === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// Re-export for the "only my issues" affordance used elsewhere.
export { CURRENT_USER };
