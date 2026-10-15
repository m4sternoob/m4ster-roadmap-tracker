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
 * Body — create: { secret, title, description, dueDate, stats? }
 *   stats: { repos: [{ name, openPRs, merged }] } — rendered as a bar
 *   chart in the Reports tab; stored as JSON after a marker in the
 *   issue description.
 * Body — archive: { secret, action: 'archive', key: 'MT-14' }
 *   Marks the issue archived so it leaves the board/Calendar/Reports views.
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

async function resolveWorkspace(
  env: { url: string; token: string }
): Promise<{ wsKey: string; workspace: any; project: any } | null> {
  // Resolve the owner account (no session on this route).
  // STATUS_INGEST_USERNAME can be a comma-separated list of candidates;
  // first hit wins (covers Google-OAuth vs manual signup usernames).
  const envNames = (process.env.STATUS_INGEST_USERNAME || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const candidates = [...new Set([...envNames, 'm4sternoob'])];
  let userRecord: any = null;
  for (const username of candidates) {
    const rec = await kvGet(env, `user:${username}`);
    if (rec && rec.id) {
      userRecord = rec;
      break;
    }
  }
  if (!userRecord) return null;

  const slug = (process.env.STATUS_INGEST_SLUG || 'default').toLowerCase();
  const wsKey = `u:${userRecord.id}:ws:${slug}`;
  const workspace = await kvGet(env, wsKey);
  if (!workspace || !workspace.data || !Array.isArray(workspace.data.issues)) {
    return null;
  }
  return { wsKey, workspace, project: workspace.data };
}

async function saveWorkspace(
  env: { url: string; token: string },
  wsKey: string,
  workspace: any
) {
  const now = new Date().toISOString();
  workspace.data.updatedAt = now;
  workspace.updatedAt = now;
  await kvSet(env, wsKey, workspace);
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

  const kv = kvEnv();
  if (!kv) {
    return res.status(503).json({ error: 'sync not configured' });
  }

  // Secret-gated archive: { secret, action: 'archive', key: 'MT-14' }
  if (body.action === 'archive' && typeof body.key === 'string') {
    try {
      const ctx = await resolveWorkspace(kv);
      if (!ctx) return res.status(404).json({ error: 'workspace not found' });
      const issue = ctx.project.issues.find((i: any) => i.key === body.key);
      if (!issue) return res.status(404).json({ error: 'issue not found' });
      issue.archived = true;
      issue.updatedAt = new Date().toISOString();
      await saveWorkspace(kv, ctx.wsKey, ctx.workspace);
      return res.status(200).json({ ok: true, key: issue.key, archived: true });
    } catch (e) {
      console.error('status-ingest archive error', e);
      return res.status(500).json({ error: 'archive failed' });
    }
  }

  const { title, description, dueDate, stats } = body;

  if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
    return res.status(400).json({ error: 'title and description required' });
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    return res.status(400).json({ error: 'dueDate must be YYYY-MM-DD' });
  }

  try {
    const ctx = await resolveWorkspace(kv);
    if (!ctx) {
      return res.status(404).json({ error: 'ingest user or workspace not found' });
    }

    const project = ctx.project;
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
    await saveWorkspace(kv, ctx.wsKey, ctx.workspace);

    return res.status(200).json({ ok: true, key: issue.key });
  } catch (e) {
    console.error('status-ingest error', e);
    return res.status(500).json({ error: 'ingest failed' });
  }
}
