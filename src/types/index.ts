export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type IssueType = 'epic' | 'story' | 'task' | 'subtask' | 'bug';
export type SprintStatus = 'planning' | 'active' | 'completed';

export interface IssueComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  type: IssueType;
  status: Status;
  priority: Priority;
  storyPoints: number;
  assignee?: string;
  labels: string[];
  epicId?: string;
  parentId?: string;
  sprintId?: string;
  comments: IssueComment[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
}

export interface Epic {
  id: string;
  key: string;
  name: string;
  description: string;
  color: string;
  issues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  issues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  issues: Issue[];
  epics: Epic[];
  sprints: Sprint[];
  currentSprintId?: string;
  nextIssueNumber: number;
  createdAt: string;
  updatedAt: string;
}

export const STATUSES: { value: Status; label: string; order: number }[] = [
  { value: 'backlog', label: 'Backlog', order: 0 },
  { value: 'todo', label: 'To Do', order: 1 },
  { value: 'in-progress', label: 'In Progress', order: 2 },
  { value: 'review', label: 'Review', order: 3 },
  { value: 'done', label: 'Done', order: 4 },
];

export const PRIORITIES: { value: Priority; label: string; color: string; order: number }[] = [
  { value: 'low', label: 'Low', color: '#64748b', order: 0 },
  { value: 'medium', label: 'Medium', color: '#0ea5e9', order: 1 },
  { value: 'high', label: 'High', color: '#f59e0b', order: 2 },
  { value: 'critical', label: 'Critical', color: '#ef4444', order: 3 },
];

export const ISSUE_TYPES: { value: IssueType; label: string; icon: string; color: string }[] = [
  { value: 'epic', label: 'Epic', icon: '🏔️', color: '#8b5cf6' },
  { value: 'story', label: 'Story', icon: '📖', color: '#0ea5e9' },
  { value: 'task', label: 'Task', icon: '✅', color: '#22c55e' },
  { value: 'subtask', label: 'Subtask', icon: '📋', color: '#f59e0b' },
  { value: 'bug', label: 'Bug', icon: '🐛', color: '#ef4444' },
];

export const SPRINT_STATUSES: { value: SprintStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: '#64748b' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#0ea5e9' },
];

export interface CreateIssueInput {
  title: string;
  description?: string;
  type?: IssueType;
  status?: Status;
  priority?: Priority;
  storyPoints?: number;
  assignee?: string;
  labels?: string[];
  epicId?: string;
  parentId?: string;
  sprintId?: string;
  dueDate?: string;
}

export interface UpdateIssueInput extends Partial<CreateIssueInput> {
  completedAt?: string;
}

export interface CreateEpicInput {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface SearchFilters {
  query?: string;
  status?: Status[];
  priority?: Priority[];
  type?: IssueType[];
  assignee?: string;
  epicId?: string;
  sprintId?: string;
  labels?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
