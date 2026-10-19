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
        <div className="mt-4 flex justify-center">
          <a
            href="https://github.com/m4sternoob/m4ster-roadmap-tracker/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Report an issue on GitHub
          </a>
        </div>
      </div>
    </ModalShell>
  );
}
