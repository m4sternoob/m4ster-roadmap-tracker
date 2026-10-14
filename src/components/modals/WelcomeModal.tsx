import { CloudUpload, MousePointerClick, Move, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  ModalShell,
  ModalHeader,
  ModalFooter,
  modalPrimaryBtn,
  modalGhostBtn,
} from '@/components/ui/ModalShell';

const HINTS = [
  {
    icon: <Move size={17} className="shrink-0 text-[var(--accent-bright)]" />,
    text: 'Drag cards between columns to change their status.',
  },
  {
    icon: <MousePointerClick size={17} className="shrink-0 text-[var(--accent-bright)]" />,
    text: 'Click any card for details, comments, subtasks, and time logs.',
  },
  {
    icon: <CloudUpload size={17} className="shrink-0 text-[var(--accent-bright)]" />,
    text: 'Create a free account to keep your own boards and sync them across devices.',
  },
];

/**
 * First-run greeting for fresh visitors. Shown once when the workspace was
 * just seeded from demo data, so a stranger never lands on a board (empty
 * or full of sample tasks) with zero context.
 */
export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const clearWorkspace = useProjectStore((s) => s.clearWorkspace);
  const pushToast = useProjectStore((s) => s.pushToast);

  const startBlank = () => {
    clearWorkspace();
    pushToast('success', 'Blank workspace ready — make it yours');
    onClose();
  };

  return (
    <ModalShell onClose={onClose} label="Welcome to M4ster Tracker">
      <ModalHeader
        title="Welcome to M4ster Tracker"
        onClose={onClose}
        icon={<Sparkles size={20} className="text-[var(--accent-bright)]" />}
      />
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm leading-relaxed text-slate-300">
          You&apos;re looking at a{' '}
          <strong className="font-semibold text-slate-100">live demo board</strong> — a sample
          game-dev project with realistic tasks, sprints, and epics. Click around freely: you
          can&apos;t break anything.
        </p>
        <ul className="space-y-2.5">
          {HINTS.map((hint) => (
            <li key={hint.text} className="flex items-start gap-2.5 text-sm text-slate-300">
              {hint.icon}
              <span className="leading-snug">{hint.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <ModalFooter>
        <button type="button" onClick={startBlank} className={modalGhostBtn}>
          Start with a blank board
        </button>
        <button type="button" onClick={onClose} className={modalPrimaryBtn} autoFocus>
          Explore the demo
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
