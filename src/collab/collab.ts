/**
 * Multiplayer engine for M4ster Tracker (TEST build).
 *
 * Two transports, one store:
 *  - Server mode (signed in + KV backend): share/invite membership,
 *    presence heartbeats and chat go through the workspace function
 *    (?collab=1 — the Hobby plan caps serverless functions at 12), and
 *    board data syncs through the shared workspace record, so every
 *    member is literally on the same board.
 *  - Local mode (signed out / no backend): BroadcastChannel between
 *    tabs of this browser — presence, live cursors, chat and activity
 *    still work, so multiplayer can be tried with two tabs.
 */
import { create } from 'zustand';
import { useProjectStore } from '@/store/projectStore';
import { getDeviceId, workspaceStorageKey } from '@/sync/workspace';

export const CHAT_CHANNELS = ['general', 'board', 'random'] as const;
export type ChatChannel = (typeof CHAT_CHANNELS)[number];

export interface Peer {
  id: string;
  name: string;
  color: string;
  online: boolean;
  view: string | null;
  issueKey: string | null;
  activity: string | null;
  activityTs: number | null;
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}

export interface ChatMsg {
  id: string;
  authorId: string;
  author: string;
  text: string;
  ts: number;
}

export interface ActivityItem {
  id: string;
  author: string;
  text: string;
  ts: number;
}

export interface ShareState {
  shared: boolean;
  isOwner: boolean;
  isMember: boolean;
  code: string | null;
}

export type PanelTab = 'people' | 'chat' | 'activity';

const PEER_COLORS = [
  '#ff2d78', '#ff8c00', '#00b368', '#00a8e8', '#7c4dff',
  '#e5493a', '#1f7aec', '#c2189e', '#0e9594', '#e2a03f',
];

export function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
}

export function guestName(): string {
  try {
    let n = localStorage.getItem('mt_collab_name');
    if (!n) {
      n = `Guest ${Math.floor(100 + Math.random() * 900)}`;
      localStorage.setItem('mt_collab_name', n);
    }
    return n;
  } catch {
    return 'Guest';
  }
}

interface CollabState {
  mode: 'off' | 'server' | 'local';
  slug: string;
  selfId: string;
  selfName: string;
  peers: Peer[];
  share: ShareState;
  messages: Record<ChatChannel, ChatMsg[]>;
  activity: ActivityItem[];
  panelOpen: boolean;
  panelTab: PanelTab;
  activeChannel: ChatChannel;
  unread: number;
  busyShare: boolean;
  setPanel: (open: boolean, tab?: PanelTab) => void;
  setActiveChannel: (c: ChatChannel) => void;
  sendChat: (text: string) => void;
  enableShare: () => Promise<void>;
  disableShare: () => Promise<void>;
  leaveBoard: () => Promise<void>;
  joinWithCode: (code: string) => Promise<boolean>;
}

