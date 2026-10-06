import type { Status } from '@/types';
import { STATUSES } from '@/types';

/** Status lozenge. */
const STYLES: Record<Status, string> = {
  backlog: 'bg-slate-500/15 text-slate-400',
  todo: 'bg-sky-500/15 text-sky-400',
  'in-progress': 'bg-amber-500/15 text-amber-400',
  review: 'bg-violet-500/15 text-violet-400',
  done: 'bg-emerald-500/15 text-emerald-400',
};

export function StatusPill({ status, className = '' }: { status: Status; className?: string }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${STYLES[status]} ${className}`}
    >
      {label}
    </span>
  );
}
