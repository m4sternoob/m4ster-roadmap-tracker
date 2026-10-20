import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, ListPlus, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Issue, Priority, Project, Status } from '@/types';
import { STATUSES } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { StatusPill } from '@/components/issues/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectStore } from '@/store/projectStore';

/**
 * List view — modeled on the classic issue-table layout (see the user's
 * reference screenshots): checkbox column, Work (type + key + title),
 * Assignee, Reporter, Priority, Status (click the lozenge to change it
 * inline), Resolution, Created, Updated — plus our own extras kept from
 * the base app: drag-to-reorder columns, click-to-sort headers, row
 * checkboxes with a live "N of M" footer, and an inline Create row.
 */

type SortKey =
  | 'key'
  | 'title'
  | 'status'
  | 'priority'
  | 'assignee'
  | 'reporter'
  | 'createdAt'
  | 'updatedAt';

const STATUS_ORDER: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

function reporterOf(issue: Issue): string {
  return issue.reporter ?? issue.comments[0]?.author ?? 'You';
}

function compare(a: Issue, b: Issue, key: SortKey): number {
  switch (key) {
    case 'key':
      return a.key.localeCompare(b.key, undefined, { numeric: true });
    case 'title':
      return a.title.localeCompare(b.title);
    case 'status':
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    case 'priority':
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    case 'assignee':
      return (a.assignee ?? '').localeCompare(b.assignee ?? '');
    case 'reporter':
      return reporterOf(a).localeCompare(reporterOf(b));
    case 'createdAt':
      return a.createdAt.localeCompare(b.createdAt);
    case 'updatedAt':
      return a.updatedAt.localeCompare(b.updatedAt);
  }
}

const FMT_DATE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, FMT_DATE);
}