export const useCollabStore = create<CollabState>()((set, get) => ({
  mode: 'off',
  slug: 'default',
  selfId: '',
  selfName: '',
  peers: [],
  share: { shared: false, isOwner: false, isMember: false, code: null },
  messages: { general: [], board: [], random: [] },
  activity: [],
  panelOpen: false,
  panelTab: 'people',
  activeChannel: 'general',
  unread: 0,
  busyShare: false,

  setPanel: (open, tab) =>
    set((s) => ({
      panelOpen: open,
      panelTab: tab ?? s.panelTab,
      unread: open ? 0 : s.unread,
    })),
  setActiveChannel: (c) => set({ activeChannel: c }),

  sendChat: (text) => {
    const t = text.trim();
    if (!t) return;
    const s = get();
    const msg: ChatMsg = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      authorId: s.selfId,
      author: s.selfName,
      text: t.slice(0, 1000),
      ts: Date.now(),
    };
    if (s.mode === 'server') {
      void serverPost(s.slug, { action: 'chat', channel: s.activeChannel, text: msg.text }).then(
        () => refreshChat(s.activeChannel)
      );
    } else if (s.mode === 'local') {
      appendMessage(s.activeChannel, msg);
      persistLocalChat(s.slug, s.activeChannel);
      bcSend({ type: 'chat', channel: s.activeChannel, msg });
    }
  },

  enableShare: async () => {
    const s = get();
    const projectState = useProjectStore.getState();
    const project = projectState.project;
    if (!project) return;

    // Sharing the default board would collide with everyone else's
    // default board — move this board to its own named workspace first.
    if (s.slug === 'default') {
      const newSlug = `team-${Math.random().toString(36).slice(2, 7)}`;
      try {
        localStorage.setItem(workspaceStorageKey(newSlug), JSON.stringify(project));
        localStorage.setItem(`mt_autoshare_${newSlug}`, '1');
      } catch {
        // Non-fatal — navigation below still carries the session.
      }
      window.location.assign(`/w/${newSlug}`);
      return;
    }

    set({ busyShare: true });
    try {
      if (s.mode === 'server') {
        await projectState.syncPush();
        const res = await serverPost(s.slug, { action: 'enable', data: project });
        if (res && typeof res.code === 'string') {
          set({ share: { shared: true, isOwner: true, isMember: true, code: res.code } });
          await refreshState();
          pushActivity('You', 'shared this board — invite link is live');
          projectState.pushToast('success', 'Board shared — send the invite link to your team');
        } else {
          projectState.pushToast('error', 'Could not share this board');
        }
      } else {
        const code = Math.random().toString(36).slice(2, 10);
        try {
          localStorage.setItem(`mt_share_${s.slug}`, JSON.stringify({ code, owner: s.selfName }));
          localStorage.setItem(`mt_joined_${s.slug}`, '1');
        } catch {
          // Non-fatal.
        }
        set({ share: { shared: true, isOwner: true, isMember: true, code } });
        pushActivity('You', 'shared this board — invite link is live');
        projectState.pushToast('success', 'Board shared (this browser) — invite link copied below');
      }
    } finally {
      set({ busyShare: false });
    }
  },

  disableShare: async () => {
    const s = get();
    set({ busyShare: true });
    try {
      if (s.mode === 'server') await serverPost(s.slug, { action: 'disable' });
      try {
        localStorage.removeItem(`mt_share_${s.slug}`);
      } catch {
        // Non-fatal.
      }
      set({ share: { shared: false, isOwner: false, isMember: false, code: null } });
      useProjectStore.getState().pushToast('info', 'Sharing stopped');
    } finally {
      set({ busyShare: false });
    }
  },

  leaveBoard: async () => {
    const s = get();
    if (s.mode === 'server') await serverPost(s.slug, { action: 'leave' });
    try {
      localStorage.removeItem(`mt_joined_${s.slug}`);
    } catch {
      // Non-fatal.
    }
    set({ share: { ...s.share, isMember: false } });
    useProjectStore.getState().pushToast('info', 'You left this shared board');
  },

  joinWithCode: async (code) => {
    const s = get();
    const c = code.trim().toLowerCase();
    if (!c) return false;
    if (s.mode === 'server') {
      const res = await serverPostRaw(s.slug, { action: 'join', code: c });
      if (res.ok) {
        set({ share: { shared: true, isOwner: false, isMember: true, code: c } });
        pushActivity('You', 'joined this board');
        useProjectStore.getState().pushToast('success', 'Joined the shared board');
        void useProjectStore.getState().initializeProject();
        await refreshState();
        return true;
      }
      useProjectStore.getState().pushToast('error', 'Invite code did not work');
      return false;
    }
    // Local mode: accept the code this browser issued / any code from a link.
    try {
      localStorage.setItem(`mt_joined_${s.slug}`, '1');
    } catch {
      // Non-fatal.
    }
    set((st) => ({ share: { ...st.share, shared: true, isMember: true, code: c } }));
    pushActivity('You', 'joined this board');
    useProjectStore.getState().pushToast('success', 'Joined the shared board');
    return true;
  },
}));

/* ------------------------------------------------------------------ */
/* Server transport                                                    */
/* ------------------------------------------------------------------ */

/** Collab rides on the workspace function (Hobby 12-function cap). */
function collabUrl(slug: string): string {
  return `/api/workspaces/${encodeURIComponent(slug)}?collab=1`;
}

