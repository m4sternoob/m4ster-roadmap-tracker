import type { Project, Status } from '@/types';

export function generateIssueKey(project: Project): string {
  return `${project.key}-${project.nextIssueNumber}`;
}

export function generateEpicKey(project: Project): string {
  return `${project.key}-E${project.epics.length + 1}`;
}

export function generateSprintName(project: Project): string {
  return `Sprint ${project.sprints.length + 1}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function getDaysRemaining(dueDate?: string): number | null {
  if (!dueDate) return null;
  const diffMs = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getColorForPriority(priority: string): string {
  const colors: Record<string, string> = {
    low: '#64748b',
    medium: '#0ea5e9',
    high: '#f59e0b',
    critical: '#ef4444',
  };
  return colors[priority] || '#64748b';
}

export function getColorForStatus(status: string): string {
  const colors: Record<string, string> = {
    backlog: '#64748b',
    todo: '#0ea5e9',
    'in-progress': '#f59e0b',
    review: '#8b5cf6',
    done: '#22c55e',
    planning: '#64748b',
    active: '#22c55e',
    completed: '#0ea5e9',
  };
  return colors[status] || '#64748b';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface EpicProgress {
  epicId: string;
  totalIssues: number;
  doneIssues: number;
  percentComplete: number;
  totalPoints: number;
  donePoints: number;
  pointsPercent: number;
  statusBreakdown: Record<Status, number>;
}

/** Completion stats for one epic, computed from the project's issue list. */
export function getEpicProgress(project: Project, epicId: string): EpicProgress {
  const issues = project.issues.filter((i) => i.epicId === epicId);
  const totalIssues = issues.length;
  const doneIssues = issues.filter((i) => i.status === 'done').length;
  const totalPoints = issues.reduce((sum, i) => sum + i.storyPoints, 0);
  const donePoints = issues
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + i.storyPoints, 0);

  const statusBreakdown: Record<Status, number> = {
    backlog: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };
  for (const issue of issues) {
    statusBreakdown[issue.status] += 1;
  }

  return {
    epicId,
    totalIssues,
    doneIssues,
    percentComplete: totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0,
    totalPoints,
    donePoints,
    pointsPercent: totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0,
    statusBreakdown,
  };
}
