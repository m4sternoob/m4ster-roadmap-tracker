import { useState } from 'react';
import { Laptop, Monitor, Plus, Server, Smartphone, Trash2 } from 'lucide-react';
import type { Project } from '@/types';

interface Asset {
  id: string;
  name: string;
  type: 'Laptop' | 'Monitor' | 'Phone' | 'Server' | 'Other';
  owner: string;
  status: 'In use' | 'In stock' | 'Repair' | 'Retired';
}

const KEY = 'mt_assets_v1';
const TYPES: Asset['type'][] = ['Laptop', 'Monitor', 'Phone', 'Server', 'Other'];
const STATUSES: Asset['status'][] = ['In use', 'In stock', 'Repair', 'Retired'];

const TYPE_ICON: Record<Asset['type'], React.ElementType> = {
  Laptop,
  Monitor,
  Phone: Smartphone,
  Server,
  Other: Monitor,
};

const STATUS_STYLE: Record<Asset['status'], string> = {
  'In use': 'bg-emerald-500/15 text-emerald-400',
  'In stock': 'bg-sky-500/15 text-sky-400',
  Repair: 'bg-amber-500/15 text-amber-400',
  Retired: 'bg-slate-500/15 text-slate-400',
};

function loadAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    { id: 'a1', name: 'Dev Laptop 01', type: 'Laptop', owner: 'Master Noob', status: 'In use' },
    { id: 'a2', name: 'QA Monitor 27"', type: 'Monitor', owner: 'Unassigned', status: 'In stock' },
    { id: 'a3', name: 'Test Phone — Pixel', type: 'Phone', owner: 'Master Noob', status: 'In use' },
    { id: 'a4', name: 'Build Server', type: 'Server', owner: 'Unassigned', status: 'In use' },
  ];
}

const inputCls =
  'h-9 rounded-lg border border-[var(--chrome)] bg-[var(--bg-app)] px-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]';

/** Asset register — hardware tracking like the reference Assets screens. */
export function AssetsView({ project }: { project: Project }) {
  const [assets, setAssets] = useState<Asset[]>(loadAssets);
  const [name, setName] = useState('');
  const [type, setType] = useState<Asset['type']>('Laptop');
  const [owner, setOwner] = useState('');

  const persist = (next: Asset[]) => {
    setAssets(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = () => {
    const n = name.trim();
    if (!n) return;
    persist([
      {
        id: `a-${Date.now().toString(36)}`,
        name: n,
        type,
        owner: owner.trim() || 'Unassigned',
        status: 'In stock',
      },
      ...assets,
    ]);
    setName('');
    setOwner('');
  };

  const cycleStatus = (a: Asset) => {
    const next = STATUSES[(STATUSES.indexOf(a.status) + 1) % STATUSES.length];
    persist(assets.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">Assets</h2>
        <span className="text-[12.5px] text-[var(--text-faint)]">
          {project.name} · hardware register · saved on this device
        </span>
      </div>
      <p className="text-[12.5px] text-[var(--text-muted)] mb-4">
        Click a status pill to cycle it. {assets.length} asset{assets.length === 1 ? '' : 's'} tracked.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" className={`${inputCls} w-52`} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <select value={type} onChange={(e) => setType(e.target.value as Asset['type'])} className={inputCls} aria-label="Asset type">
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner (optional)" className={`${inputCls} w-44`} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button
          onClick={add}
          className="h-9 px-3.5 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold btn-primary-depth motion-press flex items-center gap-1.5"
        >
          <Plus size={14} /> Add asset
        </button>
      </div>

      <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--bg-raised)]">
              {['Asset', 'Type', 'Owner', 'Status', ''].map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              const Icon = TYPE_ICON[a.type];
              return (
                <tr key={a.id} className="border-b border-[var(--bg-raised)]/60 last:border-0 hover:bg-[var(--bg-surface)] motion-interactive">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2 text-[13.5px] text-[var(--text-primary)]">
                      <Icon size={15} className="text-[var(--text-muted)]" />
                      {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--text-muted)]">{a.type}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--text-muted)]">{a.owner}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => cycleStatus(a)}
                      title="Cycle status"
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide motion-press ${STATUS_STYLE[a.status]}`}
                    >
                      {a.status}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 w-10">
                    <button
                      onClick={() => persist(assets.filter((x) => x.id !== a.id))}
                      title={`Remove ${a.name}`}
                      aria-label={`Remove ${a.name}`}
                      className="p-1.5 rounded text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[var(--bg-raised)] motion-press"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {assets.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">
            No assets yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
