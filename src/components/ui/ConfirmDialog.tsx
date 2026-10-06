import { AlertTriangle, Check } from 'lucide-react';
import { ModalShell, ModalHeader, ModalFooter, modalGhostBtn } from '@/components/ui/ModalShell';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <ModalShell
      onClose={onCancel}
      label={title}
      panel="max-w-sm w-full rounded-xl border border-white/10 bg-[#1c1f26] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in"
    >
      <ModalHeader
        title={title}
        onClose={onCancel}
        icon={<AlertTriangle className="text-amber-400" size={20} />}
      />
      <div className="px-5 py-4">
        <p className="text-sm text-slate-400">{message}</p>
      </div>
      <ModalFooter>
        <button onClick={onCancel} className={modalGhostBtn}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 motion-press"
        >
          <Check size={16} /> Confirm
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
