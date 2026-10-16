import { useRef } from 'react';
import { Download, Ellipsis, Maximize2, Share2, Upload, Users, Zap } from 'lucide-react';
import type { Project } from '@/types';
import { useProjectStore, type AppView } from '@/store/projectStore';
import { LogoMark } from '@/components/ui/LogoMark';

const TABS: { id: AppView; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'workload', label: 'Workload' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'reports', label: 'Reports' },
  { id: 'archived', label: 'Archived' },
];

export function ProjectHeader({ project }: { project: Project }) {
  const { activeView, setActiveView, setShowAutomationsModal } = useProjectStore();
  const exportProject = useProjectStore((s) => s.exportProject);
  const importProject = useProjectStore((s) => s.importProject);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    try {
      await importProject(file);
    } catch {
      // importProject already toasted the error.
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="shrink-0 px-5 pt-3 bg-[var(--bg-app)]">
      <div className="text-[12px] text-[var(--text-muted)] select-none">Spaces</div>

      <div className="flex items-center gap-3 mt-1">
        <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-bright)] to-[var(--accent)] text-white text-[13px] font-bold flex items-center justify-center shadow-sm shrink-0">
          <LogoMark size={20} />
        </span>
        <h1 className="text-[19px] font-semibold text-[var(--text-primary)] tracking-tight truncate">
          {project.name}
        </h1>
        <div className="flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Team"
            title="Team"
          >
            <Users size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="More actions"
            title="More actions"
          >
            <Ellipsis size={15} />
          </button>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={exportProject}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Export board as JSON"
            title="Export board as JSON"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Import board from JSON"
            title="Import board from JSON"
          >
            <Upload size={15} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
          <button
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Share"
            title="Share"
          >
            <Share2 size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Automations"
            title="Automations"
            onClick={() => setShowAutomationsModal(true)}
          >
            <Zap size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
            aria-label="Fullscreen"
            title="Fullscreen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav
        className="flex items-center gap-1 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Project views"
      >
        {TABS.map(({ id, label }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveView(id)}
              className={`relative px-3 py-2 text-[13.5px] motion-interactive ${
                active
                  ? 'text-[var(--accent-bright)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
              {active && (
                <span className="absolute left-2 right-2 -bottom-px h-[2.5px] rounded-full bg-[var(--accent-bright)]" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="h-px bg-[var(--bg-raised)] -mx-5" />
    </div>
  );
}
