/**
 * Workspace sync API — GET/PUT /api/workspaces/:slug
 *
 * Stores the whole workspace JSON in Vercel KV, scoped per signed-in user.
 * Requires a KV database attached to the project
 * (Vercel dashboard → Storage → Create KV).
 * Without KV env vars, returns 503 and the app stays local-only.
 * Without a session cookie, returns 401 — sign in to sync.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

const SLUG_RE = /^[a-z0-9-_]{1,32}$/i;

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

/* ------------------------------------------------------------------ */
/* Collaboration: /api/workspaces/:slug?collab=1                        */
/*                                                                      */
/* Lives inside this function on purpose: the Hobby plan caps a       */
/* deployment at 12 serverless functions and this project is at the   */
/* cap, so multiplayer cannot have its own route file.                */
/*                                                                      */
/* Share/invite (owner enables sharing -> invite code -> signed-in    */
/* users join and become members), presence heartbeats (view,         */
/* editing card, cursor), and per-board team chat channels            */
/* (#general, #board, #random) stored as capped KV lists.             */
/* ------------------------------------------------------------------ */

const COLLAB_CHANNELS = ['general', 'board', 'random'];
const PRESENCE_FRESH_MS = 15000;
const CHAT_KEEP = 200;
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function makeInviteCode(): string {
  let out = '';
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

async function handleCollab(kv: any, user: { id: string; username: string }, slug: string, req: any, res: any) {
  const shareKey = `share:${slug}`;
  const membersKey = `share:${slug}:members`;
  const sharedDataKey = `shared:${slug}:data`;

  const getShare = async (): Promise<{ code: string; ownerId: string; createdAt: string } | null> =>
    ((await kv.get(shareKey)) as { code: string; ownerId: string; createdAt: string } | null) ?? null;
  const getMembers = async (): Promise<string[]> => {
    const m = (await kv.get(membersKey)) as string[] | null;
    return Array.isArray(m) ? m : [];
  };

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
      return res.status(200).json({ shared: true, isOwner, isMember: false, members: [] });
    }

    if (type === 'chat') {
      const channel = String(req.query.channel ?? 'general');
      if (!COLLAB_CHANNELS.includes(channel)) return res.status(400).json({ error: 'bad channel' });
      const raw = (await kv.lrange(`chat:${slug}:${channel}`, 0, CHAT_KEEP - 1)) as string[];
      const messages = (raw ?? [])
        .map((s: string) => {
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
      const share =
        existing ?? { code: makeInviteCode(), ownerId: user.id, createdAt: new Date().toISOString() };
      await kv.set(shareKey, share);
      const members = await getMembers();
      if (!members.includes(user.id)) await kv.set(membersKey, [...members, user.id]);
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
        members.filter((m: string) => m !== user.id)
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
          body.cursor && typeof body.cursor.x === 'number' && typeof body.cursor.y === 'number'
            ? { x: body.cursor.x, y: body.cursor.y }
            : null,
        ts: Date.now(),
      };
      await kv.set(`pres:${slug}:${user.id}`, pres, { ex: 60 });
      return res.status(200).json({ ok: true });
    }

    if (action === 'chat') {
      const channel = String(body.channel ?? 'general');
      if (!COLLAB_CHANNELS.includes(channel)) return res.status(400).json({ error: 'bad channel' });
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
}

export default async function handler(req: any, res: any) {
  const slug = String(req.query.slug ?? '');
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'invalid workspace slug' });
  }

  const kv = await getKv();
  if (!kv) {
    return res.status(503).json({ error: 'sync not configured' });
  }

  // Session lookup (inlined).
  let user: { id: string; username: string } | null = null;
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
    if (token && token.length <= 128) {
      const sess = (await kv.get(`sess:${token}`)) as { uid: string } | null;
      const uname = sess ? ((await kv.get(`uid:${sess.uid}`)) as string | null) : null;
      const record = uname
        ? ((await kv.get(`user:${uname}`)) as { id: string; username: string } | null)
        : null;
      if (record) user = { id: record.id, username: record.username };
    }
  } catch (e) {
    console.error('session lookup error', e);
  }
  if (!user) {
    return res.status(401).json({ error: 'sign in required' });
  }

  // Collaboration sub-API (share/invite, presence, chat).
  if (req.query.collab !== undefined) {
    try {
      return await handleCollab(kv, user, slug.toLowerCase(), req, res);
    } catch (e) {
      console.error('collab error', e);
      return res.status(500).json({ error: 'collab failed' });
    }
  }

  // Per-user namespace — one account, same boards on every device.
  // Exception: if this board is shared and the user is a member,
  // everyone syncs against one shared record instead.
  let key = `u:${user.id}:ws:${slug.toLowerCase()}`;
  try {
    const share = (await kv.get(`share:${slug.toLowerCase()}`)) as { ownerId: string } | null;
    if (share) {
      const members = (await kv.get(`share:${slug.toLowerCase()}:members`)) as string[] | null;
      if (Array.isArray(members) && members.includes(user.id)) {
        key = `shared:${slug.toLowerCase()}:data`;
      }
    }
  } catch (e) {
    console.error('share lookup error', e);
  }

  try {
    if (req.method === 'GET') {
      const record = await kv.get(key);
      if (!record) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(record);
    }

    if (req.method === 'PUT') {
      const { data, updatedAt, deviceId } = req.body ?? {};
      if (!data || typeof updatedAt !== 'string') {
        return res.status(400).json({ error: 'data and updatedAt required' });
      }
      // Last-write-wins: reject stale writes so a lagging device
      // doesn't clobber newer changes.
      const existing = (await kv.get(key)) as { updatedAt: string } | null;
      if (existing && existing.updatedAt > updatedAt) {
        return res.status(409).json(existing);
      }
      const record = {
        data,
        updatedAt,
        deviceId: typeof deviceId === 'string' ? deviceId : 'unknown',
      };
      await kv.set(key, record);
      return res.status(200).json({ ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end();
  } catch (e) {
    console.error('workspace sync error', e);
    return res.status(500).json({ error: 'sync failed' });
  }
}
