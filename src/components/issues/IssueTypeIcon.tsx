import type { IssueType } from '@/types';

/**
 * Jira-style issue type glyphs — colored SVG marks, no emoji.
 * Story: bookmark · Task: check · Bug: filled circle · Epic: bolt · Subtask: nested squares
 */
const COLORS: Record<IssueType, string> = {
  story: '#63ba3b',
  task: '#4bade8',
  bug: '#e5493a',
  epic: '#904ee2',
  subtask: '#4bade8',
};

const LABELS: Record<IssueType, string> = {
  story: 'Story',
  task: 'Task',
  bug: 'Bug',
  epic: 'Epic',
  subtask: 'Sub-task',
};

function Glyph({ type }: { type: IssueType }) {
  switch (type) {
    case 'story':
      return (
        <path d="M6 2h9a1 1 0 0 1 1 1v18l-7-4.2L2 21V3a1 1 0 0 1 1-1h3z" fill="currentColor" />
      );
    case 'task':
      return (
        <path
          d="M7 12.5l3.2 3.2L17 8.9 15.6 7.5l-5.4 5.4-1.8-1.8L7 12.5zM5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5z"
          fill="currentColor"
        />
      );
    case 'bug':
      return <circle cx="12" cy="12" r="9" fill="currentColor" />;
    case 'epic':
      return <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />;
    case 'subtask':
      return (
        <path
          d="M4 4h7v7H4zM13 13h7v7h-7zM4 13h2v2H4zm4 0h2v2H8zm-4 4h2v2H4z"
          fill="currentColor"
        />
      );
  }
}

export function IssueTypeIcon({
  type,
  size = 16,
  className = '',
}: {
  type: IssueType;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: COLORS[type] }}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={LABELS[type]}
    >
      <Glyph type={type} />
    </svg>
  );
}

export function issueTypeColor(type: IssueType): string {
  return COLORS[type];
}
