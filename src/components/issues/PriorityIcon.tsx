import type { Priority } from '@/types';

/** Jira-style priority chevrons. */
const COLORS: Record<Priority, string> = {
  low: '#4bade8',
  medium: '#e2a03f',
  high: '#e5493a',
  critical: '#e5493a',
};

const LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function Glyph({ priority }: { priority: Priority }) {
  switch (priority) {
    case 'critical':
      return (
        <path d="M12 3l3 4.5L12 12 9 7.5 12 3zm0 9l3 4.5-3 4.5-3-4.5 3-4.5z" fill="currentColor" />
      );
    case 'high':
      return <path d="M12 4l7 10h-4v6h-6v-6H5l7-10z" fill="currentColor" />;
    case 'medium':
      return <path d="M5 9h14v3H5zm0 5h14v3H5z" fill="currentColor" />;
    case 'low':
      return <path d="M12 20l-7-10h4V4h6v6h4l-7 10z" fill="currentColor" />;
  }
}

export function PriorityIcon({
  priority,
  size = 14,
  className = '',
}: {
  priority: Priority;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: COLORS[priority] }}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={`${LABELS[priority]} priority`}
    >
      <Glyph priority={priority} />
    </svg>
  );
}