/** Inline status picker: click the lozenge, pick a new status. */
function StatusMenu({ issue }: { issue: Issue }) {
  const moveIssue = useProjectStore((s) => s.moveIssue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 4, left: Math.max(8, r.left) });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Change status"
        className="rounded motion-press hover:ring-2 hover:ring-[var(--accent)]/40"
      >
        <StatusPill status={issue.status} />
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              role="menu"
              aria-label={`Change status of ${issue.key}`}
              className="fixed z-50 w-44 rounded-lg border border-[var(--bg-raised)] bg-[var(--bg-sunken)] shadow-2xl shadow-black/50 py-1 animate-scale-in"
              style={{ top: pos.top, left: pos.left }}
            >
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (s.value !== issue.status) moveIssue(issue.id, s.value);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left ${
                    s.value === issue.status
                      ? 'text-[var(--accent-bright)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  {s.label}
                  {s.value === issue.status && <Check size={13} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

interface ColDef {
  id: string;
  label: string;
  sortKey: SortKey | null;
  className?: string;
}

const COLUMNS: ColDef[] = [
  { id: 'work', label: 'Work', sortKey: 'title' },
  { id: 'assignee', label: 'Assignee', sortKey: 'assignee', className: 'w-40' },
  { id: 'reporter', label: 'Reporter', sortKey: 'reporter', className: 'w-40' },
  { id: 'priority', label: 'Priority', sortKey: 'priority', className: 'w-28' },
  { id: 'status', label: 'Status', sortKey: 'status', className: 'w-36' },
  { id: 'resolution', label: 'Resolution', sortKey: null, className: 'w-28' },
  { id: 'created', label: 'Created', sortKey: 'createdAt', className: 'w-32' },
  { id: 'updated', label: 'Updated', sortKey: 'updatedAt', className: 'w-32' },
];

const COLUMN_ORDER_KEY = 'mt_list_column_order_v2';
const DEFAULT_ORDER = COLUMNS.map((c) => c.id);

function loadColumnOrder(): string[] {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && DEFAULT_ORDER.every((k) => parsed.includes(k))) {
        return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_ORDER];
}

export function ListView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('key');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [columnOrder, setColumnOrder] = useState<string[]>(loadColumnOrder);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const saveColumnOrder = (order: string[]) => {
    setColumnOrder(order);
    try {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
    } catch {}
  };

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDragCol(colId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragCol || dragCol === targetId) return;
    const next = [...columnOrder];
    const from = next.indexOf(dragCol);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, dragCol);
    saveColumnOrder(next);
    setDragCol(null);
  };

  const colDef = (id: string) => COLUMNS.find((c) => c.id === id)!;
  const orderedCols = columnOrder.map(colDef);

  const issues = useMemo(() => {
    const sorted = [...project.issues]
      .filter((i) => !i.archived)
      .sort((a, b) => compare(a, b, sortKey));
    return sortDir === 1 ? sorted : sorted.reverse();
  }, [project.issues, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = issues.length > 0 && issues.every((i) => selected.has(i.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(issues.map((i) => i.id)));

  const openCreate = () => {
    const s = useProjectStore.getState();
    s.setNewIssueDefaultStatus('backlog');
    s.setNewIssuePreset(null);
    s.setSelectedIssue(null);
    s.setShowIssueModal(true);
  };

  const renderCell = (issue: Issue, colId: string) => {
    switch (colId) {
      case 'work':
        return (
          <td className="px-3 py-2">
            <span className="flex items-center gap-2 min-w-0">
              <IssueTypeIcon type={issue.type} size={16} />
              <span className="font-mono text-[12px] text-[var(--info)] shrink-0">{issue.key}</span>
              <span className="text-[13.5px] text-[var(--text-primary)] truncate">{issue.title}</span>
              {issue.status === 'done' && (
                <Check size={14} className="text-[var(--success)] shrink-0" aria-label="Done" />
              )}
            </span>
          </td>
        );
      case 'assignee':
        return (
          <td className="px-3 py-2">
            {issue.assignee ? (
              <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                <Avatar name={issue.assignee} size={22} />
                <span className="truncate max-w-[110px]">{issue.assignee}</span>
              </span>
            ) : (
              <span className="text-[12.5px] text-[var(--text-faint)]">Unassigned</span>
            )}
          </td>
        );
      case 'reporter':
        return (
          <td className="px-3 py-2">
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
              <Avatar name={reporterOf(issue)} size={22} />
              <span className="truncate max-w-[110px]">{reporterOf(issue)}</span>
            </span>
          </td>
        );
      case 'priority':
        return (
          <td className="px-3 py-2">
            <span className="flex items-center gap-1.5">
              <PriorityIcon priority={issue.priority} size={13} />
              <span className="text-[12.5px] text-[var(--text-muted)] capitalize">
                {issue.priority}
              </span>
            </span>
          </td>
        );
      case 'status':
        return (
          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <StatusMenu issue={issue} />
          </td>
        );
      case 'resolution':
        return (
          <td className="px-3 py-2 text-[12.5px] text-[var(--text-muted)]">
            {issue.status === 'done' ? 'Done' : 'Unresolved'}
          </td>
        );
      case 'created':
        return (
          <td className="px-3 py-2 text-[12.5px] text-[var(--text-muted)] whitespace-nowrap">
            {fmtDate(issue.createdAt)}
          </td>
        );
      case 'updated':
        return (
          <td className="px-3 py-2 text-[12.5px] text-[var(--text-muted)] whitespace-nowrap">
            {fmtDate(issue.updatedAt)}
          </td>
        );
      default:
        return <td className="px-3 py-2" />;
    }
  };

  return (
    <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-[var(--bg-raised)]">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all work items"
                  className="w-3.5 h-3.5 rounded accent-[var(--accent)] align-middle"
                />
              </th>
              {orderedCols.map((col) => (
                <th
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`px-3 py-2.5 cursor-grab active:cursor-grabbing ${col.className ?? ''} ${dragCol === col.id ? 'opacity-40' : ''}`}
                  title="Drag to reorder column"
                >
                  {col.sortKey ? (
                    <button
                      onClick={() => toggleSort(col.sortKey!)}
                      className="flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-secondary)] motion-press"
                    >
                      {col.label}
                      {sortKey === col.sortKey ? (
                        sortDir === 1 ? (
                          <ArrowUp size={11} className="text-[var(--accent-bright)]" />
                        ) : (
                          <ArrowDown size={11} className="text-[var(--accent-bright)]" />
                        )
                      ) : (
                        <ChevronsUpDown size={11} className="opacity-0 hover:opacity-60" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                      {col.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className={`border-b border-[var(--bg-raised)]/60 last:border-0 cursor-pointer motion-interactive ${
                  selected.has(issue.id) ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--bg-surface)]'
                }`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onIssueClick(issue);
                }}
              >
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(issue.id)}
                    onChange={() => toggleRow(issue.id)}
                    aria-label={`Select ${issue.key}`}
                    className="w-3.5 h-3.5 rounded accent-[var(--accent)] align-middle"
                  />
                </td>
                {columnOrder.map((colId) => (
                  <React.Fragment key={colId}>{renderCell(issue, colId)}</React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={<ListPlus size={20} aria-hidden="true" />}
          title="No issues yet"
          hint="Create the first one and it will show up here in the list."
          actionLabel="Create issue"
          onAction={openCreate}
        />
      ) : (
        <div className="flex items-center gap-4 px-3 py-2 border-t border-[var(--bg-raised)]">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] motion-press"
          >
            <Plus size={13} /> Create
          </button>
          <span className="flex-1" />
          <span className="text-[12px] text-[var(--text-faint)]">
            {selected.size} of {issues.length} selected
          </span>
        </div>
      )}
    </div>
  );
}
