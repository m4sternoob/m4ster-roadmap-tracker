import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, ListPlus } from 'lucide-react';
import type { Issue, Priority, Project, Status } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { StatusPill } from '@/components/issues/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectStore } from '@/store/projectStore';

type SortKey = 'key' | 'title' | 'status' | 'priority' | 'assignee' | 'storyPoints' | 'dueDate';

const STATUS_ORDER: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

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
    case 'storyPoints':
      return a.storyPoints - b.storyPoints;
    case 'dueDate':
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  }
}

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: null, label: 'Type', className: 'w-12' },
  { key: 'key', label: 'Key', className: 'w-24' },
  { key: 'title', label: 'Summary' },
  { key: 'status', label: 'Status', className: 'w-32' },
  { key: 'assignee', label: 'Assignee', className: 'w-36' },
  { key: 'priority', label: 'Priority', className: 'w-28' },
  { key: 'storyPoints', label: 'Points', className: 'w-16 text-right' },
  { key: 'dueDate', label: 'Due', className: 'w-28' },
];

const COLUMN_ORDER_KEY = 'mt_list_column_order_v1';
const DEFAULT_ORDER = ['type', 'key', 'title', 'status', 'assignee', 'priority', 'storyPoints', 'dueDate'];

function loadColumnOrder(): string[] {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate: must contain all default columns
      if (Array.isArray(parsed) && DEFAULT_ORDER.every(k => parsed.includes(k))) {
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

  const saveColumnOrder = (order: string[]) => {
    setColumnOrder(order);
    try {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
    } catch {}
  };

  const handleDragStart = (e: React.DragEvent, colKey: string) => {
    setDragCol(colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!dragCol || dragCol === targetKey) return;
    const newOrder = [...columnOrder];
    const fromIdx = newOrder.indexOf(dragCol);
    const toIdx = newOrder.indexOf(targetKey);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragCol);
    saveColumnOrder(newOrder);
    setDragCol(null);
  };

  // Map column keys to their definitions
  const colDef = (key: string) => COLUMNS.find(c => (c.key ?? 'type') === key)!;
  const orderedCols = columnOrder.map(colDef);

  const issues = useMemo(() => {
    const sorted = [...project.issues].filter((i) => !i.archived).sort((a, b) => compare(a, b, sortKey));
    return sortDir === 1 ? sorted : sorted.reverse();
  }, [project.issues, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const openCreate = () => {
    const s = useProjectStore.getState();
    s.setNewIssueDefaultStatus('backlog');
    s.setNewIssuePreset(null);
    s.setSelectedIssue(null);
    s.setShowIssueModal(true);
  };

  // Render a table cell for the given column key
  const renderCell = (issue: Issue, colKey: string) => {
    switch (colKey) {
      case 'type':
        return (
          <td className="px-3 py-2">
            <IssueTypeIcon type={issue.type} size={16} />
          </td>
        );
      case 'key':
        return (
          <td className="px-3 py-2 font-mono text-[12px] text-[var(--text-muted)] whitespace-nowrap">
            {issue.key}
          </td>
        );
      case 'title':
        return (
          <td className="px-3 py-2 text-[13.5px] text-[var(--text-primary)] max-w-[320px] truncate">
            {issue.title}
          </td>
        );
      case 'status':
        return (
          <td className="px-3 py-2">
            <StatusPill status={issue.status} />
          </td>
        );
      case 'assignee':
        return (
          <td className="px-3 py-2">
            {issue.assignee ? (
              <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                <Avatar name={issue.assignee} size={20} />
                <span className="truncate max-w-[100px]">{issue.assignee}</span>
              </span>
            ) : (
              <span className="text-[12.5px] text-[var(--text-faint)]">Unassigned</span>
            )}
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
      case 'storyPoints':
        return (
          <td className="px-3 py-2 text-right text-[13px] text-[var(--text-secondary)]">
            {issue.storyPoints > 0 ? (
              issue.storyPoints
            ) : (
              <span className="text-[var(--chrome)]">–</span>
            )}
          </td>
        );
      case 'dueDate':
        return (
          <td className="px-3 py-2 text-[12.5px] text-[var(--text-muted)] whitespace-nowrap">
            {issue.dueDate ? (
              new Date(issue.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            ) : (
              <span className="text-[var(--chrome)]">–</span>
            )}
          </td>
        );
      default:
        return <td className="px-3 py-2" />;
    }
  };

  return (
    <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--bg-raised)]">
              {orderedCols.map((col) => {
                const colKey = col.key ?? 'type';
                return (
                <th
                  key={col.label}
                  draggable
                  onDragStart={(e) => handleDragStart(e, colKey)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, colKey)}
                  className={`px-3 py-2.5 cursor-grab active:cursor-grabbing ${col.className ?? ''} ${dragCol === colKey ? 'opacity-40' : ''}`}
                  title="Drag to reorder column"
                >
                  {col.key ? (
                    <button
                      onClick={() => toggleSort(col.key!)}
                      className="flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-secondary)] motion-press"
                    >
                      {col.label}
                      {sortKey === col.key ? (
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
                );
              })}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className="border-b border-[var(--bg-raised)]/60 last:border-0 hover:bg-[var(--bg-surface)] cursor-pointer motion-interactive"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onIssueClick(issue);
                }}
              >
                {columnOrder.map((colKey) => (
                  <React.Fragment key={colKey}>
                    {renderCell(issue, colKey)}
                  </React.Fragment>
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
        <div className="px-3 py-2 border-t border-[var(--bg-raised)] text-[12px] text-[var(--text-faint)]">
          {issues.length} issue{issues.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
