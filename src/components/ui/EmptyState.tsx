import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Helpful empty states: say what's missing and offer the next step. */
export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-16 text-center">
      <span className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-raised)] flex items-center justify-center text-[var(--text-faint)]">
        {icon}
      </span>
      <p className="text-[14px] font-medium text-[var(--text-primary)]">{title}</p>
      {hint && <p className="text-[13px] text-[var(--text-muted)] max-w-[320px]">{hint}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white motion-press inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
