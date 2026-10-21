import { useState, type ReactNode } from 'react';
import {
  CalendarRange,
  CloudUpload,
  MousePointerClick,
  Move,
  Sparkles,
  SunMoon,
  UserPlus,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  ModalShell,
  ModalHeader,
  ModalFooter,
  modalPrimaryBtn,
  modalGhostBtn,
} from '@/components/ui/ModalShell';

/**
 * First-run quick tutorial (5 steps) for fresh visitors. Shown once when
 * the workspace was just seeded from demo data, so a stranger never lands
 * on a sample board with zero context. Steps: welcome → moving cards →
 * views → team → make it yours.
 */

interface Step {
  icon: ReactNode;
  title: string;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={22} />,
    title: 'Welcome to M4ster Tracker',
    body: (
      <>
        This is a <strong>live demo board</strong> with sample tasks so you can see how
        everything works. Click around freely — you can&apos;t break anything.
      </>
    ),
  },
  {
    icon: <Move size={22} />,
    title: 'Move work by dragging',
    body: (
      <>
        Drag any card between columns to change its status.{' '}
        <MousePointerClick size={14} className="inline -mt-0.5" /> Click a card to open it —
        details, comments, subtasks, and time logs live inside.
      </>
    ),
  },
  {
    icon: <CalendarRange size={22} />,
    title: 'Board, List, Calendar & more',
    body: (
      <>
        Switch views with the tabs up top — Summary, List, Backlog, Calendar, Timeline,
        Sprints, and Reports. Same work, the angle your team needs.
      </>
    ),
  },
  {
    icon: <UserPlus size={22} />,
    title: 'Bring your team in',
    body: (
      <>
        Hit <strong>Invite</strong> in the top bar to share this board with a link. You get
        live presence, shared editing, and a team chat right on the board.
      </>
    ),
  },
  {
    icon: <SunMoon size={22} />,
    title: 'Make it yours',
    body: (
      <>
        Use the <strong>Sun/Moon</strong> button for day and night, and{' '}
        <strong>Customize</strong> for themes, fonts, and cursors.{' '}
        <CloudUpload size={14} className="inline -mt-0.5" /> Sign in to keep your own boards
        and sync them across devices.
      </>
    ),
  },
];

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const clearWorkspace = useProjectStore((s) => s.clearWorkspace);
  const pushToast = useProjectStore((s) => s.pushToast);
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const startBlank = () => {
    clearWorkspace();
    pushToast('success', 'Blank workspace ready — make it yours');
    onClose();
  };

  return (
    <ModalShell onClose={onClose} label="Welcome to M4ster Tracker">
      <ModalHeader
        title="Quick tour"
        onClose={onClose}
        icon={<Sparkles size={20} className="text-[var(--accent-bright)]" />}
      />
      <div className="px-5 py-5">
        <div
          key={step}
          className="flex flex-col items-center text-center animate-view-enter"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-bright)] shadow-lg shadow-[var(--accent)]/10">
            {current.icon}
          </div>
          <h3 className="mt-4 text-[17px] font-semibold text-[var(--text-primary)]">
            {current.title}
          </h3>
          <p className="mt-2 max-w-[400px] text-sm leading-relaxed text-[var(--text-secondary)]">
            {current.body}
          </p>
        </div>

        {/* progress dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-[var(--accent)]'
                  : i < step
                    ? 'w-1.5 bg-[var(--accent)]/60'
                    : 'w-1.5 bg-[var(--chrome)]'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-[var(--text-faint)]">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
      <ModalFooter>
        {isLast ? (
          <>
            <button type="button" onClick={startBlank} className={modalGhostBtn}>
              Start with a blank board
            </button>
            <button type="button" onClick={onClose} className={modalPrimaryBtn} autoFocus>
              Explore the demo
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} className={modalGhostBtn}>
              Skip tour
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className={modalGhostBtn}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className={modalPrimaryBtn}
              autoFocus
            >
              Next
            </button>
          </>
        )}
      </ModalFooter>
    </ModalShell>
  );
}
