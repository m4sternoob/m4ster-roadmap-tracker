/**
 * Collaboration API — /api/collab/:slug
 *
 * Powers multiplayer boards on top of the workspace sync store:
 *  - Share / invite: the board owner enables sharing, gets an invite
 *    code; signed-in users who join with the code become members and
 *    their workspace sync is redirected to one shared record
 *    (see api/workspaces/[slug].ts).
 *  - Presence: members heartbeat what they are viewing / editing and
 *    their cursor position; peers poll it (Figma-style live cursors).
 *  - Team chat: per-board channels (#general, #board, #random),
 *    stored as a capped list in KV.
 *
 * Fully self-contained (no imports): Vercel's function bundler does
 * not resolve shared-module imports for these routes (500s at
 * runtime). Requires a KV database attached (503 without one) and a
 * session cookie (401 without one).
 */

const SLUG_RE = /^[a-z0-9-_]{1,32}$/i;
const CHANNELS = ['general', 'board', 'random'];
const PRESENCE_FRESH_MS = 15000;
const CHAT_KEEP = 200;

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

async function sessionUser(kv: any, req: any): Promise<{ id: string; username: string } | null> {
  try {
    const header = req.headers?.cookie;
    let token: string | null = null;
    if (typeof header === 'string') {
      for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx > 0 && part.slice(0, idx).trim() === 'mt_session') {
          token = decodeURIComponent(part.slice(idx + 1).trim());
        }
      }
    }
    if (!token || token.length > 128) return null;
    const sess = (await kv.get(`sess:${token}`)) as { uid: string } | null;
    if (!sess) return null;
    const uname = (await kv.get(`uid:${sess.uid}`)) as string | null;
    const record = uname
      ? ((await kv.get(`user:${uname}`)) as { id: string; username: string } | null)
      : null;
    return record ? { id: record.id, username: record.username } : null;
  } catch {
    return null;
  }
}

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
function makeCode(): string {
  let out = '';
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

interface ShareRecord {
  code: string;
  ownerId: string;
  createdAt: string;
}

export default async function handler(req: any, res: any) {
  const slug = String(req.query.slug ?? '').toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'invalid workspace slug' });
  }

  const kv = await getKv();
  if (!kv) return res.status(503).json({ error: 'collab not configured' });

  const user = await sessionUser(kv, req);
  if (!user) return res.status(401).json({ error: 'sign in required' });

  const shareKey = `share:${slug}`;
  const membersKey = `share:${slug}:members`;
  const sharedDataKey = `shared:${slug}:data`;

  const getShare = async (): Promise<ShareRecord | null> =>
    ((await kv.get(shareKey)) as ShareRecord | null) ?? null;
  const getMembers = async (): Promise<string[]> => {
    const m = (await kv.get(membersKey)) as string[] | null;
    return Array.isArray(m) ? m : [];
  };

  try {
    if (req.method === 'GET') {
      const type = String(req.query.type ?? 'state');
      const share = await getShare();

      if (!share) {
        return res.status(200).json({ shared: false, isOwner: false, isMember: false, members: [] });
      }
      const members = await getMembers();
      const isOwner = share.ownerId === user.id;
      const isMember = members.includes(user.id);
      if (!isMember) {
        // Board is shared, but this user has not joined — no data leak.
        return res.status(200).json({ shared: true, isOwner, isMember: false, members: [] });
      }

      if (type === 'chat') {
        const channel = String(req.query.channel ?? 'general');
        if (!CHANNELS.includes(channel)) return res.status(400).json({ error: 'bad channel' });
        const raw = (await kv.lrange(`chat:${slug}:${channel}`, 0, CHAT_KEEP - 1)) as string[];
        const messages = (raw ?? [])
          .map((s) => {
            try {
              return JSON.parse(s);
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .reverse();
        return res.status(200).json({ messages });
      }

      // state (default) + presence merged in
      const now = Date.now();
      const memberInfos = [];
      for (const uid of members) {
        const uname = ((await kv.get(`uid:${uid}`)) as string | null) ?? 'member';
        const pres = (await kv.get(`pres:${slug}:${uid}`)) as any;
        const fresh = pres && typeof pres.ts === 'number' && now - pres.ts < PRESENCE_FRESH_MS;
        memberInfos.push({
          id: uid,
          name: uname,
          online: Boolean(fresh),
          view: fresh ? (pres.view ?? null) : null,
          issueKey: fresh ? (pres.issueKey ?? null) : null,
          activity: fresh ? (pres.activity ?? null) : null,
          activityTs: fresh ? (pres.activityTs ?? null) : null,
          cursor: fresh && pres.cursor ? pres.cursor : null,
        });
      }
      return res.status(200).json({
        shared: true,
        isOwner,
        isMember: true,
        code: share.code,
        members: memberInfos,
      });
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};
      const action = String(body.action ?? '');

      if (action === 'enable') {
        const existing = await getShare();
        if (existing && existing.ownerId !== user.id) {
          return res.status(403).json({ error: 'board is shared by someone else' });
        }
        const share: ShareRecord =
          existing ?? { code: makeCode(), ownerId: user.id, createdAt: new Date().toISOString() };
        await kv.set(shareKey, share);
        const members = await getMembers();
        if (!members.includes(user.id)) await kv.set(membersKey, [...members, user.id]);
        // Seed the shared record from the owner's own workspace copy
        // (or the data the client sent) so members land on the same board.
        const sharedExisting = await kv.get(sharedDataKey);
        if (!sharedExisting) {
          const own = (await kv.get(`u:${user.id}:ws:${slug}`)) as any;
          if (own) {
            await kv.set(sharedDataKey, own);
          } else if (body.data) {
            await kv.set(sharedDataKey, {
              data: body.data,
              updatedAt: new Date().toISOString(),
              deviceId: 'share-seed',
            });
          }
        }
        return res.status(200).json({ ok: true, code: share.code });
      }

      if (action === 'join') {
        const share = await getShare();
        if (!share) return res.status(404).json({ error: 'this board is not shared' });
        const code = String(body.code ?? '').trim().toLowerCase();
        if (code !== share.code) return res.status(403).json({ error: 'invalid invite code' });
        const members = await getMembers();
        if (!members.includes(user.id)) await kv.set(membersKey, [...members, user.id]);
        return res.status(200).json({ ok: true });
      }

      if (action === 'leave') {
        const members = await getMembers();
        await kv.set(
          membersKey,
          members.filter((m) => m !== user.id)
        );
        return res.status(200).json({ ok: true });
      }

      if (action === 'disable') {
        const share = await getShare();
        if (!share || share.ownerId !== user.id) {
          return res.status(403).json({ error: 'only the board owner can stop sharing' });
        }
        await kv.del(shareKey);
        await kv.del(membersKey);
        return res.status(200).json({ ok: true });
      }

      // Everything below requires membership of a shared board.
      const share = await getShare();
      const members = share ? await getMembers() : [];
      if (!share || !members.includes(user.id)) {
        return res.status(403).json({ error: 'join this board first' });
      }

      if (action === 'ping') {
        const pres = {
          view: typeof body.view === 'string' ? body.view.slice(0, 24) : null,
          issueKey: typeof body.issueKey === 'string' ? body.issueKey.slice(0, 24) : null,
          activity: typeof body.activity === 'string' ? body.activity.slice(0, 140) : null,
          activityTs: typeof body.activityTs === 'number' ? body.activityTs : null,
          cursor:
            body.cursor &&
            typeof body.cursor.x === 'number' &&
            typeof body.cursor.y === 'number'
              ? { x: body.cursor.x, y: body.cursor.y }
              : null,
          ts: Date.now(),
        };
        await kv.set(`pres:${slug}:${user.id}`, pres, { ex: 60 });
        return res.status(200).json({ ok: true });
      }

      if (action === 'chat') {
        const channel = String(body.channel ?? 'general');
        if (!CHANNELS.includes(channel)) return res.status(400).json({ error: 'bad channel' });
        const text = String(body.text ?? '').trim().slice(0, 1000);
        if (!text) return res.status(400).json({ error: 'empty message' });
        const msg = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          authorId: user.id,
          author: user.username,
          text,
          ts: Date.now(),
        };
        await kv.lpush(`chat:${slug}:${channel}`, JSON.stringify(msg));
        await kv.ltrim(`chat:${slug}:${channel}`, 0, CHAT_KEEP - 1);
        return res.status(200).json({ ok: true, message: msg });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    console.error('collab error', e);
    return res.status(500).json({ error: 'collab failed' });
  }
}
