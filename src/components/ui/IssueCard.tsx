import type { Issue, Status } from '@/types';
import { STATUSES } from '@/types';
import {
  AlertTriangle,
  Calendar,
  Check,
  MessageSquare,
  Pencil,
  ArrowRightLeft,
  Star,
  OctagonAlert,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjectStore } from '@/store/projectStore';
import { cardNodes } from '@/lib/cardNodes';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { Pill } from '@/components/ui/Pill';
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
  isRecent = false,
}: {
  issue: Issue;
  epicColor?: string;
  epicName?: string;
  onClick?: (issue: Issue) => void;
  /** Rendered inside the drag overlay: lifted look, no interactions. */
  overlay?: boolean;
  density?: BoardDensity;
  /** Most recently created/moved card: distinctive highlight. */
  isRecent?: boolean;
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
    const close = () => setMoveOpen(false);
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (moveBtnRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    // The menu is fixed-positioned: any scroll (column or page) would
    // detach it from its button, so close it instead of letting it float.
    const onScroll = () => close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
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
      className={`relative bg-[var(--bg-surface)] rounded-lg border motion-interactive glow-hover ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2.5'
      } ${
        isRecent && !overlay
          ? 'border-[var(--danger)] shadow-[0_0_0_1px_var(--danger),0_4px_20px_-6px_var(--danger)]'
          : 'border-[var(--bg-raised)]'
      } ${
        overlay
          ? 'border-[var(--chrome)] shadow-2xl shadow-black/60 rotate-[1.5deg] scale-[1.02] cursor-grabbing'
          : isRecent
            ? 'hover:border-[var(--danger)]'
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

      {/* Move-to-status menu. Portaled to document.body: the column's enter
          animation leaves a permanent transform on it, which would otherwise
          trap this fixed menu in the column's stacking context (menu rendered
          underneath the neighboring column, positioned off from the button).
          Coordinates already come from getBoundingClientRect (viewport space),
          so the portal keeps them exact. */}
      {!overlay &&
        moveOpen &&
        menuPos &&
        createPortal(
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
          </div>,
          document.body
        )}

      {/* Blocked flag (the key lives in the footer row, like the reference cards) */}
      {(issue.blockedBy ?? []).length > 0 && issue.status !== 'done' && (
        <div className="mb-1.5">
          <Pill
            tone="danger"
            title={`Blocked by ${issue.blockedBy.length} issue${issue.blockedBy.length === 1 ? '' : 's'}`}
          >
            <OctagonAlert size={11} aria-hidden="true" /> Blocked
          </Pill>
        </div>
      )}

      {/* Epic tag */}
      {epicName && (
        <div className="mb-1.5">
          <Pill color={epicColor ?? '#8b5cf6'}>{epicName}</Pill>
        </div>
      )}

      {/* Title */}
      <h4
        className={`leading-snug text-[var(--text-primary)] line-clamp-2 mb-1.5 ${
          compact ? 'text-[12.5px]' : 'text-[13px]'
        }`}
      >
        {issue.title}
      </h4>

      {/* Due line — calendar + date, warning triangle when overdue */}
      {!compact && issue.dueDate && (
        <div
          className={`flex items-center gap-1.5 mb-1.5 text-[11.5px] font-medium ${
            isOverdue(issue.dueDate) && issue.status !== 'done'
              ? 'text-[var(--danger)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          <Calendar size={11} aria-hidden="true" />
          {formatDue(issue.dueDate)}
          {isOverdue(issue.dueDate) && issue.status !== 'done' && (
            <AlertTriangle size={12} className="text-amber-400" aria-label="Overdue" />
          )}
        </div>
      )}

      {/* Labels */}
      {!compact && issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((label) => (
            <Pill key={label} tone="neutral">
              {label}
            </Pill>
          ))}
        </div>
      )}

      {/* Meta row — type icon + key on the left (reference card footer) */}
      <div className="flex items-center gap-1.5">
        <IssueTypeIcon type={issue.type} size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
          {issue.key}
        </span>
        {issue.status === 'done' && (
          <Check size={13} className="text-[var(--success)]" aria-label="Done" />
        )}
        <PriorityIcon priority={issue.priority} size={13} />
        {!compact && issue.storyPoints > 0 && (
          <Pill tone="neutral" title="Story points">
            {issue.storyPoints}
          </Pill>
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
          <Avatar name={issue.assignee} size={24} />
        ) : (
          <span
            className="w-6 h-6 rounded-full border border-dashed border-[var(--chrome)] flex items-center justify-center text-[var(--text-faint)]"
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
  isRecent = false,
}: {
  issue: Issue;
  epicColor?: string;
  epicName?: string;
  onClick: (issue: Issue) => void;
  density?: BoardDensity;
  isRecent?: boolean;
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

  // Register the card's node so the board's glide animation can measure it.
  const cardRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (node) cardNodes.set(issue.id, node);
      else cardNodes.delete(issue.id);
    },
    [issue.id, setNodeRef]
  );

  return (
    <div
      ref={cardRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(issue)}
      className="group cursor-grab active:cursor-grabbing rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)]"
      tabIndex={0}
      onKeyDown={(e) => {
        // Compose with dnd-kit's keyboard sensor instead of replacing it:
        // Space lifts / moves / drops the card for keyboard users. Our own
        // handler previously overrode the sensor's, which broke keyboard
        // dragging entirely (Space opened the modal instead of lifting).
        (listeners?.onKeyDown as ((ev: React.KeyboardEvent) => void) | undefined)?.(e);
        // Enter opens the card — unless a keyboard drag is in progress
        // (Enter drops the card there) or the sensor handled the key.
        if (e.key === 'Enter' && !e.defaultPrevented && !isDragging) {
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
        isRecent={isRecent}
      />
    </div>
  );
}
