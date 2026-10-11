import { Ellipsis, Maximize2, Share2, Users, Zap } from 'lucide-react';
import type { Project } from '@/types';
import { useProjectStore, type AppView } from '@/store/projectStore';

const TABS: { id: AppView; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'reports', label: 'Reports' },
];

export function ProjectHeader({ project }: { project: Project }) {
  const { activeView, setActiveView } = useProjectStore();

  return (
    <div className="shrink-0 px-5 pt-3 bg-[#1d2125]">
      <div className="text-[12px] text-[#8c9bab] select-none">Spaces</div>

      <div className="flex items-center gap-3 mt-1">
        <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#388bff] to-[#0c66e4] text-white text-[13px] font-bold flex items-center justify-center shadow-sm shrink-0">
          {project.key.slice(0, 2).toUpperCase()}
        </span>
        <h1 className="text-[19px] font-semibold text-[#e6edf3] tracking-tight truncate">
          {project.name}
        </h1>
        <div className="flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
            aria-label="Team"
            title="Team"
          >
            <Users size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
            aria-label="More actions"
            title="More actions"
          >
            <Ellipsis size={15} />
          </button>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
            aria-label="Share"
            title="Share"
          >
            <Share2 size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
            aria-label="Automations"
            title="Automations"
          >
            <Zap size={15} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
            aria-label="Fullscreen"
            title="Fullscreen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 mt-2" role="tablist" aria-label="Project views">
        {TABS.map(({ id, label }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveView(id)}
              className={`relative px-3 py-2 text-[13.5px] motion-interactive ${
                active ? 'text-[#579dff] font-medium' : 'text-[#8c9bab] hover:text-[#b6c2cf]'
              }`}
            >
              {label}
              {active && (
                <span className="absolute left-2 right-2 -bottom-px h-[2.5px] rounded-full bg-[#579dff]" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="h-px bg-[#2c333a] -mx-5" />
    </div>
  );
}