async function serverPostRaw(
  slug: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; json: unknown }> {
  try {
    const res = await fetch(collabUrl(slug), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

async function serverPost(
  slug: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const r = await serverPostRaw(slug, body);
  return r.ok ? (r.json as Record<string, unknown>) : null;
}

interface ServerMember {
  id: string;
  name: string;
  online: boolean;
  view: string | null;
  issueKey: string | null;
  activity: string | null;
  activityTs: number | null;
  cursor: { x: number; y: number } | null;
}

async function refreshState(): Promise<void> {
  const s = useCollabStore.getState();
  try {
    const res = await fetch(collabUrl(s.slug));
    if (!res.ok) return;
    const body = (await res.json()) as {
      shared: boolean;
      isOwner: boolean;
      isMember: boolean;
      code?: string;
      members?: ServerMember[];
    };
    const peers: Peer[] = (body.members ?? [])
      .filter((m) => m.id !== s.selfId)
      .map((m) => ({
        id: m.id,
        name: m.name,
        color: colorForId(m.id),
        online: m.online,
        view: m.view,
        issueKey: m.issueKey,
        activity: m.activity,
        activityTs: m.activityTs,
        cursor: m.cursor,
        lastSeen: m.online ? Date.now() : 0,
      }));
    // Feed peers' latest activities into the activity stream (deduped).
    for (const p of peers) {
      if (p.activity && p.activityTs) notePeerActivity(p.name, p.activity, p.activityTs);
    }
    useCollabStore.setState({
      share: {
        shared: body.shared,
        isOwner: body.isOwner,
        isMember: body.isMember,
        code: body.code ?? s.share.code,
      },
      peers,
    });
  } catch {
    // Offline — keep last known state.
  }
}

async function refreshChat(channel: ChatChannel): Promise<void> {
  const s = useCollabStore.getState();
  try {
    const res = await fetch(
      `${collabUrl(s.slug)}&type=chat&channel=${channel}`
    );
    if (!res.ok) return;
    const body = (await res.json()) as { messages: ChatMsg[] };
    const before = s.messages[channel].length;
    useCollabStore.setState((st) => ({
      messages: { ...st.messages, [channel]: body.messages ?? [] },
      unread:
        !st.panelOpen && (body.messages?.length ?? 0) > before
          ? st.unread + ((body.messages?.length ?? 0) - before)
          : st.unread,
    }));
  } catch {
    // Offline — keep local copy.
  }
}

/* ------------------------------------------------------------------ */
/* Local transport (BroadcastChannel)                                  */
/* ------------------------------------------------------------------ */

let bc: BroadcastChannel | null = null;
const localPeers = new Map<string, Peer>();

function bcSend(msg: Record<string, unknown>): void {
  try {
    bc?.postMessage(msg);
  } catch {
    // Channel closed — ignore.
  }
}

function loadLocalChat(slug: string): void {
  const msgs: Record<ChatChannel, ChatMsg[]> = { general: [], board: [], random: [] };
  for (const ch of CHAT_CHANNELS) {
    try {
      const raw = localStorage.getItem(`mt_chat_${slug}_${ch}`);
      if (raw) msgs[ch] = JSON.parse(raw) as ChatMsg[];
    } catch {
      // Corrupt storage — start fresh for that channel.
    }
  }
  useCollabStore.setState({ messages: msgs });
}

function persistLocalChat(slug: string, channel: ChatChannel): void {
  try {
    const msgs = useCollabStore.getState().messages[channel].slice(-100);
    localStorage.setItem(`mt_chat_${slug}_${channel}`, JSON.stringify(msgs));
  } catch {
    // Non-fatal.
  }
}

function localShareState(slug: string, selfName: string): void {
  try {
    const raw = localStorage.getItem(`mt_share_${slug}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { code: string; owner: string };
      useCollabStore.setState({
        share: {
          shared: true,
          isOwner: parsed.owner === selfName,
          isMember: true,
          code: parsed.code,
        },
      });
    }
  } catch {
    // Non-fatal.
  }
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const seenPeerActivity = new Set<string>();

function notePeerActivity(name: string, text: string, ts: number): void {
  const key = `${name}|${ts}|${text}`;
  if (seenPeerActivity.has(key)) return;
  seenPeerActivity.add(key);
  if (seenPeerActivity.size > 300) seenPeerActivity.clear();
  pushActivity(name, text, ts);
}

export function pushActivity(author: string, text: string, ts = Date.now()): void {
  useCollabStore.setState((st) => ({
    activity: [
      { id: `${ts}-${Math.random().toString(36).slice(2, 7)}`, author, text, ts },
      ...st.activity,
    ].slice(0, 40),
  }));
}

function appendMessage(channel: ChatChannel, msg: ChatMsg): void {
  useCollabStore.setState((st) => {
    if (st.messages[channel].some((m) => m.id === msg.id)) return st;
    return {
      messages: { ...st.messages, [channel]: [...st.messages[channel], msg].slice(-200) },
      unread: !st.panelOpen && msg.authorId !== st.selfId ? st.unread + 1 : st.unread,
    };
  });
}

/** What the local user is doing right now, for the presence ping. */
function currentPresence() {
  const ps = useProjectStore.getState();
  return {
    view: ps.activeView,
    issueKey: ps.showIssueModal && ps.selectedIssue ? ps.selectedIssue.key : null,
    activity: latestOwnActivity,
    activityTs: latestOwnActivityTs,
    cursor: cursorRef,
  };
}

let cursorRef: { x: number; y: number } | null = null;
let latestOwnActivity: string | null = null;
let latestOwnActivityTs: number | null = null;
let lastInteractAt = 0;

/* ------------------------------------------------------------------ */
/* Engine lifecycle                                                    */
/* ------------------------------------------------------------------ */

const timers: number[] = [];
let unsubStore: (() => void) | null = null;

function every(ms: number, fn: () => void): void {
  timers.push(window.setInterval(fn, ms));
}

export async function startCollab(slug: string, user: { id: string; username: string } | null) {
  stopCollab();
  const selfId = user ? user.id : getDeviceId();
  const selfName = user ? user.username : guestName();
  useCollabStore.setState({
    slug,
    selfId,
    selfName,
    peers: [],
    activity: [],
    unread: 0,
    share: { shared: false, isOwner: false, isMember: false, code: null },
  });

  // Decide transport: server only helps when signed in (it 401s otherwise).
  let mode: 'server' | 'local' = 'local';
  if (user) {
    try {
      const res = await fetch(collabUrl(slug));
      if (res.ok) mode = 'server';
    } catch {
      mode = 'local';
    }
  }
  useCollabStore.setState({ mode });
  wireActivityWatcher();
  wireCursor();

  if (mode === 'server') {
    await refreshState();
    const st = useCollabStore.getState();
    if (st.share.isMember) {
      for (const ch of CHAT_CHANNELS) void refreshChat(ch);
    }
    const ping = () => {
      const s = useCollabStore.getState();
      if (!s.share.isMember) return;
      void serverPost(slug, { action: 'ping', ...currentPresence() });
    };
    ping();
    every(4000, ping);
    every(4000, () => void refreshState());
    every(5000, () => {
      const s = useCollabStore.getState();
      if (s.share.isMember) void refreshChat(s.activeChannel);
    });
    // Shared board: keep pulling the shared record so card moves land live.
    every(9000, () => {
      const s = useCollabStore.getState();
      if (s.share.shared && s.share.isMember && !document.hidden) {
        void useProjectStore.getState().syncPull();
      }
    });
  } else {
    loadLocalChat(slug);
    localShareState(slug, selfName);
    startLocalTransport(slug, selfId, selfName);
  }
}

export function stopCollab() {
  for (const t of timers) window.clearInterval(t);
  timers.length = 0;
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
  if (bc) {
    try {
      bc.close();
    } catch {
      // Already closed.
    }
    bc = null;
  }
  localPeers.clear();
  useCollabStore.setState({ mode: 'off', peers: [] });
}

function startLocalTransport(slug: string, selfId: string, selfName: string) {
  if (typeof BroadcastChannel === 'undefined') return;
  bc = new BroadcastChannel(`mt-collab-v1-${slug}`);
  bc.onmessage = (ev: MessageEvent) => {
    const data = ev.data as Record<string, unknown>;
    if (!data || typeof data !== 'object') return;
    const kind = data.type as string;
    if (kind === 'ping') {
      const p = data.peer as Peer;
      if (!p || p.id === selfId) return;
      localPeers.set(p.id, { ...p, lastSeen: Date.now() });
      useCollabStore.setState({ peers: [...localPeers.values()] });
    } else if (kind === 'cursor') {
      const p = localPeers.get(data.id as string);
      if (p) {
        p.cursor = data.cursor as { x: number; y: number };
        p.lastSeen = Date.now();
        useCollabStore.setState({ peers: [...localPeers.values()] });
      }
    } else if (kind === 'chat') {
      const msg = data.msg as ChatMsg;
      const channel = data.channel as ChatChannel;
      if (msg && channel) {
        appendMessage(channel, msg);
        persistLocalChat(slug, channel);
      }
    } else if (kind === 'activity') {
      const item = data.item as ActivityItem;
      if (item) {
        useCollabStore.setState((st) => ({
          activity: [item, ...st.activity].slice(0, 40),
        }));
      }
    }
  };

  const broadcastPing = () => {
    const joined = (() => {
      try {
        return localStorage.getItem(`mt_joined_${slug}`) === '1';
      } catch {
        return false;
      }
    })();
    const pres = currentPresence();
    bcSend({
      type: 'ping',
      peer: {
        id: selfId,
        name: selfName,
        color: colorForId(selfId),
        online: true,
        view: pres.view,
        issueKey: pres.issueKey,
        activity: joined || useCollabStore.getState().share.shared ? pres.activity : pres.activity,
        activityTs: pres.activityTs,
        cursor: cursorRef,
        lastSeen: Date.now(),
      } satisfies Peer,
    });
  };
  broadcastPing();
  every(3000, broadcastPing);
  every(2000, () => {
    const now = Date.now();
    let changed = false;
    for (const [id, p] of localPeers) {
      if (now - p.lastSeen > 9000) {
        localPeers.delete(id);
        changed = true;
      }
    }
    if (changed) useCollabStore.setState({ peers: [...localPeers.values()] });
  });
}

/* ------------------------------------------------------------------ */
/* Cursor + activity watchers                                          */
/* ------------------------------------------------------------------ */

let cursorWired = false;
function wireCursor() {
  if (cursorWired) return;
  cursorWired = true;
  let lastSent = 0;
  window.addEventListener('pointermove', (e) => {
    cursorRef = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    lastInteractAt = Date.now();
    const now = Date.now();
    if (now - lastSent > 70) {
      lastSent = now;
      const s = useCollabStore.getState();
      if (s.mode === 'local') bcSend({ type: 'cursor', id: s.selfId, cursor: cursorRef });
    }
  });
  window.addEventListener('pointerdown', () => {
    lastInteractAt = Date.now();
  });
  window.addEventListener('keydown', () => {
    lastInteractAt = Date.now();
  });
}

function wireActivityWatcher() {
  interface Sig {
    status: string;
    assignee?: string;
    title: string;
  }
  let prev = new Map<string, Sig>();
  let primed = false;
  unsubStore = useProjectStore.subscribe((state) => {
    const project = state.project;
    if (!project) return;
    const next = new Map<string, Sig>();
    for (const i of project.issues) {
      next.set(i.id, { status: i.status, assignee: i.assignee, title: i.title });
    }
    if (!primed) {
      primed = true;
      prev = next;
      return;
    }
    // Only attribute changes to this user when they just interacted —
    // remote syncs land without local input and are announced by the
    // client that made them.
    const mine = Date.now() - lastInteractAt < 2500;
    if (mine) {
      const events: string[] = [];
      for (const [id, sig] of next) {
        const before = prev.get(id);
        const issue = project.issues.find((i) => i.id === id);
        const key = issue?.key ?? 'issue';
        if (!before) {
          events.push(`created ${key} “${sig.title.slice(0, 40)}”`);
        } else {
          if (before.status !== sig.status) {
            const label =
              { backlog: 'Backlog', todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[
                sig.status as 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
              ] ?? sig.status;
            events.push(`moved ${key} to ${label}`);
          }
          if (before.assignee !== sig.assignee && sig.assignee) {
            events.push(`assigned ${key} to ${sig.assignee}`);
          }
        }
      }
      for (const text of events.slice(0, 3)) {
        latestOwnActivity = text;
        latestOwnActivityTs = Date.now();
        pushActivity(useCollabStore.getState().selfName || 'You', text);
        if (useCollabStore.getState().mode === 'local') {
          bcSend({
            type: 'activity',
            item: {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              author: useCollabStore.getState().selfName,
              text,
              ts: Date.now(),
            } satisfies ActivityItem,
          });
        }
      }
    }
    prev = next;
  });
}

/** Invite link for the current board (carries workspace path + code). */
export function inviteLink(slug: string, code: string | null): string {
  const base = slug === 'default' ? `${window.location.origin}/` : `${window.location.origin}/w/${slug}`;
  return code ? `${base}?join=${code}` : base;
}
