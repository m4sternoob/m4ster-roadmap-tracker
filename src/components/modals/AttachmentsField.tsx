import { useRef, useState } from 'react';
import { FileArchive, FileImage, FileText, File, Loader2, Paperclip, X } from 'lucide-react';
import type { Issue, IssueAttachment } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { formatRelativeTime } from '@/utils/helpers';

const MAX_BYTES = 4 * 1024 * 1024; // must match api/attachments.ts

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string }) {
  const cls = 'shrink-0 text-[var(--text-muted)]';
  if (mime.startsWith('image/')) return <FileImage size={16} className={cls} />;
  if (mime === 'application/pdf' || mime.startsWith('text/')) return <FileText size={16} className={cls} />;
  if (mime === 'application/zip') return <FileArchive size={16} className={cls} />;
  return <File size={16} className={cls} />;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

export function AttachmentsField({ live }: { live: Issue }) {
  const { addAttachment, removeAttachment, pushToast } = useProjectStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string[]>([]);
  const attachments = live.attachments ?? [];

  const pick = () => inputRef.current?.click();

  const uploadOne = async (file: File) => {
    if (file.size > MAX_BYTES) {
      pushToast('error', `"${file.name}" is over the 4 MB limit.`);
      return;
    }
    setUploading((u) => [...u, file.name]);
    try {
      const data = await fileToBase64(file);
      const res = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          data,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        if (res.status === 401) {
          pushToast('error', 'Sign in to attach files.');
        } else if (res.status === 503) {
          pushToast('error', 'File storage is not connected yet.');
        } else {
          pushToast('error', body.error || 'Upload failed.');
        }
        return;
      }
      addAttachment(live.id, { name: file.name, size: file.size, mime: file.type, url: body.url });
      pushToast('success', `Attached "${file.name}".`);
    } catch {
      pushToast('error', `Could not upload "${file.name}".`);
    } finally {
      setUploading((u) => u.filter((n) => n !== file.name));
    }
  };

  const remove = async (a: IssueAttachment) => {
    removeAttachment(live.id, a.id);
    // Best-effort blob cleanup — the record is already gone from the issue.
    try {
      await fetch('/api/attachments', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: a.url }),
      });
    } catch {
      /* orphaned blob; harmless */
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-1.5 mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
        <Paperclip size={14} className="text-[var(--text-muted)]" />
        Attachments
        {attachments.length > 0 && (
          <span className="text-[var(--text-faint)] font-normal">{attachments.length}</span>
        )}
        <button
          onClick={pick}
          className="ml-auto flex items-center gap-1 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-surface)] motion-press"
        >
          Attach
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label="Attach a file"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          files.forEach(uploadOne);
        }}
      />
      {attachments.length === 0 && uploading.length === 0 && (
        <p className="text-[12.5px] text-[var(--text-faint)] px-1">
          Screenshots, docs, anything up to 4 MB.
        </p>
      )}
      <ul className="space-y-1.5">
        {uploading.map((name) => (
          <li
            key={`uploading-${name}`}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-[var(--bg-raised)]"
          >
            <Loader2 size={16} className="animate-spin text-[var(--text-muted)] shrink-0" />
            <span className="flex-1 min-w-0 truncate text-[12.5px] text-[var(--text-muted)]">
              {name}
            </span>
            <span className="text-[11.5px] text-[var(--text-faint)]">Uploading…</span>
          </li>
        ))}
        {attachments.map((a) => (
          <li
            key={a.id}
            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-[var(--bg-raised)]"
          >
            {a.mime.startsWith('image/') ? (
              <img
                src={a.url}
                alt=""
                className="w-8 h-8 rounded object-cover shrink-0 bg-[var(--bg-surface)]"
                loading="lazy"
              />
            ) : (
              <FileIcon mime={a.mime} />
            )}
            <div className="flex-1 min-w-0">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-bright)] hover:underline"
                title={a.name}
              >
                {a.name}
              </a>
              <div className="text-[11px] text-[var(--text-faint)]">
                {formatBytes(a.size)} · {formatRelativeTime(a.uploadedAt)}
              </div>
            </div>
            <button
              onClick={() => remove(a)}
              className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-[var(--danger)] motion-press shrink-0"
              aria-label={`Remove ${a.name}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
