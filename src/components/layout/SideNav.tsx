import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
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
  User,
  Users,
  Boxes,
} from 'lucide-react';
import { useProjectStore, type SidebarSectionKey } from '@/store/projectStore';
import type { Issue, Project } from '@/types';
import { Avatar } from '@/components/issues/Avatar';
import { LogoMark } from '@/components/ui/LogoMark';

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
      className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] motion-interactive nav-pill ${
        active
          ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)] font-medium'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && chevron && (
        <ChevronRight size={13} className="text-[var(--text-faint)] shrink-0" />
      )}
      {!collapsed && external && (
        <ExternalLink size={12} className="text-[var(--text-faint)] shrink-0" />
      )}
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

/** A sidebar button that opens a small floating panel (fixed-positioned). */
function NavPopover({
  icon: Icon,
  label,
  active = false,
  collapsed = false,
  onOpen,
  panel,
  panelLabel,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onOpen?: () => void;
  panel: React.ReactNode;
  panelLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: Math.min(r.top, window.innerHeight - 320), left: r.right + 8 });
      onOpen?.();
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title={collapsed ? label : undefined}
        aria-expanded={open}
        className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] motion-interactive nav-pill ${
          active || open
            ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)] font-medium'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
        } ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon size={16} className="shrink-0" />
        {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
        {!collapsed && <ChevronRight size={13} className="text-[var(--text-faint)] shrink-0" />}
      </button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={panelLabel}
          className="fixed z-50 w-64 rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-2xl shadow-black/40 p-1.5 animate-scale-in max-h-[300px] overflow-y-auto"
          style={{ top: pos.top, left: pos.left }}
        >
          {panel}
        </div>
      )}
    </>
  );
}

function IssueRow({ issue, onOpen }: { issue: Issue; onOpen: (i: Issue) => void }) {
  return (
    <button
      onClick={() => onOpen(issue)}
      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left motion-interactive text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
    >
      <span className="text-[11px] font-mono text-[var(--text-faint)] shrink-0 w-14 truncate">
        {issue.key}
      </span>
      <span className="flex-1 text-[13px] truncate">{issue.title}</span>
    </button>
  );
}

const SECTION_META: { key: SidebarSectionKey; label: string }[] = [
  { key: 'shortcuts', label: 'Shortcuts (For you, Recent, Starred)' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'spaces', label: 'Spaces' },
  { key: 'views', label: 'Views' },
  { key: 'manage', label: 'Manage' },
];

