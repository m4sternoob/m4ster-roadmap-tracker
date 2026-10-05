import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg motion-press"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-slate-600 dark:text-dark-muted mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 motion-press"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 motion-press flex items-center gap-2"
            >
              <Check size={16} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
