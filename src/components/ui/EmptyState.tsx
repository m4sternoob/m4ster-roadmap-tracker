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
      <span className="w-12 h-12 rounded-full bg-[#22272b] border border-[#2c333a] flex items-center justify-center text-[#626f86]">
        {icon}
      </span>
      <p className="text-[14px] font-medium text-[#e6edf3]">{title}</p>
      {hint && <p className="text-[13px] text-[#8c9bab] max-w-[320px]">{hint}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium bg-[#0c66e4] hover:bg-[#0055cc] text-white motion-press inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
