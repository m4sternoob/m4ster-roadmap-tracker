import { useRef } from 'react';
import { Download, Ellipsis, Lock, Maximize2, Share2, Upload, Users, Zap } from 'lucide-react';
import type { Project } from '@/types';
import { useProjectStore, type AppView } from '@/store/projectStore';
import { usePlanStore } from '@/store/planStore';
import { canUse, type ProFeature } from '@/lib/plan';
import { LogoMark } from '@/components/ui/LogoMark';

const TABS: { id: AppView; label: string; feature?: ProFeature }[] = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'backlog', label: 'Backlog', feature: 'view:backlog' },
  { id: 'calendar', label: 'Calendar', feature: 'view:calendar' },
  { id: 'timeline', label: 'Timeline', feature: 'view:timeline' },
  { id: 'workload', label: 'Workload', feature: 'view:workload' },
  { id: 'sprints', label: 'Sprints', feature: 'view:sprints' },
  { id: 'reports', label: 'Reports', feature: 'view:reports' },
  { id: 'archived', label: 'Archived', feature: 'view:archived' },
];

export function ProjectHeader({ project }: { project: Project }) {
  const { activeView, setActiveView, setShowAutomationsModal } = useProjectStore();
  // Subscribe to `plan` (not the `can` helper): the helper is a stable
  // function reference, so selecting it would never re-render on plan change.
  const plan = usePlanStore((s) => s.plan);
  const can = (f: ProFeature) => canUse(plan, f);
  const openUpgrade = usePlanStore((s) => s.openUpgrade);
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
        <span className="icon-pack w-9 h-9 rounded-lg text-[13px] font-bold flex items-center justify-center shrink-0">
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
            data-cursor="download"
            data-magnet
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
            title={can('automations') ? 'Automations' : 'Automations — Pro feature'}
            onClick={() => {
              if (!can('automations')) {
                openUpgrade('automations');
                return;
              }
              setShowAutomationsModal(true);
            }}
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
        {TABS.map(({ id, label, feature }) => {
          const active = activeView === id;
          const locked = feature ? !can(feature) : false;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              title={locked ? `${label} — Pro feature` : label}
              onClick={() => {
                if (locked && feature) {
                  openUpgrade(feature);
                  return;
                }
                setActiveView(id);
              }}
              className={`relative px-3 py-2 text-[13.5px] motion-interactive flex items-center gap-1.5 ${
                active
                  ? 'text-[var(--accent-bright)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
              {locked && <Lock size={11} className="text-[var(--text-faint)]" />}
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
