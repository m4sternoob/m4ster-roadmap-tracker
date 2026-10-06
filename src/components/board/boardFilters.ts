import type { Issue, IssueType, Priority, Status } from '@/types';
import { ISSUE_TYPES, PRIORITIES, STATUSES } from '@/types';

export type GroupBy = 'status' | 'assignee' | 'priority';

export interface BoardFilters {
  query: string;
  types: IssueType[];
  priorities: Priority[];
  statuses: Status[];
  assignees: string[];
  epicIds: string[];
  labels: string[];
  onlyMine: boolean;
  /** Set by the avatar quick-filters in the toolbar (single-select). */
  quickAssignee: string | null;
}

export const EMPTY_FILTERS: BoardFilters = {
  query: '',
  types: [],
  priorities: [],
  statuses: [],
  assignees: [],
  epicIds: [],
  labels: [],
  onlyMine: false,
  quickAssignee: null,
};

const UNASSIGNED = '__unassigned__';
export const CURRENT_USER = 'Master Noob';

function matchesQuery(issue: Issue, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    issue.title.toLowerCase().includes(needle) ||
    issue.key.toLowerCase().includes(needle) ||
    issue.description.toLowerCase().includes(needle) ||
    issue.labels.some((l) => l.toLowerCase().includes(needle))
  );
}

export function applyBoardFilters(issues: Issue[], f: BoardFilters): Issue[] {
  return issues.filter((issue) => {
    if (!matchesQuery(issue, f.query)) return false;
    if (f.types.length > 0 && !f.types.includes(issue.type)) return false;
    if (f.priorities.length > 0 && !f.priorities.includes(issue.priority)) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(issue.status)) return false;
    if (f.labels.length > 0 && !f.labels.every((l) => issue.labels.includes(l))) return false;
    if (f.epicIds.length > 0 && !(issue.epicId && f.epicIds.includes(issue.epicId))) return false;

    const assigneeKey = issue.assignee ?? UNASSIGNED;
    if (f.assignees.length > 0 && !f.assignees.includes(assigneeKey)) return false;
    if (f.onlyMine && issue.assignee !== CURRENT_USER) return false;
    if (f.quickAssignee && assigneeKey !== f.quickAssignee) return false;
    return true;
  });
}

export function countActiveFilters(f: BoardFilters): number {
  return (
    f.types.length +
    f.priorities.length +
    f.statuses.length +
    f.assignees.length +
    f.epicIds.length +
    f.labels.length +
    (f.onlyMine ? 1 : 0) +
    (f.quickAssignee ? 1 : 0)
  );
}

export { UNASSIGNED };
export { ISSUE_TYPES, PRIORITIES, STATUSES };
