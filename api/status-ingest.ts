/**
 * Status report ingest — POST /api/status-ingest
 *
 * Lets the scheduled repo-status job file a dated "status report" issue
 * into the owner's tracker workspace, so it shows on the Calendar view
 * (click a day → full report) and in the Reports tab.
 *
 * Auth: shared secret in the `secret` body field, compared against
 * the STATUS_INGEST_SECRET env var. No session cookie needed.
 *
 * Target user/workspace resolve from env (no session):
 *   STATUS_INGEST_USERNAME — tracker username (default "m4sternoob")
 *   STATUS_INGEST_SLUG     — workspace slug (default "default")
 *
 * Body: { secret, title, description, dueDate, stats? }
 *   stats: { repos: [{ name, openPRs, merged }] } — rendered as a bar
 *   chart in the Reports tab; stored as JSON after a marker in the
 *   issue description.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 * Talks to Upstash Redis via plain fetch to the REST API.
 */

function kvEnv() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function kvGet(env: { url: string; token: string }, key: string) {
  const res = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${env.token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data && data.result;
  if (raw == null) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return raw;
  }
}

async function kvSet(env: { url: string; token: string }, key: string, value: any) {
  const res = await fetch(env.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, JSON.stringify(value)]),
  });
  if (!res.ok) throw new Error(`kv set failed: ${res.status}`);
}

function newId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function kvScan(env: { url: string; token: string }, match: string) {
  const res = await fetch(env.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SCAN', '0', 'MATCH', match, 'COUNT', '100']),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const result = data && data.result;
  return Array.isArray(result) && Array.isArray(result[1]) ? result[1] : [];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const secret = process.env.STATUS_INGEST_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'ingest not configured' });
  }

  const body = req.body ?? {};
  if (body.secret !== secret) {
    return res.status(401).json({ error: 'bad secret' });
  }

  const { title, description, dueDate, stats } = body;

  const kv = kvEnv();
  if (!kv) {
    return res.status(503).json({ error: 'sync not configured' });
  }

  // Secret-gated discovery: list tracker usernames to configure ingest.
  // POST { secret, discover: true } — runs before title/description validation.
  if (body.discover === true) {
    try {
      const keys = await kvScan(kv, 'user:*');
      const sample = keys.length > 0 ? await kvGet(kv, keys[0]) : null;
      // Scrub secrets before returning.
      if (sample && typeof sample === 'object') {
        delete sample.passwordHash;
        delete sample.hash;
      }
      return res.status(200).json({ users: keys, sampleKeys: sample ? Object.keys(sample) : null });
    } catch (e) {
      return res.status(500).json({ error: 'discover failed' });
    }
  }

  if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
    return res.status(400).json({ error: 'title and description required' });
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    return res.status(400).json({ error: 'dueDate must be YYYY-MM-DD' });
  }

  try {
    // Resolve the owner account (no session on this route).
    // STATUS_INGEST_USERNAME can be a comma-separated list of candidates;
    // first hit wins (covers Google-OAuth vs manual signup usernames).
    // Hardcoded fallback covers env-var propagation delays.
    const envNames = (process.env.STATUS_INGEST_USERNAME || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const candidates = [...new Set([...envNames, 'harnoorgill102030', 'm4sternoob', 'xyaz'])];
    let userRecord: any = null;
    for (const username of candidates) {
      const rec = await kvGet(kv, `user:${username}`);
      if (rec && rec.id) {
        userRecord = rec;
        break;
      }
    }
    if (!userRecord) {
      return res.status(404).json({ error: 'ingest user not found' });
    }

    const slug = (process.env.STATUS_INGEST_SLUG || 'default').toLowerCase();
    const wsKey = `u:${userRecord.id}:ws:${slug}`;
    const workspace = await kvGet(kv, wsKey);
    if (!workspace || !workspace.data || !Array.isArray(workspace.data.issues)) {
      return res.status(404).json({ error: 'workspace not found' });
    }

    const project = workspace.data;
    const n = typeof project.nextIssueNumber === 'number' ? project.nextIssueNumber : project.issues.length + 1;
    const now = new Date().toISOString();

    // Stash machine-readable stats for the Reports tab chart.
    const statsBlock = stats ? `\n\n<!--status-stats:${JSON.stringify(stats)}-->` : '';

    const issue = {
      id: newId(),
      key: `MT-${n}`,
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 20000) + statsBlock,
      type: 'task',
      status: 'done',
      priority: 'medium',
      storyPoints: 0,
      labels: ['status-report'],
      comments: [],
      createdAt: now,
      updatedAt: now,
      dueDate: dueDate ? String(dueDate).slice(0, 10) : now.slice(0, 10),
      completedAt: now,
      blockedBy: [],
      timeEntries: [],
      archived: false,
    };

    project.issues.push(issue);
    project.nextIssueNumber = n + 1;
    project.updatedAt = now;
    workspace.updatedAt = now;
    await kvSet(kv, wsKey, workspace);

    return res.status(200).json({ ok: true, key: issue.key });
  } catch (e) {
    console.error('status-ingest error', e);
    return res.status(500).json({ error: 'ingest failed' });
  }
}
