import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '@/store/projectStore';
import { useProjectStore } from '@/store/projectStore';

const ICONS: Record<Toast['kind'], { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-[var(--success)]' },
  error: { icon: AlertCircle, color: 'text-[var(--danger)]' },
  info: { icon: Info, color: 'text-[var(--accent-bright)]' },
};

/** Quiet success/error toasts. They confirm, never interrupt. */
export function Toasts() {
  const toasts = useProjectStore((s) => s.toasts);
  const dismissToast = useProjectStore((s) => s.dismissToast);

  return (
    <div
      className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const { icon: Icon, color } = ICONS[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            className="animate-toast-in flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-lg border border-[var(--bg-raised)] bg-[var(--bg-sunken)]/95 shadow-xl shadow-black/40 backdrop-blur max-w-[320px]"
          >
            <Icon size={16} className={`${color} shrink-0`} aria-hidden="true" />
            <span className="text-[13px] text-[var(--text-primary)] leading-snug">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] motion-press shrink-0"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
