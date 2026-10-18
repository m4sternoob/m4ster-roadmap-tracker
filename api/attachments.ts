/**
 * Attachments API — POST/DELETE /api/attachments
 *
 * Files are stored in Vercel Blob (the file store backing the Phase 3
 * "File attachments" roadmap item). Uploads go through this server route so
 * the read/write token never reaches the browser, and so we can require a
 * signed-in user before anything lands in the store.
 *
 * Setup: Vercel dashboard → Storage → Create Blob store, then attach it to
 * this project (adds BLOB_READ_WRITE_TOKEN). Without it the route answers
 * 503 and the app shows an honest "not connected" message instead of a
 * broken upload button.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes, so the Blob REST calls are
 * plain fetch against the same endpoint the @vercel/blob SDK uses.
 */

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — fits Vercel's serverless body limit
const BLOB_API = 'https://vercel.com/api/blob';
const BLOB_API_VERSION = '13';

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

/** Session lookup (inlined) — mirrors api/workspaces/[slug].ts. */
async function getUser(req: any): Promise<{ id: string; username: string } | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    const header = req.headers?.cookie;
    let token: string | null = null;
    if (typeof header === 'string') {
      for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx > 0 && part.slice(0, idx).trim() === 'mt_session') {
          token = part.slice(idx + 1).trim();
          break;
        }
      }
    }
    if (!token || token.length > 128) return null;
    const sess = (await kv.get(`sess:${token}`)) as { uid: string } | null;
    const uname = sess ? ((await kv.get(`uid:${sess.uid}`)) as string | null) : null;
    const record = uname
      ? ((await kv.get(`user:${uname}`)) as { id: string; username: string } | null)
      : null;
    return record ? { id: record.id, username: record.username } : null;
  } catch (e) {
    console.error('attachments: session lookup error', e);
    return null;
  }
}

function safeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function parseJsonBody(req: any): any {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body ?? {};
}

export default async function handler(req: any, res: any) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return res.status(503).json({ error: 'file storage not connected' });
  }

  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'sign in required' });
  }

  const authHeaders = {
    authorization: `Bearer ${blobToken}`,
    'x-api-version': BLOB_API_VERSION,
  };
  const prefix = `attachments/${user.id}/`;

  try {
    if (req.method === 'POST') {
      const { name, mime, size, data } = parseJsonBody(req) as {
        name?: string;
        mime?: string;
        size?: number;
        data?: string;
      };
      if (!name || !mime || !data || typeof size !== 'number') {
        return res.status(400).json({ error: 'name, mime, size and data required' });
      }
      if (!ALLOWED_MIME.has(mime)) {
        return res.status(400).json({ error: `file type not allowed: ${mime}` });
      }
      if (size > MAX_BYTES) {
        return res.status(400).json({ error: 'file too large (max 4 MB)' });
      }
      const bytes = Buffer.from(data, 'base64');
      if (bytes.length !== size || bytes.length > MAX_BYTES) {
        return res.status(400).json({ error: 'size mismatch' });
      }
      const pathname = `${prefix}${Date.now()}-${safeName(name)}`;
      const putRes = await fetch(`${BLOB_API}/${encodeURIComponent(pathname)}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'x-vercel-blob-access': 'public',
          'x-content-type': mime,
          'x-add-random-suffix': '1',
          'content-length': String(bytes.length),
        },
        body: bytes,
      });
      if (!putRes.ok) {
        const detail = await putRes.text().catch(() => '');
        console.error('attachments: blob put failed', putRes.status, detail.slice(0, 200));
        return res.status(502).json({ error: 'storage upload failed' });
      }
      const blob = (await putRes.json()) as { url?: string; pathname?: string };
      if (!blob.url) return res.status(502).json({ error: 'storage upload failed' });
      return res.status(200).json({ url: blob.url, pathname: blob.pathname });
    }

    if (req.method === 'DELETE') {
      const { url } = parseJsonBody(req) as { url?: string };
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url required' });
      }
      // Only delete blobs under this user's own prefix — never anyone else's.
      if (!url.includes(prefix)) {
        return res.status(403).json({ error: 'not your file' });
      }
      const delRes = await fetch(`${BLOB_API}/delete`, {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ urls: [url] }),
      });
      if (!delRes.ok) {
        console.error('attachments: blob delete failed', delRes.status);
        return res.status(502).json({ error: 'storage delete failed' });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e: any) {
    console.error('attachments error', e);
    return res.status(500).json({ error: 'upload failed' });
  }
}
