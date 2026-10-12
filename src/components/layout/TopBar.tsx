import { Bell, CircleHelp, PanelLeft, Plus, Search, Settings } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Avatar } from '@/components/issues/Avatar';
import { ThemePicker } from '@/components/ui/ThemePicker';

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const openCreate = () => {
    const s = useProjectStore.getState();
    s.setNewIssueDefaultStatus('backlog');
    s.setSelectedIssue(null);
    s.setShowIssueModal(true);
  };

  return (
    <header className="h-12 shrink-0 flex items-center gap-2 px-3 bg-[var(--bg-app)] border-b border-[var(--bg-raised)] relative z-40">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2 pr-2 select-none">
        <span className="brand-pulse w-7 h-7 rounded-[6px] bg-[var(--accent)] flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 4h4v7H7zM13 4h4v7h-4zM7 13h4v7H7z" fill="#fff" opacity="0.95" />
            <path d="M13 13h4v7h-4z" fill="#fff" opacity="0.6" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight hidden sm:inline">
          M4ster
        </span>
      </div>

      {/* Global search */}
      <button
        onClick={() => useProjectStore.getState().setShowSearchModal(true)}
        className="flex-1 max-w-2xl mx-auto flex items-center gap-2 h-8 px-3 rounded-md bg-[var(--bg-surface)] border border-[var(--bg-raised)] text-[var(--text-muted)] text-[13px] hover:border-[var(--chrome)] hover:bg-[var(--bg-sunken)] motion-interactive text-left"
        aria-label="Search (Ctrl+K)"
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 truncate">Search</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--bg-raised)] bg-[var(--bg-app)] text-[var(--text-muted)]">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={openCreate}
          className="h-8 px-3 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white text-[13px] font-medium flex items-center gap-1.5 motion-press shadow-sm"
        >
          <Plus size={15} /> <span className="hidden sm:inline">Create</span>
        </button>
        <ThemePicker />
        <button
          className="relative p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--bg-app)]" />
        </button>
        <button
          className="hidden sm:block p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
          aria-label="Help"
          title="Help"
        >
          <CircleHelp size={17} />
        </button>
        <button
          onClick={() => useProjectStore.getState().setShowSettingsModal(true)}
          className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={17} />
        </button>
        <button
          className="ml-0.5 rounded-full motion-press"
          aria-label="Account"
          title="Master Noob"
        >
          <Avatar name="Master Noob" size={26} />
        </button>
      </div>
    </header>
  );
}
