import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { Project } from '@/types';

interface DocNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

const keyFor = (projectKey: string) => `mt_docs_${projectKey}_v1`;

function loadDocs(projectKey: string): DocNote[] {
  try {
    const raw = localStorage.getItem(keyFor(projectKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    {
      id: 'welcome',
      title: 'Project notes',
      body: 'Write the stuff that does not fit on a card: decisions, links, meeting notes.\n\nDocs are saved on this device for now.',
      updatedAt: new Date().toISOString(),
    },
  ];
}

/** Project docs — lightweight notes pages, like the Docs tab in the reference. */
export function DocsView({ project }: { project: Project }) {
  const [docs, setDocs] = useState<DocNote[]>(() => loadDocs(project.key));
  const [activeId, setActiveId] = useState<string>(() => docs[0]?.id ?? '');

  useEffect(() => {
    const loaded = loadDocs(project.key);
    setDocs(loaded);
    setActiveId(loaded[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.key]);

  const persist = (next: DocNote[]) => {
    setDocs(next);
    try {
      localStorage.setItem(keyFor(project.key), JSON.stringify(next));
    } catch {}
  };

  const active = useMemo(() => docs.find((d) => d.id === activeId) ?? docs[0], [docs, activeId]);

  const createDoc = () => {
    const doc: DocNote = {
      id: `doc-${Date.now().toString(36)}`,
      title: 'Untitled doc',
      body: '',
      updatedAt: new Date().toISOString(),
    };
    persist([doc, ...docs]);
    setActiveId(doc.id);
  };

  const updateActive = (patch: Partial<DocNote>) => {
    if (!active) return;
    persist(
      docs.map((d) => (d.id === active.id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteActive = () => {
    if (!active) return;
    const next = docs.filter((d) => d.id !== active.id);
    persist(next);
    setActiveId(next[0]?.id ?? '');
  };

  return (
    <div className="flex gap-4 animate-fade-in min-h-[420px]">
      <aside className="w-56 shrink-0 rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-2 flex flex-col">
        <button
          onClick={createDoc}
          className="flex items-center gap-2 px-2.5 h-8 rounded-md text-[13px] font-medium text-[var(--accent-bright)] hover:bg-[var(--bg-raised)] motion-press"
        >
          <Plus size={14} /> New doc
        </button>
        <div className="mt-1 space-y-0.5 overflow-y-auto">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[13px] motion-interactive ${
                active?.id === d.id
                  ? 'bg-[var(--accent)]/15 text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <FileText size={14} className="shrink-0" />
              <span className="flex-1 truncate">{d.title || 'Untitled doc'}</span>
            </button>
          ))}
          {docs.length === 0 && (
            <p className="px-2.5 py-4 text-[12.5px] text-[var(--text-faint)]">No docs yet.</p>
          )}
        </div>
        <p className="mt-auto px-2.5 pt-3 text-[11px] text-[var(--text-faint)]">
          Saved on this device.
        </p>
      </aside>

      <section className="flex-1 rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] p-5 flex flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2">
              <input
                value={active.title}
                onChange={(e) => updateActive({ title: e.target.value })}
                placeholder="Doc title"
                className="flex-1 bg-transparent text-[20px] font-bold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]"
              />
              <button
                onClick={deleteActive}
                title="Delete doc"
                aria-label="Delete doc"
                className="p-2 rounded-md text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[var(--bg-raised)] motion-press"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-1 text-[11.5px] text-[var(--text-faint)]">
              Last edited {new Date(active.updatedAt).toLocaleString()}
            </p>
            <textarea
              value={active.body}
              onChange={(e) => updateActive({ body: e.target.value })}
              placeholder="Start writing…"
              className="mt-4 flex-1 min-h-[300px] w-full resize-none bg-transparent text-[14px] leading-relaxed text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-faint)]"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
            <FileText size={22} className="text-[var(--text-faint)]" />
            <p className="text-[13.5px] text-[var(--text-muted)]">Create your first doc to get started.</p>
            <button
              onClick={createDoc}
              className="mt-1 px-3.5 h-9 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold btn-primary-depth motion-press"
            >
              New doc
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
