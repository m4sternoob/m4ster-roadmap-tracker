import type { ReactNode } from 'react';

type PillTone = 'neutral' | 'accent' | 'success' | 'danger' | 'info';

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: 'bg-[var(--chrome)]/60 text-[var(--text-secondary)]',
  accent: 'bg-[var(--accent)]/15 text-[var(--accent-bright)]',
  success: 'bg-[var(--success)]/15 text-[var(--success)]',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)]',
  info: 'bg-[var(--info)]/15 text-[var(--info)]',
};

/**
 * Pill — the one consistent label component (Linear/Jira lozenge style):
 * tinted background + colored text, 11px, fully rounded. Reused for labels,
 * counts, epic tags, and status flags across the product.
 */
export function Pill({
  tone = 'neutral',
  color,
  title,
  children,
  className = '',
}: {
  tone?: PillTone;
  /** Custom hex color — tinted automatically (e.g. epic colors). */
  color?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-px rounded-full text-[11px] font-medium leading-[1.7] whitespace-nowrap ${
        color ? '' : TONE_CLASSES[tone]
      } ${className}`}
      style={color ? { backgroundColor: `${color}26`, color } : undefined}
      title={title}
    >
      {children}
    </span>
  );
}
