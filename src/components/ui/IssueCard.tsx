import type { Issue, Status } from '@/types';
import { PRIORITIES, ISSUE_TYPES, STATUSES } from '@/types';
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Zap,
  Calendar,
  Pencil,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

const PRIORITY_ICONS: Record<string, any> = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
  critical: AlertTriangle,
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function IssueCard({ issue, onClick }: { issue: Issue; onClick: (issue: Issue) => void }) {
  const priority = PRIORITIES.find((p) => p.value === issue.priority)!;
  const type = ISSUE_TYPES.find((t) => t.value === issue.type)!;
  const PriorityIcon = PRIORITY_ICONS[issue.priority] ?? ArrowRight;
  const moveIssue = useProjectStore((s) => s.moveIssue);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Move-to-status menu: fixed-positioned so the card's overflow-hidden
  // never clips it. Closes on outside click, Escape, or selection.
  const [moveOpen, setMoveOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!moveOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (moveBtnRef.current?.contains(e.target as Node)) return;
      setMoveOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoveOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moveOpen]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const openMoveMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (moveOpen) {
      setMoveOpen(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: Math.max(8, r.right - 160) });
    setMoveOpen(true);
  };

  const pickStatus = (status: Status) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoveOpen(false);
    if (status !== issue.status) moveIssue(issue.id, status);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(issue)}
      className="group relative bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-dark-border pl-3 pr-3 py-2.5 cursor-grab active:cursor-grabbing overflow-hidden motion-interactive hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(issue);
        }
      }}
      role="button"
      aria-label={`${issue.key}: ${issue.title}`}
      aria-grabbed={isDragging}
      aria-describedby={`issue-${issue.id}-description`}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: priority.color }}
        aria-hidden="true"
      />

      {/* Quick actions: revealed on hover / keyboard focus, never cluttering the card. */}
      <div
        className={`absolute top-2 right-2 flex items-center gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white/95 dark:bg-dark-card/95 shadow-sm backdrop-blur motion-interactive ${
          moveOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        }`}
      >
        <button
          type="button"
          aria-label={`Edit ${issue.key}`}
          title="Open details"
          onClick={(e) => {
            e.stopPropagation();
            onClick(issue);
          }}
          onPointerDown={stop}
          className="p-1.5 rounded-md text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
        <button
          ref={moveBtnRef}
          type="button"
          aria-label={`Move ${issue.key} to another column`}
          aria-haspopup="menu"
          aria-expanded={moveOpen}
          title="Move to column"
          onClick={openMoveMenu}
          onPointerDown={stop}
          className="p-1.5 rounded-md text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
        >
          <ArrowRightLeft size={13} aria-hidden="true" />
        </button>
      </div>

      {moveOpen && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Move ${issue.key} to column`}
          className="fixed z-50 w-40 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xl py-1 motion-interactive"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={stop}
          onPointerDown={stop}
        >
          {STATUSES.map((s) => {
            const current = s.value === issue.status;
            return (
              <button
                key={s.value}
                type="button"
                role="menuitem"
                onClick={pickStatus(s.value)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left motion-interactive ${
                  current
                    ? 'text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-slate-700 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
                {current && <Check size={13} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] shrink-0 leading-none" title={type.label} aria-hidden="true">
            {type.icon}
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-dark-muted truncate">
            {issue.key}
          </span>
        </div>
        <PriorityIcon
          size={13}
          style={{ color: priority.color }}
          className="shrink-0 mt-0.5"
          aria-hidden="true"
        />
      </div>

      <h4
        id={`issue-${issue.id}-description`}
        className="font-medium text-[13px] leading-snug mb-2 text-slate-800 dark:text-dark-text line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 motion-press"
      >
        {issue.title}
      </h4>

      {issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1" role="list" aria-label="Labels">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-dark-muted"
              role="listitem"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {issue.storyPoints > 0 && (
            <span
              className="flex items-center gap-0.5 text-[11px] font-medium text-slate-400 dark:text-dark-muted"
              title="Story points"
            >
              <Zap size={11} className="text-amber-500" aria-hidden="true" />
              {issue.storyPoints}
            </span>
          )}
          {issue.dueDate && (
            <span
              className={`flex items-center gap-0.5 text-[11px] font-medium ${
                isOverdue(issue.dueDate) ? 'text-rose-500' : 'text-slate-400 dark:text-dark-muted'
              }`}
              title="Due date"
            >
              <Calendar size={11} aria-hidden="true" />
              {new Date(issue.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {issue.assignee && (
          <div
            className="w-5 h-5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 text-[9px] font-semibold flex items-center justify-center shrink-0"
            title={issue.assignee}
            aria-label={`Assigned to ${issue.assignee}`}
          >
            {initials(issue.assignee)}
          </div>
        )}
      </div>
    </div>
  );
}
