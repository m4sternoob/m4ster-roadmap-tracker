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
          ? 'bg-[#0c66e4]/15 text-[#579dff] font-medium'
          : 'text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf]'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && chevron && <ChevronRight size={13} className="text-[#626f86] shrink-0" />}
      {!collapsed && external && <ExternalLink size={12} className="text-[#626f86] shrink-0" />}
    </button>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-4" />;
  return (
    <div className="px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#626f86] select-none">
      {children}
    </div>
  );
}

export function SideNav({ project, collapsed }: { project: Project; collapsed: boolean }) {
  return (
    <aside
      className={`shrink-0 h-full bg-[#1d2125] border-r border-[#2c333a] flex flex-col py-2 px-1.5 gap-0.5 overflow-y-auto overflow-x-hidden motion-layout ${
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#626f86] select-none">
            Spaces
          </span>
        )}
        {!collapsed && (
          <span className="flex items-center gap-0.5">
            <button
              className="p-1 rounded text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf]"
              aria-label="Create space"
              title="Create space"
            >
              <Plus size={13} />
            </button>
            <button
              className="p-1 rounded text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf]"
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
        className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md bg-[#0c66e4]/15 text-[#e6edf3] motion-interactive ${
          collapsed ? 'justify-center px-0' : ''
        }`}
        aria-current="page"
      >
        <span className="w-6 h-6 rounded-[5px] bg-gradient-to-br from-[#388bff] to-[#0c66e4] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {project.key.slice(0, 2).toUpperCase()}
        </span>
        {!collapsed && (
          <span className="flex-1 text-left truncate text-[13px] font-medium">{project.name}</span>
        )}
        {!collapsed && <ChevronRight size={13} className="text-[#626f86] shrink-0" />}
      </button>

      {!collapsed && (
        <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#626f86] select-none">
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