export function SideNav({ project, collapsed }: { project: Project; collapsed: boolean }) {
  const activeView = useProjectStore((s) => s.activeView);
  const setActiveView = useProjectStore((s) => s.setActiveView);
  const setSelectedIssue = useProjectStore((s) => s.setSelectedIssue);
  const setShowIssueModal = useProjectStore((s) => s.setShowIssueModal);
  const setShowSettingsModal = useProjectStore((s) => s.setShowSettingsModal);
  const pushToast = useProjectStore((s) => s.pushToast);
  const applyBoardFilterPatch = useProjectStore((s) => s.applyBoardFilterPatch);
  const setBoardFilterPanelOpen = useProjectStore((s) => s.setBoardFilterPanelOpen);
  const recentIds = useProjectStore((s) => s.recentIds);
  const starredIds = useProjectStore((s) => s.starredIds);
  const sections = useProjectStore((s) => s.sidebarSections);
  const toggleSidebarSection = useProjectStore((s) => s.toggleSidebarSection);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const issues = project.issues ?? [];
  const byId = new Map(issues.map((i) => [i.id, i]));
  const recentIssues = recentIds.map((id) => byId.get(id)).filter((i): i is Issue => !!i);
  const starredIssues = starredIds.map((id) => byId.get(id)).filter((i): i is Issue => !!i);

  const openIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const goBoard = () => setActiveView('board');

  const assignees = Array.from(
    issues.reduce((m, i) => {
      const name = i.assignee ?? 'Unassigned';
      m.set(name, (m.get(name) ?? 0) + 1);
      return m;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  const epics = (project.epics ?? []).map((e) => ({
    ...e,
    count: issues.filter((i) => i.epicId === e.id).length,
  }));

  const notInDemo = (what: string) =>
    pushToast('info', `${what} isn't part of this demo workspace`);

  return (
    <aside
      className={`shrink-0 h-full bg-[var(--bg-app)] border-r border-[var(--bg-raised)] hidden md:flex flex-col py-2 px-1.5 gap-0.5 overflow-y-auto overflow-x-hidden motion-layout ${
        collapsed ? 'w-[52px]' : 'w-60'
      }`}
      aria-label="Primary navigation"
    >
      {sections.shortcuts && (
        <>
          <Item
            icon={User}
            label="For you"
            collapsed={collapsed}
            onClick={() => {
              applyBoardFilterPatch({ onlyMine: true, assignees: [], quickAssignee: null });
              goBoard();
            }}
          />
          <NavPopover
            icon={Clock}
            label="Recent"
            collapsed={collapsed}
            panelLabel="Recently viewed issues"
            panel={
              recentIssues.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-[var(--text-muted)] text-center">
                  Open an issue and it'll show up here.
                </p>
              ) : (
                recentIssues.map((i) => <IssueRow key={i.id} issue={i} onOpen={openIssue} />)
              )
            }
          />
          <NavPopover
            icon={Star}
            label="Starred"
            collapsed={collapsed}
            panelLabel="Starred issues"
            panel={
              starredIssues.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-[var(--text-muted)] text-center">
                  Hover an issue card and hit the star to pin it here.
                </p>
              ) : (
                starredIssues.map((i) => <IssueRow key={i.id} issue={i} onOpen={openIssue} />)
              )
            }
          />
        </>
      )}

      {sections.workspace && (
        <>
          <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
          <Item
            icon={LayoutGrid}
            label="Apps"
            collapsed={collapsed}
            onClick={() => notInDemo('Apps')}
          />
          <Item
            icon={ListFilter}
            label="Plans"
            collapsed={collapsed}
            active={activeView === 'sprints'}
            onClick={() => setActiveView('sprints')}
          />
        </>
      )}

      {sections.spaces && (
        <>
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
                  onClick={() => notInDemo('Creating new spaces')}
                >
                  <Plus size={13} />
                </button>
                <button
                  className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
                  aria-label="Space settings"
                  title="Space settings"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Ellipsis size={13} />
                </button>
              </span>
            )}
          </div>

          {/* Current project */}
          <button
            title={collapsed ? project.name : undefined}
            onClick={goBoard}
            className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md motion-interactive ${
              collapsed ? 'justify-center px-0' : ''
            } ${
              activeView === 'board'
                ? 'bg-[var(--accent)]/15 text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
            }`}
            aria-current={activeView === 'board' ? 'page' : undefined}
          >
            <span className="w-6 h-6 rounded-[5px] bg-[var(--accent-deep)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              <LogoMark size={14} />
            </span>
            {!collapsed && (
              <span className="flex-1 text-left truncate text-[13px] font-medium">
                {project.name}
              </span>
            )}
            {!collapsed && <ChevronRight size={13} className="text-[var(--text-faint)] shrink-0" />}
          </button>

          {!collapsed && (
            <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)] select-none">
              Recent
            </div>
          )}
          <Item icon={Boxes} label="Sample roadmap" collapsed={collapsed} onClick={goBoard} />
        </>
      )}

      {sections.views && (
        <>
          <SectionLabel collapsed={collapsed}>Views</SectionLabel>
          <Item
            icon={Filter}
            label="Filters"
            collapsed={collapsed}
            active={activeView === 'board'}
            onClick={() => {
              goBoard();
              // Let the view switch commit before opening the panel.
              setTimeout(() => setBoardFilterPanelOpen(true), 60);
            }}
          />
          <Item
            icon={LayoutDashboard}
            label="Dashboards"
            collapsed={collapsed}
            active={activeView === 'reports'}
            onClick={() => setActiveView('reports')}
          />
        </>
      )}

      <div className="flex-1" />

      {sections.manage && (
        <>
          <SectionLabel collapsed={collapsed}>Manage</SectionLabel>
          <Item
            icon={Boxes}
            label="Assets"
            external
            collapsed={collapsed}
            onClick={() => notInDemo('Asset management')}
          />
          <NavPopover
            icon={Users}
            label="Teams"
            collapsed={collapsed}
            panelLabel="Team members"
            panel={
              <div>
                <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                  Members
                </p>
                {assignees.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => {
                      applyBoardFilterPatch({
                        onlyMine: false,
                        assignees: name === 'Unassigned' ? [] : [name],
                        quickAssignee: null,
                      });
                      goBoard();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg motion-interactive text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                  >
                    <Avatar name={name} size={22} />
                    <span className="flex-1 text-left text-[13px] truncate">{name}</span>
                    <span className="text-[11px] text-[var(--text-faint)] font-semibold">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            }
          />
          <NavPopover
            icon={Target}
            label="Goals"
            collapsed={collapsed}
            panelLabel="Goals (epics)"
            panel={
              <div>
                <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                  Goals
                </p>
                {epics.length === 0 && (
                  <p className="px-3 py-4 text-[13px] text-[var(--text-muted)] text-center">
                    No goals yet — create an epic to start one.
                  </p>
                )}
                {epics.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      applyBoardFilterPatch({ epicIds: [e.id] });
                      goBoard();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg motion-interactive text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: e.color }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left text-[13px] truncate">{e.name}</span>
                    <span className="text-[11px] text-[var(--text-faint)] font-semibold">
                      {e.count}
                    </span>
                  </button>
                ))}
              </div>
            }
          />
          <NavPopover
            icon={Rocket}
            label="Projects"
            collapsed={collapsed}
            panelLabel="Projects"
            panel={
              <button
                onClick={goBoard}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg motion-interactive text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                <span className="w-6 h-6 rounded-[5px] bg-[var(--accent-deep)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  <LogoMark size={14} />
                </span>
                <span className="flex-1 text-left text-[13px] truncate">{project.name}</span>
                <span className="text-[11px] text-[var(--text-faint)] font-semibold">
                  {issues.length}
                </span>
              </button>
            }
          />
          <div>
            <button
              onClick={() => setCustomizeOpen((v) => !v)}
              aria-expanded={customizeOpen}
              className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] motion-interactive nav-pill ${
                customizeOpen
                  ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? 'Customize sidebar' : undefined}
            >
              <Settings2 size={16} className="shrink-0" />
              {!collapsed && <span className="flex-1 text-left truncate">Customize sidebar</span>}
              {!collapsed && (
                <ChevronDown
                  size={13}
                  className={`text-[var(--text-faint)] shrink-0 transition-transform ${customizeOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            {customizeOpen && !collapsed && (
              <div className="mt-1 ml-1 mr-1 rounded-lg border border-[var(--chrome)] bg-[var(--bg-surface)] p-1.5 animate-scale-in">
                {SECTION_META.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] motion-interactive"
                  >
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={() => toggleSidebarSection(key)}
                      className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                    />
                    <span className="flex-1">{label}</span>
                    {sections[key] && <Check size={13} className="text-[var(--accent-bright)]" />}
                  </label>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
