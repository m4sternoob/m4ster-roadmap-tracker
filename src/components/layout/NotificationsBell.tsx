import { useEffect, useRef, useState } from 'react';
import { Bell, AtSign, UserPlus, MessageSquare, Clock } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { NotificationType } from '@/types';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  mention: AtSign,
  assignment: UserPlus,
  comment: MessageSquare,
  due: Clock,
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useProjectStore((s) => s.notifications);
  const markNotificationRead = useProjectStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useProjectStore((s) => s.markAllNotificationsRead);
  const clearNotifications = useProjectStore((s) => s.clearNotifications);
  const setSelectedIssue = useProjectStore((s) => s.setSelectedIssue);
  const setShowIssueModal = useProjectStore((s) => s.setShowIssueModal);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
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
  }, [open ]);

  const openIssue = (n: (typeof notifications)[number]) => {
    if (!n.issueId) return;
    const issue = useProjectStore.getState().project?.issues.find((i) => i.id === n.issueId);
    if (!issue) return;
    markNotificationRead(n.id);
    setSelectedIssue(issue);
    setShowIssueModal(true);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] motion-press"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        title="Notifications"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-app)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-10 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-2xl shadow-black/40 animate-scale-in"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--bg-raised)]">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-[12px] text-[var(--accent-bright)] hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
              Nothing yet. @mention someone in a comment or assign an issue and it'll show up here.
            </p>
          ) : (
            <ul>
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => openIssue(n)}
                      className={`w-full text-left px-3.5 py-3 flex gap-3 border-b border-[var(--bg-raised)] last:border-0 hover:bg-[var(--bg-raised)]/50 motion-press ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-[var(--bg-raised)] flex items-center justify-center">
                        <Icon size={14} className="text-[var(--accent-bright)]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-bright)] shrink-0" />}
                          <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                            {n.title}
                          </span>
                        </span>
                        <span className="block text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                          {n.body}
                        </span>
                        <span className="block text-[11px] text-[var(--text-faint)] mt-1">
                          {timeAgo(n.createdAt)}
                          {n.issueKey ? ` · ${n.issueKey}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
