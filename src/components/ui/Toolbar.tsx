import { useRef } from 'react';
import type { Project } from '@/types';
import {
  Plus,
  Download,
  Upload,
  Settings,
  BarChart2,
  Layers,
  List,
  Calendar,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useProjectStore } from '@/store/projectStore';

export function Toolbar({ project, onSearch }: { project: Project; onSearch?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { activeView, setActiveView } = useProjectStore();
  const importInputRef = useRef<HTMLInputElement>(null);

  const views = [
    { id: 'board' as const, label: 'Board', icon: Layers },
    { id: 'backlog' as const, label: 'Backlog', icon: List },
    { id: 'sprints' as const, label: 'Sprints', icon: Calendar },
    { id: 'reports' as const, label: 'Reports', icon: BarChart2 },
  ];

  const handleExport = useProjectStore.getState().exportProject;
  const handleImport = useProjectStore.getState().importProject;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md border-b border-slate-200 dark:border-dark-border">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand + project identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {project.key.slice(0, 2)}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-dark-text">
                  {project.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-dark-muted">
                  {project.key}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-dark-muted">
                {project.issues.length} issues tracked
              </span>
            </div>
          </div>

          {/* View tabs */}
          <nav
            className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/60 rounded-lg p-1"
            role="tablist"
            aria-label="Main views"
          >
            {views.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeView === id}
                onClick={() => setActiveView(id)}
                className={`relative px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium motion-press flex items-center gap-1.5 ${
                  activeView === id
                    ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-500 dark:text-dark-muted hover:text-slate-700 dark:hover:text-dark-text'
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:flex items-center gap-0.5 mr-1 border-r border-slate-200 dark:border-dark-border pr-2">
              <input
                type="file"
                accept=".json"
                id="import-file"
                ref={importInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                onClick={() => importInputRef.current?.click()}
                className="p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
                aria-label="Import project"
                title="Import project"
              >
                <Upload size={16} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
                aria-label="Export project"
                title="Export project"
              >
                <Download size={16} />
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Search button */}
            <button
              onClick={onSearch}
              className="p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
              aria-label="Search (⌘K)"
              title="Search issues (⌘K)"
            >
              <Search size={16} />
            </button>

            <button
              onClick={() => useProjectStore.getState().setShowEpicModal(true)}
              className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
              aria-label="Create Epic"
              title="Create epic"
            >
              <Layers size={16} />
            </button>

            <button
              onClick={() => useProjectStore.getState().setShowSprintModal(true)}
              className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
              aria-label="Create Sprint"
              title="Create sprint"
            >
              <Calendar size={16} />
            </button>

            <button
              onClick={() => useProjectStore.getState().setShowSettingsModal(true)}
              className="p-2 rounded-lg text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-dark-text motion-press"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={16} />
            </button>

            <button
              onClick={() => {
                useProjectStore.getState().setNewIssueDefaultStatus('backlog');
                useProjectStore.getState().setSelectedIssue(null);
                useProjectStore.getState().setShowIssueModal(true);
              }}
              className="ml-1 px-3 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 motion-press flex items-center gap-1.5 shadow-sm shadow-primary-500/30"
            >
              <Plus size={16} /> <span className="hidden sm:inline">New issue</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
