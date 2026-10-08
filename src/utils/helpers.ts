import type { Project } from '@/types';

export function generateIssueKey(project: Project): string {
  return `${project.key}-${project.nextIssueNumber}`;
}

export function generateEpicKey(project: Project): string {
  return `${project.key}-E${project.epics.length + 1}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
