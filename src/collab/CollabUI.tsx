import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  Hash,
  Link2,
  MessagesSquare,
  MousePointer2,
  Send,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/issues/Avatar';
import { useProjectStore } from '@/store/projectStore';
import { useAuth } from '@/sync/auth';
import { getWorkspaceSlug } from '@/sync/workspace';
import {
  CHAT_CHANNELS,
  inviteLink,
  startCollab,
  useCollabStore,
  type ChatChannel,
} from '@/collab/collab';

const VIEW_LABELS: Record<string, string> = {
  board: 'Board',
  list: 'List',
  backlog: 'Backlog',
  sprints: 'Sprints',
  reports: 'Reports',
  calendar: 'Calendar',
  timeline: 'Timeline',
  workload: 'Workload',
  archived: 'Archived',
};

function doingText(p: { view: string | null; issueKey: string | null; activity: string | null }): string {
  if (p.issueKey) return `Editing ${p.issueKey}`;
  if (p.activity) return p.activity;
  if (p.view) return `Viewing ${VIEW_LABELS[p.view] ?? p.view}`;
  return 'Online';
}

/** Avatar stack + invite button for the top bar. */
export function PresenceBar() {
  const peers = useCollabStore((s) => s.peers);
  const selfName = useCollabStore((s) => s.selfName);
  const mode = useCollabStore((s) => s.mode);
  const unread = useCollabStore((s) => s.unread);
  const setPanel = useCollabStore((s) => s.setPanel);
  if (mode === 'off' || !selfName) return null;
  const online = peers.filter((p) => p.online);
  const shown = online.slice(0, 4);

  return (
    <div className="hidden sm:flex items-center gap-1.5 mr-0.5">
      <button
        onClick={() => setPanel(true, 'people')}
        className="flex items-center rounded-full hover:bg-[var(--bg-surface)] py-1 pl-1 pr-1.5 motion-press"
        title={
          online.length
            ? online.map((p) => `${p.name} — ${doingText(p)}`).join('\n')
            : 'Team — invite people to this board'
        }
        aria-label="Team presence"
      >
        <span className="flex -space-x-1.5">
          <span className="relative ring-2 ring-[var(--bg-app)] rounded-full">
            <Avatar name={selfName} size={22} />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[var(--bg-app)]" />
          </span>
          {shown.map((p) => (
            <span key={p.id} className="relative ring-2 ring-[var(--bg-app)] rounded-full">
              <Avatar name={p.name} size={22} />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[var(--bg-app)]" />
            </span>
          ))}
        </span>
        {online.length > shown.length && (
          <span className="text-[11px] text-[var(--text-muted)] ml-1">+{online.length - shown.length}</span>
        )}
      </button>
      <button
        onClick={() => setPanel(true, 'people')}
        className="relative h-7 px-2.5 rounded-full border border-[var(--bg-raised)] text-[12px] font-medium text-[var(--text-secondary)] hover:border-[var(--chrome)] hover:text-[var(--text-primary)] flex items-center gap-1 btn-artcraft"
        aria-label="Invite team and open chat"
      >
        <UserPlus size={13} />
        <span className="hidden lg:inline">Invite</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

/** Figma-style live cursors for peers, positioned over the viewport. */
export function LiveCursors() {
  const peers = useCollabStore((s) => s.peers);
  const withCursor = peers.filter((p) => p.online && p.cursor);
  if (!withCursor.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]" aria-hidden="true">
      {withCursor.map((p) => (
        <div
          key={p.id}
          className="absolute transition-all duration-300 ease-linear"
          style={{
            left: `${(p.cursor!.x * 100).toFixed(2)}%`,
            top: `${(p.cursor!.y * 100).toFixed(2)}%`,
          }}
        >
          <MousePointer2 size={16} style={{ color: p.color }} fill={p.color} />
          <span
            className="ml-3 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: p.color }}
          >
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function PeopleTab() {
  const share = useCollabStore((s) => s.share);
  const mode = useCollabStore((s) => s.mode);
  const slug = useCollabStore((s) => s.slug);
  const selfName = useCollabStore((s) => s.selfName);
  const peers = useCollabStore((s) => s.peers);
  const busyShare = useCollabStore((s) => s.busyShare);
  const enableShare = useCollabStore((s) => s.enableShare);
  const disableShare = useCollabStore((s) => s.disableShare);
  const leaveBoard = useCollabStore((s) => s.leaveBoard);
  const joinWithCode = useCollabStore((s) => s.joinWithCode);
  const { user, openAuth } = useAuth();
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const link = inviteLink(slug, share.code);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked — the link is visible to copy manually.
    }
  };

  return (
    <div className="space-y-4">
      {/* Share card */}
      <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-3.5">
        <div className="flex items-center gap-2 mb-1">
          <Link2 size={15} className="text-[var(--accent-bright)]" />
          <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
            {share.shared ? 'This board is shared' : 'Share this board'}
          </span>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === 'server'
            ? 'Anyone with the invite link who signs in and joins works on this exact board — moves, edits and chat sync live.'
            : 'Sign in to share across devices. While signed out, sharing works between tabs of this browser.'}
        </p>

        {share.shared && share.isMember ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 h-8 px-2 rounded-md bg-[var(--bg-app)] border border-[var(--bg-raised)] text-[11.5px] text-[var(--text-secondary)]"
                aria-label="Invite link"
              />
              <button
                onClick={copyLink}
                className="h-8 px-2.5 rounded-md bg-[var(--accent)] text-white text-[12px] font-medium flex items-center gap-1 btn-artcraft shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            {share.code && (
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Invite code: <span className="font-mono text-[var(--text-secondary)]">{share.code}</span>
              </p>
            )}
            {share.isOwner ? (
              <button
                onClick={() => void disableShare()}
                disabled={busyShare}
                className="text-[12px] text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Stop sharing
              </button>
            ) : (
              <button
                onClick={() => void leaveBoard()}
                className="text-[12px] text-red-400 hover:text-red-300"
              >
                Leave board
              </button>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <button
              onClick={() => void enableShare()}
              disabled={busyShare}
              className="w-full h-9 rounded-full bg-[var(--accent)] text-white text-[13px] font-medium flex items-center justify-center gap-1.5 btn-artcraft disabled:opacity-50"
            >
              <UserPlus size={15} /> {busyShare ? 'Sharing…' : 'Share board + get invite link'}
            </button>
            {!user && (
              <button
                onClick={() => openAuth('login')}
                className="w-full text-[12px] text-[var(--accent-bright)] hover:underline"
              >
                Sign in for cross-device multiplayer
              </button>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Have a code? Paste it here"
                className="flex-1 min-w-0 h-8 px-2 rounded-md bg-[var(--bg-app)] border border-[var(--bg-raised)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
                aria-label="Invite code"
              />
              <button
                onClick={() => void joinWithCode(joinCode)}
                disabled={!joinCode.trim()}
                className="h-8 px-3 rounded-md border border-[var(--bg-raised)] text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 shrink-0"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Who's here */}
      <div>
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
          On this board now
        </h4>
        <ul className="space-y-1">
          <li className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[var(--bg-surface)]">
            <span className="relative">
              <Avatar name={selfName || 'You'} size={26} />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--bg-surface)]" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                {selfName} <span className="text-[var(--text-faint)] font-normal">(you)</span>
              </div>
              <div className="text-[11.5px] text-[var(--text-muted)] truncate">
                {share.isOwner ? 'Board owner' : share.isMember ? 'Member' : 'Only you can see this board'}
              </div>
            </div>
          </li>
          {peers.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface)]">
              <span className="relative">
                <Avatar name={p.name} size={26} />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-app)] ${
                    p.online ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{p.name}</div>
                <div className="text-[11.5px] text-[var(--text-muted)] truncate">
                  {p.online ? doingText(p) : 'Away'}
                </div>
              </div>
            </li>
          ))}
          {peers.length === 0 && (
            <li className="text-[12.5px] text-[var(--text-muted)] px-2 py-1">
              Nobody else yet — send the invite link and they show up here live.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ChatTab() {
  const messages = useCollabStore((s) => s.messages);
  const activeChannel = useCollabStore((s) => s.activeChannel);
  const setActiveChannel = useCollabStore((s) => s.setActiveChannel);
  const sendChat = useCollabStore((s) => s.sendChat);
  const selfId = useCollabStore((s) => s.selfId);
  const share = useCollabStore((s) => s.share);
  const mode = useCollabStore((s) => s.mode);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const list = messages[activeChannel];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length, activeChannel]);

  const locked = mode === 'server' && !share.isMember;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex gap-1 mb-2.5">
        {CHAT_CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => setActiveChannel(c as ChatChannel)}
            className={`h-7 px-2.5 rounded-full text-[12px] font-medium flex items-center gap-1 motion-press ${
              activeChannel === c
                ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Hash size={11} /> {c}
          </button>
        ))}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {list.length === 0 && (
          <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed pt-2">
            No messages in #{activeChannel} yet. Say hi — everyone on this board sees it live.
          </p>
        )}
        {list.map((m) => {
          const mine = m.authorId === selfId;
          return (
            <div key={m.id} className="flex gap-2">
              <Avatar name={m.author} size={24} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
                    {mine ? 'You' : m.author}
                  </span>
                  <span className="text-[10.5px] text-[var(--text-faint)]">
                    {new Date(m.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] leading-snug break-words">{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {locked ? (
        <p className="text-[12px] text-[var(--text-muted)] border border-[var(--bg-raised)] rounded-lg p-2.5 mt-2">
          Join this shared board (People tab) to use team chat.
        </p>
      ) : (
        <form
          className="flex items-center gap-1.5 mt-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            sendChat(draft);
            setDraft('');
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message #${activeChannel}`}
            className="flex-1 min-w-0 h-9 px-3 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-raised)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--chrome)]"
            aria-label={`Message #${activeChannel}`}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center btn-artcraft disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </form>
      )}
    </div>
  );
}

