import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind classes for the panel box. Defaults to the standard card. */
  panel?: string;
  /** Centered dialog (default) or top-anchored palette style. */
  align?: 'center' | 'top';
  label?: string;
}

const DEFAULT_PANEL =
  'max-w-md w-full rounded-xl border border-white/10 bg-[#1c1f26] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in max-h-[90vh] overflow-y-auto';

/**
 * Shared modal chrome: fading blurred backdrop, scaling panel entry,
 * Escape to close, click-outside to close, body scroll lock.
 */
export function ModalShell({
  onClose,
  children,
  panel = DEFAULT_PANEL,
  align = 'center',
  label,
}: ModalShellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-fade-in ${
        align === 'center' ? 'items-center p-4' : 'items-start px-4 pt-[12vh]'
      }`}
    >
      <div className={panel} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
  icon,
}: {
  title: string;
  onClose: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
        {icon}
        {title}
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-100 motion-press"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/** Shared field styling for modal forms. */
export const modalFieldClass =
  'w-full rounded-lg border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40';

/** Shared footer button row. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
      {children}
    </div>
  );
}

export const modalPrimaryBtn =
  'rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-400 motion-press flex items-center gap-2';

export const modalGhostBtn =
  'rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 motion-press';
