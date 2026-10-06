import { initials } from '@/utils/helpers';

/** Deterministic avatar background from a name — Jira-style colored disc. */
const PALETTE = [
  '#0055cc',
  '#4bade8',
  '#006644',
  '#36b37e',
  '#663366',
  '#904ee2',
  '#a54800',
  '#e2a03f',
  '#ae2e24',
  '#e5493a',
  '#5e6c84',
  '#1f7aec',
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name,
  size = 24,
  title,
  ring = false,
}: {
  name: string;
  size?: number;
  title?: string;
  ring?: boolean;
}) {
  return (
    <span
      title={title ?? name}
      aria-label={name}
      role="img"
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 select-none ${
        ring ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-transparent' : ''
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(name),
        fontSize: Math.max(9, Math.round(size * 0.38)),
      }}
    >
      {initials(name)}
    </span>
  );
}
