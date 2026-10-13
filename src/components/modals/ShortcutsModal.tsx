import { Keyboard } from 'lucide-react';
import { ModalShell, ModalHeader } from '@/components/ui/ModalShell';
import { SHORTCUT_LIST } from '@/hooks/useSearch';

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      onClose={onClose}
      label="Keyboard shortcuts"
      panel="max-w-md w-full rounded-xl border border-white/10 bg-[var(--bg-deep)] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title="Keyboard shortcuts"
        onClose={onClose}
        icon={<Keyboard size={20} className="text-slate-400" />}
      />
      <div className="px-5 py-4">
        <ul className="divide-y divide-white/5">
          {SHORTCUT_LIST.map(({ keys, label }) => (
            <li key={label} className="flex items-center justify-between py-2.5">
              <span className="text-[14px] text-slate-300">{label}</span>
              <kbd className="px-2 py-1 rounded-md border border-white/10 bg-white/5 font-mono text-[12px] text-slate-200">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-slate-500">
          Single-key shortcuts work when you're not typing. They pause while any dialog is open.
        </p>
      </div>
    </ModalShell>
  );
}
