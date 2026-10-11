import { Bell, CircleHelp, PanelLeft, Plus, Search, Settings } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Avatar } from '@/components/issues/Avatar';

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const openCreate = () => {
    const s = useProjectStore.getState();
    s.setNewIssueDefaultStatus('backlog');
    s.setSelectedIssue(null);
    s.setShowIssueModal(true);
  };

  return (
    <header className="h-12 shrink-0 flex items-center gap-2 px-3 bg-[#1d2125] border-b border-[#2c333a] relative z-40">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2 pr-2 select-none">
        <span className="w-7 h-7 rounded-[6px] bg-[#0c66e4] flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 4h4v7H7zM13 4h4v7h-4zM7 13h4v7H7z" fill="#fff" opacity="0.95" />
            <path d="M13 13h4v7h-4z" fill="#fff" opacity="0.6" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold text-[#e6edf3] tracking-tight hidden sm:inline">
          M4ster
        </span>
      </div>

      {/* Global search */}
      <button
        onClick={() => useProjectStore.getState().setShowSearchModal(true)}
        className="flex-1 max-w-2xl mx-auto flex items-center gap-2 h-8 px-3 rounded-md bg-[#22272b] border border-[#2c333a] text-[#8c9bab] text-[13px] hover:border-[#3d474f] hover:bg-[#282e33] motion-interactive text-left"
        aria-label="Search (Ctrl+K)"
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 truncate">Search</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#2c333a] bg-[#1d2125] text-[#8c9bab]">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={openCreate}
          className="h-8 px-3 rounded-md bg-[#0c66e4] hover:bg-[#0055cc] text-white text-[13px] font-medium flex items-center gap-1.5 motion-press shadow-sm"
        >
          <Plus size={15} /> <span className="hidden sm:inline">Create</span>
        </button>
        <button
          className="relative p-2 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e5493a] ring-2 ring-[#1d2125]" />
        </button>
        <button
          className="hidden sm:block p-2 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
          aria-label="Help"
          title="Help"
        >
          <CircleHelp size={17} />
        </button>
        <button
          onClick={() => useProjectStore.getState().setShowSettingsModal(true)}
          className="p-2 rounded-md text-[#8c9bab] hover:bg-[#22272b] hover:text-[#b6c2cf] motion-press"
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
