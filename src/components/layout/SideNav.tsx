import {
  Clock,
  Ellipsis,
  ExternalLink,
  Filter,
  LayoutDashboard,
  LayoutGrid,
  ListFilter,
  Plus,
  Rocket,
  Settings2,
  Star,
  Target,
  Users,
  User,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import type { Project } from '@/types';

function Item({
  icon: Icon,
  label,
  active = false,
  chevron = false,
  external = false,
  collapsed = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  chevron?: boolean;
  external?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] motion-interactive ${
        active
          ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)] font-medium'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && chevron && <ChevronRight size={13} className="text-[var(--text-faint)] shrink-0" />}
      {!collapsed && external && <ExternalLink size={12} className="text-[var(--text-faint)] shrink-0" />}
    </button>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-4" />;
  return (
    <div className="px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)] select-none">
      {children}
    </div>
  );
}

export function SideNav({ project, collapsed }: { project: Project; collapsed: boolean }) {
  return (
    <aside
      className={`shrink-0 h-full bg-[var(--bg-app)] border-r border-[var(--bg-raised)] flex flex-col py-2 px-1.5 gap-0.5 overflow-y-auto overflow-x-hidden motion-layout ${
        collapsed ? 'w-[52px]' : 'w-60'
      }`}
      aria-label="Primary navigation"
    >
      <Item icon={User} label="For you" collapsed={collapsed} />
      <Item icon={Clock} label="Recent" chevron collapsed={collapsed} />
      <Item icon={Star} label="Starred" chevron collapsed={collapsed} />

      <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
      <Item icon={LayoutGrid} label="Apps" collapsed={collapsed} />
      <Item icon={ListFilter} label="Plans" collapsed={collapsed} />

      <div
        className={`flex items-center px-2.5 pt-3 pb-1 ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        {!collapsed && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)] select-none">
            Spaces
          </span>
        )}
        {!collapsed && (
          <span className="flex items-center gap-0.5">
            <button
              className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
              aria-label="Create space"
              title="Create space"
            >
              <Plus size={13} />
            </button>
            <button
              className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
              aria-label="Space options"
              title="Space options"
            >
              <Ellipsis size={13} />
            </button>
          </span>
        )}
      </div>

      {/* Current project */}
      <button
        title={collapsed ? project.name : undefined}
        className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md bg-[var(--accent)]/15 text-[var(--text-primary)] motion-interactive ${
          collapsed ? 'justify-center px-0' : ''
        }`}
        aria-current="page"
      >
        <span className="w-6 h-6 rounded-[5px] bg-gradient-to-br from-[var(--accent-bright)] to-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {project.key.slice(0, 2).toUpperCase()}
        </span>
        {!collapsed && (
          <span className="flex-1 text-left truncate text-[13px] font-medium">{project.name}</span>
        )}
        {!collapsed && <ChevronRight size={13} className="text-[var(--text-faint)] shrink-0" />}
      </button>

      {!collapsed && (
        <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)] select-none">
          Recent
        </div>
      )}
      <Item icon={Boxes} label="Sample roadmap" collapsed={collapsed} />

      <SectionLabel collapsed={collapsed}>Views</SectionLabel>
      <Item icon={Filter} label="Filters" collapsed={collapsed} />
      <Item icon={LayoutDashboard} label="Dashboards" collapsed={collapsed} />

      <div className="flex-1" />

      <SectionLabel collapsed={collapsed}>Manage</SectionLabel>
      <Item icon={Boxes} label="Assets" external collapsed={collapsed} />
      <Item icon={Users} label="Teams" external collapsed={collapsed} />
      <Item icon={Target} label="Goals" external collapsed={collapsed} />
      <Item icon={Rocket} label="Projects" external collapsed={collapsed} />
      <Item icon={Settings2} label="Customize sidebar" collapsed={collapsed} />
    </aside>
  );
}
