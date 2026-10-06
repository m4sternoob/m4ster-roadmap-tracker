import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { IssueType, Priority, Status } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { UNASSIGNED, type BoardFilters } from '@/components/board/boardFilters';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-[#2c333a] last:border-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#626f86] mb-1.5 px-1">
        {title}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12.5px] border motion-interactive ${
        active
          ? 'bg-[#0c66e4]/20 border-[#0c66e4] text-[#579dff] font-medium'
          : 'bg-[#22272b] border-[#2c333a] text-[#8c9bab] hover:border-[#3d474f] hover:text-[#b6c2cf]'
      }`}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

const TYPE_LABELS: Record<IssueType, string> = {
  story: 'Story',
  task: 'Task',
  bug: 'Bug',
  epic: 'Epic',
  subtask: 'Sub-task',
};
const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
const STATUS_LABELS: Record<Status, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function FilterPanel({
  filters,
  setFilters,
  epics,
  assignees,
  labels,
  onClose,
}: {
  filters: BoardFilters;
  setFilters: (f: BoardFilters) => void;
  epics: { id: string; name: string; color: string }[];
  assignees: string[];
  labels: string[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const clearAll = () =>
    setFilters({
      ...filters,
      types: [],
      priorities: [],
      statuses: [],
      assignees: [],
      epicIds: [],
      labels: [],
      onlyMine: false,
      quickAssignee: null,
    });

  const hasAny =
    filters.types.length +
      filters.priorities.length +
      filters.statuses.length +
      filters.assignees.length +
      filters.epicIds.length +
      filters.labels.length >
      0 ||
    filters.onlyMine ||
    filters.quickAssignee !== null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Board filters"
      className="absolute top-full left-0 mt-2 w-[340px] max-h-[70vh] overflow-y-auto rounded-xl border border-[#2c333a] bg-[#282e33] shadow-2xl shadow-black/50 p-3 z-50 animate-scale-in"
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-[13px] font-semibold text-[#e6edf3]">Filters</span>
        <div className="flex items-center gap-1">
          {hasAny && (
            <button onClick={clearAll} className="text-[12px] text-[#579dff] hover:underline px-1">
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf]"
            aria-label="Close filters"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <Section title="Type">
        {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => (
          <Chip
            key={t}
            active={filters.types.includes(t)}
            onClick={() => setFilters({ ...filters, types: toggle(filters.types, t) })}
            ariaLabel={`Filter by ${TYPE_LABELS[t]}`}
          >
            <IssueTypeIcon type={t} size={14} />
            {TYPE_LABELS[t]}
          </Chip>
        ))}
      </Section>

      <Section title="Priority">
        {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
          <Chip
            key={p}
            active={filters.priorities.includes(p)}
            onClick={() => setFilters({ ...filters, priorities: toggle(filters.priorities, p) })}
            ariaLabel={`Filter by ${PRIORITY_LABELS[p]} priority`}
          >
            <PriorityIcon priority={p} size={13} />
            {PRIORITY_LABELS[p]}
          </Chip>
        ))}
      </Section>

      <Section title="Status">
        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
          <Chip
            key={s}
            active={filters.statuses.includes(s)}
            onClick={() => setFilters({ ...filters, statuses: toggle(filters.statuses, s) })}
            ariaLabel={`Filter by ${STATUS_LABELS[s]} status`}
          >
            {STATUS_LABELS[s]}
          </Chip>
        ))}
      </Section>

      <Section title="Assignee">
        {assignees.map((a) => (
          <Chip
            key={a}
            active={filters.assignees.includes(a)}
            onClick={() => setFilters({ ...filters, assignees: toggle(filters.assignees, a) })}
            ariaLabel={`Filter by assignee ${a === UNASSIGNED ? 'unassigned' : a}`}
          >
            {a === UNASSIGNED ? (
              <span className="w-[18px] h-[18px] rounded-full bg-[#3d474f] flex items-center justify-center text-[9px] text-[#8c9bab] font-bold">
                ?
              </span>
            ) : (
              <Avatar name={a} size={18} />
            )}
            {a === UNASSIGNED ? 'Unassigned' : a}
          </Chip>
        ))}
        {assignees.length === 0 && (
          <span className="text-[12px] text-[#626f86] px-1">No assignees yet</span>
        )}
      </Section>

      {epics.length > 0 && (
        <Section title="Epic">
          {epics.map((e) => (
            <Chip
              key={e.id}
              active={filters.epicIds.includes(e.id)}
              onClick={() => setFilters({ ...filters, epicIds: toggle(filters.epicIds, e.id) })}
              ariaLabel={`Filter by epic ${e.name}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                style={{ backgroundColor: e.color }}
              />
              {e.name}
            </Chip>
          ))}
        </Section>
      )}

      {labels.length > 0 && (
        <Section title="Label">
          {labels.map((l) => (
            <Chip
              key={l}
              active={filters.labels.includes(l)}
              onClick={() => setFilters({ ...filters, labels: toggle(filters.labels, l) })}
              ariaLabel={`Filter by label ${l}`}
            >
              {l}
            </Chip>
          ))}
        </Section>
      )}
    </div>
  );
}
