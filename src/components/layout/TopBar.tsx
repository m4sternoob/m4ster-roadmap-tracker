import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CircleHelp,
  Cloud,
  CloudOff,
  Loader2,
  LogOut,
  PanelLeft,
  Plus,
  Save,
  Search,
  Settings,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Avatar } from '@/components/issues/Avatar';
import { ThemePicker } from '@/components/ui/ThemePicker';
import { DEFAULT_SLUG } from '@/sync/workspace';
import { useAuth } from '@/sync/auth';

function SyncStatus() {
  const syncStatus = useProjectStore((s) => s.syncStatus);
  const syncNeedsLogin = useProjectStore((s) => s.syncNeedsLogin);
  const workspaceSlug = useProjectStore((s) => s.workspaceSlug);
  const syncPush = useProjectStore((s) => s.syncPush);
  const { openAuth, authAvailable } = useAuth();

  const label = workspaceSlug === DEFAULT_SLUG ? 'My board' : workspaceSlug;

  if (syncNeedsLogin && authAvailable) {
    return (
      <button
        onClick={() => openAuth('login')}
        className="hidden md:flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-medium text-[var(--accent-bright)] hover:bg-[var(--bg-surface)] btn-artcraft"
        title="Sign in to sync your boards across devices"
      >
        <Cloud size={14} />
        <span>Sign in to sync</span>
      </button>
    );
  }

  if (syncStatus === 'local') {
    return (
      <span
        className="hidden md:flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"
        title="Sync not connected — working locally on this device"
      >
        <CloudOff size={14} />
        <span className="max-w-28 truncate">{label}</span>
      </span>
    );
  }

  return (
    <span className="hidden md:flex items-center gap-1.5">
      <button
        onClick={() => syncPush()}
        className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] btn-artcraft"
        title="Save to cloud now"
      >
        {syncStatus === 'saving' || syncStatus === 'loading' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : syncStatus === 'synced' ? (
          <Cloud size={14} className="text-[var(--accent-bright)]" />
        ) : syncStatus === 'error' ? (
          <CloudOff size={14} className="text-red-400" />
        ) : (
          <Save size={14} />
        )}
        <span className="max-w-28 truncate">{label}</span>
      </button>
    </span>
  );
}

function AccountButton() {
  const { user, authAvailable, authLoading, openAuth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!authAvailable || authLoading) {
    return (
      <span className="ml-0.5 rounded-full" aria-label="Account" title="Master Noob">
        <Avatar name="Master Noob" size={26} />
      </span>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => openAuth('login')}
        className="ml-1 h-8 px-3 rounded-md border border-[var(--bg-raised)] text-[13px] font-medium text-[var(--text-secondary)] hover:border-[var(--chrome)] hover:text-[var(--text-primary)] btn-artcraft"
      >
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} className="relative ml-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full motion-press"
        aria-label={`Account: ${user.username}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.username} size={26} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 w-52 rounded-lg border border-[var(--bg-raised)] bg-[var(--bg-deep)] shadow-xl shadow-black/40 p-1.5 z-50 animate-scale-in"
        >
          <div className="px-2.5 py-2 border-b border-[var(--bg-raised)] mb-1">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
              {user.username}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Boards sync across devices</p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

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
        className="hidden md:block p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
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
        <SyncStatus />
        <button
          onClick={openCreate}
          className="h-8 px-3 rounded-md bg-[var(--accent)] text-white text-[13px] font-medium flex items-center gap-1.5 btn-artcraft shadow-sm"
        >
          <Plus size={15} /> <span className="hidden sm:inline">Create</span>
        </button>
        <ThemePicker />
        <button
          className="hidden sm:block relative p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
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
          className="hidden sm:block p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={17} />
        </button>
        <AccountButton />
      </div>
    </header>
  );
}
