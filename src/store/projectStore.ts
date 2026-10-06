import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Project,
  Issue,
  Epic,
  Sprint,
  CreateIssueInput,
  UpdateIssueInput,
  CreateEpicInput,
  CreateSprintInput,
  SearchFilters,
  Status,
} from '@/types';
import { generateIssueKey, generateEpicKey } from '@/utils/helpers';
import { createSampleProject } from '@/utils/demoData';

export type AppView = 'board' | 'list' | 'backlog' | 'sprints' | 'reports';

interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;

  // UI State
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue | null) => void;
  showIssueModal: boolean;
  setShowIssueModal: (show: boolean) => void;
  showEpicModal: boolean;
  setShowEpicModal: (show: boolean) => void;
  showSprintModal: boolean;
  setShowSprintModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showConfirmDialog: { title: string; message: string; onConfirm: () => void } | null;
  setShowConfirmDialog: (
    dialog: { title: string; message: string; onConfirm: () => void } | null
  ) => void;
  dragOverColumn: Status | null;
  setDragOverColumn: (status: Status | null) => void;
  newIssueDefaultStatus: Status;
  setNewIssueDefaultStatus: (status: Status) => void;
  newIssuePreset: Partial<CreateIssueInput> | null;
  setNewIssuePreset: (preset: Partial<CreateIssueInput> | null) => void;
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;

  // Actions
  initializeProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  setProject: (project: Project) => void;
  clearError: () => void;

  // Issue actions
  createIssue: (input: CreateIssueInput) => Issue;
  updateIssue: (issueId: string, input: UpdateIssueInput) => void;
  deleteIssue: (issueId: string) => void;
  moveIssue: (issueId: string, newStatus: Status) => void;
  bulkUpdateIssues: (issueIds: string[], input: UpdateIssueInput) => void;
  addComment: (issueId: string, author: string, text: string) => void;
  deleteComment: (issueId: string, commentId: string) => void;

  // Epic actions
  createEpic: (input: CreateEpicInput) => Epic;
  updateEpic: (epicId: string, input: Partial<CreateEpicInput>) => void;
  deleteEpic: (epicId: string) => void;

  // Sprint actions
  createSprint: (input: CreateSprintInput) => Sprint;
  updateSprint: (sprintId: string, input: Partial<CreateSprintInput>) => void;
  deleteSprint: (sprintId: string) => void;
  startSprint: (sprintId: string) => void;
  completeSprint: (sprintId: string) => void;
  addIssueToSprint: (sprintId: string, issueId: string) => void;
  removeIssueFromSprint: (sprintId: string, issueId: string) => void;

  // Search & filter
  searchIssues: (filters: SearchFilters) => Issue[];
  getIssuesByStatus: (status: Status) => Issue[];
  getIssuesByEpic: (epicId: string) => Issue[];
  getIssuesBySprint: (sprintId: string) => Issue[];

  // Export/Import
  exportProject: () => void;
  importProject: (file: File) => Promise<void>;
  loadSampleData: () => void;
  clearWorkspace: () => void;
}

const STORAGE_KEY = 'm4ster-tracker-project';

/** Normalize issues loaded from older stored projects (pre-comments, etc). */
function normalizeProject(project: Project): Project {
  return {
    ...project,
    issues: project.issues.map((i) => ({ ...i, comments: i.comments ?? [] })),
    epics: project.epics ?? [],
    sprints: project.sprints ?? [],
  };
}