function ActivityTab() {
  const activity = useCollabStore((s) => s.activity);
  if (!activity.length) {
    return (
      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
        Nothing yet. When you or a teammate creates, moves or assigns a card, it lands here — so you
        can see what everyone is doing.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {activity.map((a) => (
        <li key={a.id} className="flex gap-2 text-[12.5px]">
          <Avatar name={a.author} size={20} />
          <div className="min-w-0">
            <span className="font-medium text-[var(--text-primary)]">{a.author}</span>{' '}
            <span className="text-[var(--text-secondary)]">{a.text}</span>
            <div className="text-[10.5px] text-[var(--text-faint)]">
              {new Date(a.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Right-side team drawer: People / Chat / Activity. */
export function CollabPanel() {
  const panelOpen = useCollabStore((s) => s.panelOpen);
  const panelTab = useCollabStore((s) => s.panelTab);
  const setPanel = useCollabStore((s) => s.setPanel);
  if (!panelOpen) return null;

  const tabs = [
    { id: 'people' as const, label: 'People', icon: Users },
    { id: 'chat' as const, label: 'Chat', icon: MessagesSquare },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Team panel">
      <button
        className="absolute inset-0 bg-black/40 w-full h-full cursor-default"
        onClick={() => setPanel(false)}
        aria-label="Close team panel"
      />
      <aside className="animate-drawer-in absolute right-0 top-0 h-full w-[min(380px,100vw)] bg-[var(--bg-deep)] border-l border-[var(--bg-raised)] shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center gap-1 px-3.5 h-12 shrink-0 border-b border-[var(--bg-raised)]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPanel(true, id)}
              className={`h-8 px-3 rounded-full text-[12.5px] font-medium flex items-center gap-1.5 motion-press ${
                panelTab === id
                  ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setPanel(false)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col">
          {panelTab === 'people' && <PeopleTab />}
          {panelTab === 'chat' && <ChatTab />}
          {panelTab === 'activity' && <ActivityTab />}
        </div>
      </aside>
    </div>
  );
}

/**
 * Mounts the collab engine for the current workspace + auth user and
 * handles invite links (?join=CODE) and the auto-share hand-off after
 * a default board is moved to a named workspace.
 */
export function CollabRoot() {
  const { user, openAuth } = useAuth();
  const projectReady = useProjectStore((s) => Boolean(s.project));
  const startedFor = useRef<string>('');

  useEffect(() => {
    if (!projectReady) return;
    const slug = getWorkspaceSlug();
    const key = `${slug}|${user?.id ?? 'guest'}`;
    if (startedFor.current === key) return;
    startedFor.current = key;
    let cancelled = false;

    void (async () => {
      await startCollab(slug, user ? { id: user.id, username: user.username } : null);
      if (cancelled) return;
      const state = useCollabStore.getState();
      const params = new URLSearchParams(window.location.search);

      // Auto-share hand-off: board was just moved here to be shared.
      let autoShared = false;
      try {
        if (localStorage.getItem(`mt_autoshare_${slug}`)) {
          localStorage.removeItem(`mt_autoshare_${slug}`);
          autoShared = true;
          state.setPanel(true, 'people');
          await state.enableShare();
        }
      } catch {
        // Non-fatal.
      }

      const join = params.get('join');
      if (join && !autoShared) {
        params.delete('join');
        const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState(null, '', clean);
        if (state.mode === 'server' && !user) {
          useProjectStore.getState().pushToast('info', 'Sign in to join this shared board');
          openAuth('login');
          try {
            localStorage.setItem(`mt_pending_join_${slug}`, join);
          } catch {
            // Non-fatal.
          }
        } else {
          state.setPanel(true, 'people');
          await state.joinWithCode(join);
        }
      } else if (!join && state.mode === 'server' && user) {
        // Returning after sign-in with a stashed invite.
        try {
          const pending = localStorage.getItem(`mt_pending_join_${slug}`);
          if (pending && !state.share.isMember) {
            localStorage.removeItem(`mt_pending_join_${slug}`);
            await state.joinWithCode(pending);
          }
        } catch {
          // Non-fatal.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectReady, user, openAuth]);

  return (
    <>
      <LiveCursors />
      <CollabPanel />
    </>
  );
}
