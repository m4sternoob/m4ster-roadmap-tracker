import type { Issue, Status } from '@/types';
import { STATUSES } from '@/types';
import { Calendar, Check, MessageSquare, Pencil, ArrowRightLeft, Star } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import type { BoardDensity } from '@/components/board/boardFilters';

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

function formatDue(dueDate: string) {
  return new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function IssueCardView({
  issue,
  epicColor,
  epicName,
  onClick,
  overlay = false,
  density = 'comfortable',
}: {
  issue: Issue;
  epicColor?: string;
  epicName?: string;
  onClick?: (issue: Issue) => void;
  /** Rendered inside the drag overlay: lifted look, no interactions. */
  overlay?: boolean;
  density?: BoardDensity;
}) {
  const compact = density === 'compact' && !overlay;
  const moveIssue = useProjectStore((s) => s.moveIssue);
  const toggleStarred = useProjectStore((s) => s.toggleStarred);
  const isStarred = useProjectStore((s) => s.starredIds.includes(issue.id));

  // Move-to-status menu (fixed positioned, closes on outside click / Escape).
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
    setMenuPos({ top: r.bottom + 4, left: Math.max(8, r.right - 170) });
    setMoveOpen(true);
  };

  const pickStatus = (status: Status) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoveOpen(false);
    if (status !== issue.status) moveIssue(issue.id, status);
  };

  return (
    <div
      className={`relative bg-[var(--bg-surface)] rounded-lg border border-[var(--bg-raised)] motion-interactive glow-hover ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2.5'
      } ${
        overlay
          ? 'border-[var(--chrome)] shadow-2xl shadow-black/60 rotate-[1.5deg] scale-[1.02] cursor-grabbing'
          : 'hover:border-[var(--chrome)] hover:bg-[var(--bg-sunken)] hover:shadow-lg hover:shadow-black/30'
      }`}
    >
      {/* Hover quick actions */}
      {!overlay && (
        <div
          className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 p-0.5 rounded-md border border-[var(--bg-raised)] bg-[var(--bg-sunken)]/95 shadow-md backdrop-blur motion-interactive ${
            moveOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          <button
            type="button"
            aria-label={`${isStarred ? 'Unstar' : 'Star'} ${issue.key}`}
            title={isStarred ? 'Remove star' : 'Star this issue'}
            aria-pressed={isStarred}
            onClick={(e) => {
              e.stopPropagation();
              toggleStarred(issue.id);
            }}
            onPointerDown={stop}
            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
          >
            <Star
              size={13}
              aria-hidden="true"
              className={isStarred ? 'fill-[var(--accent-bright)] text-[var(--accent-bright)]' : ''}
            />
          </button>
          <button
            type="button"
            aria-label={`Open ${issue.key}`}
            title="Open details"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(issue);
            }}
            onPointerDown={stop}
            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
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
            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
          >
            <ArrowRightLeft size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {!overlay && moveOpen && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Move ${issue.key} to column`}
          className="fixed z-50 w-44 rounded-lg border border-[var(--bg-raised)] bg-[var(--bg-sunken)] shadow-2xl shadow-black/50 py-1 animate-scale-in"
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
                    ? 'text-[var(--accent-bright)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {s.label}
                {current && <Check size={13} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Epic lozenge */}
      {epicName && (
        <div className="mb-1.5">
          <span
            className="inline-flex items-center px-1.5 py-px rounded text-[10.5px] font-semibold"
            style={{
              backgroundColor: `${epicColor ?? '#8b5cf6'}26`,
              color: epicColor ?? '#8b5cf6',
            }}
          >
            {epicName}
          </span>
        </div>
      )}

      {/* Title */}
      <h4
        className={`leading-snug text-[var(--text-primary)] line-clamp-2 mb-1.5 pr-6 ${
          compact ? 'text-[12.5px]' : 'text-[13.5px]'
        }`}
      >
        {issue.title}
      </h4>

      {/* Type + key row */}
      <div className="flex items-center gap-1.5 mb-2">
        <IssueTypeIcon type={issue.type} size={15} />
        <span className="font-mono text-[11.5px] text-[var(--text-muted)]">{issue.key}</span>
        {issue.status === 'done' && (
          <Check size={13} className="text-[var(--success)] ml-auto" aria-label="Done" />
        )}
      </div>

      {/* Labels — hidden in compact mode to keep rows tight */}
      {!compact && issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="px-1.5 py-px text-[10.5px] font-medium rounded bg-[var(--chrome)]/60 text-[var(--text-secondary)]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2">
        <PriorityIcon priority={issue.priority} size={14} />
        {!compact && issue.storyPoints > 0 && (
          <span
            className="min-w-[20px] h-5 px-1 rounded-full bg-[var(--chrome)]/70 text-[var(--text-secondary)] text-[11px] font-semibold inline-flex items-center justify-center"
            title="Story points"
          >
            {issue.storyPoints}
          </span>
        )}
        {!compact && issue.dueDate && (
          <span
            className={`flex items-center gap-1 text-[11.5px] font-medium ${
              isOverdue(issue.dueDate) ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
            }`}
            title={`Due ${new Date(issue.dueDate).toLocaleDateString()}`}
          >
            <Calendar size={11} aria-hidden="true" />
            {formatDue(issue.dueDate)}
          </span>
        )}
        {!compact && issue.comments.length > 0 && (
          <span
            className="flex items-center gap-1 text-[11px] text-[var(--text-faint)]"
            title={`${issue.comments.length} comment${issue.comments.length === 1 ? '' : 's'}`}
          >
            <MessageSquare size={11} aria-hidden="true" />
            {issue.comments.length}
          </span>
        )}
        <span className="flex-1" />
        {issue.assignee ? (
          <Avatar name={issue.assignee} size={22} />
        ) : (
          <span
            className="w-[22px] h-[22px] rounded-full border border-dashed border-[var(--chrome)] flex items-center justify-center text-[var(--text-faint)]"
            title="Unassigned"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

export function IssueCard({
  issue,
  epicColor,
  epicName,
  onClick,
  density = 'comfortable',
}: {
  issue: Issue;
  epicColor?: string;
  epicName?: string;
  onClick: (issue: Issue) => void;
  density?: BoardDensity;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  // While dragging, the DragOverlay carries the visual — the original stays
  // put as a faded placeholder instead of trailing the cursor on a transition.
  const style = isDragging
    ? { opacity: 0.35 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(issue)}
      className="group cursor-grab active:cursor-grabbing rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)]"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(issue);
        }
      }}
      role="button"
      aria-label={`${issue.key}: ${issue.title}`}
    >
      <IssueCardView
        issue={issue}
        epicColor={epicColor}
        epicName={epicName}
        onClick={onClick}
        density={density}
      />
    </div>
  );
}
