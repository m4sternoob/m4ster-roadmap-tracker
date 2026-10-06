import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimation,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SearchX } from 'lucide-react';
import { Column } from '@/components/ui/Column';
import { IssueCardView } from '@/components/ui/IssueCard';
import { BoardToolbar } from '@/components/board/BoardToolbar';
import {
  EMPTY_FILTERS,
  UNASSIGNED,
  applyBoardFilters,
  countActiveFilters,
  type BoardFilters,
  type GroupBy,
} from '@/components/board/boardFilters';
import { STATUSES, type Issue, type Priority } from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface BoardGroup {
  id: string;
  title: string;
  issues: Issue[];
  /** Values to preset when creating an issue from this column. */
  preset: { status?: Issue['status']; assignee?: string; priority?: Priority };
}

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function buildGroups(issues: Issue[], groupBy: GroupBy): BoardGroup[] {
  if (groupBy === 'assignee') {
    const names = Array.from(new Set(issues.map((i) => i.assignee ?? UNASSIGNED))).sort((a, b) =>
      a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b)
    );
    return names.map((name) => ({
      id: `assignee:${name}`,
      title: name === UNASSIGNED ? 'Unassigned' : name,
      issues: issues.filter((i) => (i.assignee ?? UNASSIGNED) === name),
      preset: name === UNASSIGNED ? {} : { assignee: name },
    }));
  }
  if (groupBy === 'priority') {
    const order: Priority[] = ['critical', 'high', 'medium', 'low'];
    return order.map((p) => ({
      id: `priority:${p}`,
      title: PRIORITY_LABELS[p],
      issues: issues.filter((i) => i.priority === p),
      preset: { priority: p },
    }));
  }
  return STATUSES.map((s) => ({
    id: `status:${s.value}`,
    title: s.label,
    issues: issues.filter((i) => i.status === s.value),
    preset: { status: s.value },
  }));
}

const priorityRank: Record<Priority, number> = { critical: 3, high: 2, medium: 1, low: 0 };

// Snap-back when a drag is cancelled: quick ease-out, transform only.
const dropAnimation: DropAnimation = {
  ...defaultDropAnimation,
  duration: 200,
  easing: 'cubic-bezier(0, 0, 0.2, 1)',
};

export function BoardView({
  project,
  onIssueClick,
}: {
  project: ReturnType<typeof useProjectStore.getState>['project'];
  onIssueClick: (issue: Issue) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const issues = useMemo(() => project?.issues ?? [], [project?.issues]);
  const filtered = useMemo(() => applyBoardFilters(issues, filters), [issues, filters]);
  const groups = useMemo(() => buildGroups(filtered, groupBy), [filtered, groupBy]);
  const epicsById = useMemo(
    () => new Map((project?.epics ?? []).map((e) => [e.id, { name: e.name, color: e.color }])),
    [project?.epics]
  );

  const sortedGroups = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        issues: [...g.issues].sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]),
      })),
    [groups]
  );

  const groupIds = useMemo(() => new Set(sortedGroups.map((g) => g.id)), [sortedGroups]);

  const activeIssue = useMemo(
    () => (activeId ? (filtered.find((i) => i.id === activeId) ?? null) : null),
    [activeId, filtered]
  );
  const activeEpic = activeIssue?.epicId ? epicsById.get(activeIssue.epicId) : undefined;

  const resolveGroup = (overId: string): BoardGroup | null => {
    if (groupIds.has(overId)) return sortedGroups.find((g) => g.id === overId) ?? null;
    const overIssue = filtered.find((i) => i.id === overId);
    if (!overIssue) return null;
    // Find which group contains the issue
    if (groupBy === 'assignee') {
      const key = `assignee:${overIssue.assignee ?? UNASSIGNED}`;
      return sortedGroups.find((g) => g.id === key) ?? null;
    }
    if (groupBy === 'priority')
      return sortedGroups.find((g) => g.id === `priority:${overIssue.priority}`) ?? null;
    return sortedGroups.find((g) => g.id === `status:${overIssue.status}`) ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragOverGroup(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverGroup(null);
    const { active, over } = event;
    if (!over || !project) return;

    const issueId = active.id as string;
    const group = resolveGroup(over.id as string);
    const issue = project.issues.find((i) => i.id === issueId);
    if (!issue || !group) return;

    const store = useProjectStore.getState();
    if (group.id.startsWith('status:')) {
      const status = group.id.slice('status:'.length) as Issue['status'];
      if (issue.status !== status) store.moveIssue(issueId, status);
    } else if (group.id.startsWith('assignee:')) {
      const name = group.id.slice('assignee:'.length);
      const assignee = name === UNASSIGNED ? undefined : name;
      if ((issue.assignee ?? undefined) !== assignee) store.updateIssue(issueId, { assignee });
    } else if (group.id.startsWith('priority:')) {
      const priority = group.id.slice('priority:'.length) as Priority;
      if (issue.priority !== priority) store.updateIssue(issueId, { priority });
    }
  };

  const handleAddIssue = (group: BoardGroup) => {
    const store = useProjectStore.getState();
    store.setNewIssueDefaultStatus(group.preset.status ?? 'todo');
    store.setNewIssuePreset({ assignee: group.preset.assignee, priority: group.preset.priority });
    store.setSelectedIssue(null);
    store.setShowIssueModal(true);
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasFilters = activeFilterCount > 0 || filters.query.trim() !== '';

  return (
    <div className="flex flex-col h-full">
      <BoardToolbar
        filters={filters}
        setFilters={setFilters}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        issues={issues}
        epics={project?.epics ?? []}
      />

      {hasFilters && filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="w-12 h-12 rounded-full bg-[#22272b] flex items-center justify-center">
            <SearchX size={20} className="text-[#626f86]" />
          </span>
          <p className="text-[14px] font-medium text-[#e6edf3]">No issues match your filters</p>
          <p className="text-[13px] text-[#8c9bab]">Try widening the search or clearing filters.</p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-1 px-3 py-1.5 rounded-md text-[13px] font-medium bg-[#22272b] border border-[#2c333a] text-[#b6c2cf] hover:border-[#3d474f] motion-press"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          onDragOver={(e) =>
            setDragOverGroup(e.over ? (resolveGroup(e.over.id as string)?.id ?? null) : null)
          }
        >
          <div
            className="flex gap-2 overflow-x-auto pb-4 px-0.5 flex-1 items-start"
            style={{ minHeight: 'calc(100vh - 300px)' }}
          >
            {sortedGroups.map((group) => (
              <Column
                key={group.id}
                id={group.id}
                title={group.title}
                issues={group.issues}
                epicsById={epicsById}
                isDragOver={dragOverGroup === group.id}
                onIssueClick={onIssueClick}
                onAddIssue={() => handleAddIssue(group)}
              />
            ))}
          </div>

          {/* Floating drag preview: follows the cursor 1:1, no transition lag. */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeIssue ? (
              <div className="w-[270px]">
                <IssueCardView
                  issue={activeIssue}
                  epicColor={activeEpic?.color}
                  epicName={activeEpic?.name}
                  overlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