function createDefaultProject(): Project {
  return createSampleProject();
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: null,
      isLoading: false,
      error: null,

      // UI State defaults
      activeView: 'board',
      setActiveView: (view) => set({ activeView: view }),
      selectedIssue: null,
      setSelectedIssue: (issue) => set({ selectedIssue: issue }),
      showIssueModal: false,
      setShowIssueModal: (show) => set({ showIssueModal: show }),
      showEpicModal: false,
      setShowEpicModal: (show) => set({ showEpicModal: show }),
      showSprintModal: false,
      setShowSprintModal: (show) => set({ showSprintModal: show }),
      showSettingsModal: false,
      setShowSettingsModal: (show) => set({ showSettingsModal: show }),
      showConfirmDialog: null,
      setShowConfirmDialog: (dialog) => set({ showConfirmDialog: dialog }),
      dragOverColumn: null,
      setDragOverColumn: (status) => set({ dragOverColumn: status }),
      newIssueDefaultStatus: 'backlog',
      setNewIssueDefaultStatus: (status) => set({ newIssueDefaultStatus: status }),
      newIssuePreset: null,
      setNewIssuePreset: (preset) => set({ newIssuePreset: preset }),
      showSearchModal: false,
      setShowSearchModal: (show) => set({ showSearchModal: show }),

      initializeProject: async () => {
        set({ isLoading: true, error: null });
        try {
          // In production, this would be an API call
          // For now, use localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const project = normalizeProject(JSON.parse(stored) as Project);
            set({ project, isLoading: false });
          } else {
            const project = createDefaultProject();
            set({ project, isLoading: false });
            await get().saveProject();
          }
        } catch (e) {
          set({ error: 'Failed to load project', isLoading: false });
          const project = createDefaultProject();
          set({ project });
        }
      },

      saveProject: async () => {
        const { project } = get();
        if (!project) return;
        try {
          const updated = { ...project, updatedAt: new Date().toISOString() };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          set({ project: updated });
        } catch (e) {
          set({ error: 'Failed to save project' });
        }
      },

      setProject: (project: Project) => set({ project }),

      clearError: () => set({ error: null }),

      createIssue: (input: CreateIssueInput) => {
        const { project } = get();
        if (!project) throw new Error('No project loaded');

        const key = generateIssueKey(project);
        const now = new Date().toISOString();
        const newIssue: Issue = {
          id: crypto.randomUUID(),
          key,
          title: input.title,
          description: input.description || '',
          type: input.type || 'task',
          status: input.status || 'backlog',
          priority: input.priority || 'medium',
          storyPoints: input.storyPoints || 0,
          assignee: input.assignee,
          labels: input.labels || [],
          epicId: input.epicId,
          parentId: input.parentId,
          sprintId: input.sprintId,
          comments: [],
          createdAt: now,
          updatedAt: now,
          dueDate: input.dueDate,
        };

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: [...state.project.issues, newIssue],
                nextIssueNumber: state.project.nextIssueNumber + 1,
                updatedAt: now,
              }
            : null,
        }));

        get().saveProject();
        return newIssue;
      },

      updateIssue: (issueId: string, input: UpdateIssueInput) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.map((issue) =>
                  issue.id === issueId ? { ...issue, ...input, updatedAt: now } : issue
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      addComment: (issueId: string, author: string, text: string) => {
        const now = new Date().toISOString();
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.map((issue) =>
                  issue.id === issueId
                    ? {
                        ...issue,
                        comments: [
                          ...(issue.comments ?? []),
                          { id: crypto.randomUUID(), author, text: trimmed, createdAt: now },
                        ],
                        updatedAt: now,
                      }
                    : issue
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      deleteComment: (issueId: string, commentId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.map((issue) =>
                  issue.id === issueId
                    ? {
                        ...issue,
                        comments: (issue.comments ?? []).filter((c) => c.id !== commentId),
                        updatedAt: now,
                      }
                    : issue
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      deleteIssue: (issueId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.filter((i) => i.id !== issueId),
                epics: state.project.epics.map((epic) => ({
                  ...epic,
                  issues: epic.issues.filter((id) => id !== issueId),
                })),
                sprints: state.project.sprints.map((sprint) => ({
                  ...sprint,
                  issues: sprint.issues.filter((id) => id !== issueId),
                })),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      moveIssue: (issueId: string, newStatus: Status) => {
        const { project } = get();
        if (!project) return;
        const issue = project.issues.find((i) => i.id === issueId);
        if (!issue || issue.status === newStatus) return;

        const now = new Date().toISOString();
        const updates: UpdateIssueInput = {
          status: newStatus,
          completedAt: newStatus === 'done' ? now : undefined,
        };

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.map((i) =>
                  i.id === issueId ? { ...i, ...updates, updatedAt: now } : i
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      bulkUpdateIssues: (issueIds: string[], input: UpdateIssueInput) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                issues: state.project.issues.map((issue) =>
                  issueIds.includes(issue.id) ? { ...issue, ...input, updatedAt: now } : issue
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      createEpic: (input: CreateEpicInput) => {
        const { project } = get();
        if (!project) throw new Error('No project loaded');

        const EPIC_COLORS = [
          '#8b5cf6',
          '#0ea5e9',
          '#22c55e',
          '#f59e0b',
          '#ef4444',
          '#ec4899',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#6366f1',
        ];

        const now = new Date().toISOString();
        const newEpic: Epic = {
          id: crypto.randomUUID(),
          key: generateEpicKey(project),
          name: input.name,
          description: input.description || '',
          color: input.color || EPIC_COLORS[project.epics.length % EPIC_COLORS.length],
          issues: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                epics: [...state.project.epics, newEpic],
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
        return newEpic;
      },

      updateEpic: (epicId: string, input: Partial<CreateEpicInput>) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                epics: state.project.epics.map((epic) =>
                  epic.id === epicId ? { ...epic, ...input, updatedAt: now } : epic
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      deleteEpic: (epicId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                epics: state.project.epics.filter((e) => e.id !== epicId),
                issues: state.project.issues.map((issue) =>
                  issue.epicId === epicId ? { ...issue, epicId: undefined, updatedAt: now } : issue
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      createSprint: (input: CreateSprintInput) => {
        const { project } = get();
        if (!project) throw new Error('No project loaded');

        const now = new Date().toISOString();
        const newSprint: Sprint = {
          id: crypto.randomUUID(),
          name: input.name,
          goal: input.goal || '',
          startDate: input.startDate,
          endDate: input.endDate,
          status: 'planning',
          issues: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: [...state.project.sprints, newSprint],
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
        return newSprint;
      },

      updateSprint: (sprintId: string, input: Partial<CreateSprintInput>) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.map((sprint) =>
                  sprint.id === sprintId ? { ...sprint, ...input, updatedAt: now } : sprint
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      deleteSprint: (sprintId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.filter((s) => s.id !== sprintId),
                issues: state.project.issues.map((issue) =>
                  issue.sprintId === sprintId
                    ? { ...issue, sprintId: undefined, updatedAt: now }
                    : issue
                ),
                currentSprintId:
                  state.project.currentSprintId === sprintId
                    ? undefined
                    : state.project.currentSprintId,
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      startSprint: (sprintId: string) => {
        const { project } = get();
        if (!project) return;
        const sprint = project.sprints.find((s) => s.id === sprintId);
        if (!sprint || sprint.status !== 'planning') return;

        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.map((s) =>
                  s.id === sprintId ? { ...s, status: 'active', updatedAt: now } : s
                ),
                currentSprintId: sprintId,
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      completeSprint: (sprintId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.map((s) =>
                  s.id === sprintId ? { ...s, status: 'completed', updatedAt: now } : s
                ),
                currentSprintId:
                  state.project.currentSprintId === sprintId
                    ? undefined
                    : state.project.currentSprintId,
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      addIssueToSprint: (sprintId: string, issueId: string) => {
        const { project } = get();
        if (!project) return;

        const sprint = project.sprints.find((s) => s.id === sprintId);
        const issue = project.issues.find((i) => i.id === issueId);
        if (!sprint || !issue) return;

        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.map((s) =>
                  s.id === sprintId && !s.issues.includes(issueId)
                    ? { ...s, issues: [...s.issues, issueId], updatedAt: now }
                    : s
                ),
                issues: state.project.issues.map((i) =>
                  i.id === issueId ? { ...i, sprintId, updatedAt: now } : i
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      removeIssueFromSprint: (sprintId: string, issueId: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                sprints: state.project.sprints.map((s) =>
                  s.id === sprintId
                    ? { ...s, issues: s.issues.filter((id) => id !== issueId), updatedAt: now }
                    : s
                ),
                issues: state.project.issues.map((i) =>
                  i.id === issueId ? { ...i, sprintId: undefined, updatedAt: now } : i
                ),
                updatedAt: now,
              }
            : null,
        }));
        get().saveProject();
      },

      searchIssues: (filters: SearchFilters) => {
        const { project } = get();
        if (!project) return [];

        let issues = [...project.issues];

        if (filters.query) {
          const q = filters.query.toLowerCase();
          issues = issues.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.description.toLowerCase().includes(q) ||
              i.key.toLowerCase().includes(q)
          );
        }

        if (filters.status?.length) {
          issues = issues.filter((i) => filters.status!.includes(i.status));
        }

        if (filters.priority?.length) {
          issues = issues.filter((i) => filters.priority!.includes(i.priority));
        }

        if (filters.type?.length) {
          issues = issues.filter((i) => filters.type!.includes(i.type));
        }

        if (filters.assignee) {
          issues = issues.filter((i) => i.assignee === filters.assignee);
        }

        if (filters.epicId) {
          issues = issues.filter((i) => i.epicId === filters.epicId);
        }

        if (filters.sprintId) {
          issues = issues.filter((i) => i.sprintId === filters.sprintId);
        }

        if (filters.labels?.length) {
          issues = issues.filter((i) => filters.labels!.some((l) => i.labels.includes(l)));
        }

        if (filters.dateFrom) {
          issues = issues.filter((i) => i.createdAt >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          issues = issues.filter((i) => i.createdAt <= filters.dateTo!);
        }

        return issues;
      },

      getIssuesByStatus: (status: Status) => {
        const { project } = get();
        if (!project) return [];
        return project.issues
          .filter((i) => i.status === status)
          .sort((a, b) => {
            const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });
      },

      getIssuesByEpic: (epicId: string) => {
        const { project } = get();
        if (!project) return [];
        return project.issues.filter((i) => i.epicId === epicId);
      },

      getIssuesBySprint: (sprintId: string) => {
        const { project } = get();
        if (!project) return [];
        return project.issues.filter((i) => i.sprintId === sprintId);
      },

      exportProject: () => {
        const { project } = get();
        if (!project) return;
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.key}-roadmap-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importProject: async (file: File) => {
        const text = await file.text();
        try {
          const project = JSON.parse(text) as Project;
          if (!project.id || !project.key || !project.name) {
            throw new Error('Invalid project structure');
          }
          set({ project: normalizeProject(project) });
          get().saveProject();
        } catch (e) {
          throw new Error('Invalid project file');
        }
      },

      loadSampleData: () => {
        const project = createSampleProject();
        set({ project });
        get().saveProject();
      },

      clearWorkspace: () => {
        const now = new Date().toISOString();
        const project: Project = {
          id: crypto.randomUUID(),
          key: 'MT',
          name: 'M4ster Roadmap Tracker',
          description: '',
          issues: [],
          epics: [],
          sprints: [],
          nextIssueNumber: 1,
          createdAt: now,
          updatedAt: now,
        };
        set({ project });
        get().saveProject();
      },
    }),
    {
      name: 'm4ster-tracker-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ project: state.project }),
    }
  )
);
