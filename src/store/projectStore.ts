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
import { STATUSES } from '@/types';
import { generateIssueKey, generateEpicKey } from '@/utils/helpers';
import { createSampleProject } from '@/utils/demoData';
import { getWorkspaceSlug, workspaceStorageKey, getDeviceId, DEFAULT_SLUG } from '@/sync/workspace';
import { cloudPull, cloudPush } from '@/sync/cloud';

import type { BoardFilters } from '@/components/board/boardFilters';

export type AppView = 'board' | 'list' | 'backlog' | 'sprints' | 'reports';

export type ToastKind = 'success' | 'error' | 'info';

/** A one-shot board filter request from the sidebar (For you, Teams, Goals). */
export interface BoardFilterSignal {
  patch: Partial<BoardFilters>;
  nonce: number;
}

export type SidebarSectionKey = 'shortcuts' | 'workspace' | 'spaces' | 'views' | 'manage';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

const TOAST_TTL_MS = 3600;

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

  // Sidebar-driven board filtering
  boardFilterSignal: BoardFilterSignal | null;
  applyBoardFilterPatch: (patch: Partial<BoardFilters>) => void;
  boardFilterPanelOpen: boolean;
  setBoardFilterPanelOpen: (open: boolean) => void;

  // Recent + starred issues (sidebar)
  recentIds: string[];
  starredIds: string[];
  toggleStarred: (id: string) => void;

  // Sidebar customization
  sidebarSections: Record<SidebarSectionKey, boolean>;
  toggleSidebarSection: (key: SidebarSectionKey) => void;

  // Toasts
  toasts: Toast[];
  pushToast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: string) => void;

  // Actions
  initializeProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  setProject: (project: Project) => void;
  clearError: () => void;

  // Cross-device sync
  workspaceSlug: string;
  syncStatus: 'idle' | 'loading' | 'saving' | 'synced' | 'local' | 'error';
  /** True when cloud sync is available but the user isn't signed in. */
  syncNeedsLogin: boolean;
  syncPush: () => Promise<void>;
  syncPushDebounced: () => void;
  syncPull: () => Promise<void>;

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
      setSelectedIssue: (issue) =>
        set((state) => ({
          selectedIssue: issue,
          // Track recently viewed issues for the sidebar.
          recentIds: issue
            ? [issue.id, ...state.recentIds.filter((id) => id !== issue.id)].slice(0, 10)
            : state.recentIds,
        })),
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

      // Sidebar-driven board filtering
      boardFilterSignal: null,
      applyBoardFilterPatch: (patch) =>
        set((state) => ({
          boardFilterSignal: {
            patch,
            nonce: (state.boardFilterSignal?.nonce ?? 0) + 1,
          },
        })),
      boardFilterPanelOpen: false,
      setBoardFilterPanelOpen: (open) => set({ boardFilterPanelOpen: open }),

      // Recent + starred issues (sidebar)
      recentIds: [],
      starredIds: [],
      toggleStarred: (id) =>
        set((state) => ({
          starredIds: state.starredIds.includes(id)
            ? state.starredIds.filter((s) => s !== id)
            : [...state.starredIds, id],
        })),

      // Sidebar customization
      sidebarSections: {
        shortcuts: true,
        workspace: true,
        spaces: true,
        views: true,
        manage: true,
      },
      toggleSidebarSection: (key) =>
        set((state) => ({
          sidebarSections: { ...state.sidebarSections, [key]: !state.sidebarSections[key] },
        })),

      // Toasts
      toasts: [],
      pushToast: (kind, message) => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }));
        window.setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, TOAST_TTL_MS);
      },
      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      initializeProject: async () => {
        const slug = getWorkspaceSlug();
        const storageKey = workspaceStorageKey(slug);
        set({ isLoading: true, error: null, workspaceSlug: slug, syncStatus: 'loading' });
        try {
          // Pull from cloud and read local in parallel; newest wins.
          const [cloud, localRaw] = await Promise.all([
            cloudPull(slug),
            Promise.resolve(localStorage.getItem(storageKey)),
          ]);

          let local: (Project & { updatedAt?: string }) | null = null;
          try {
            local = localRaw ? (JSON.parse(localRaw) as Project) : null;
          } catch {
            local = null;
          }

          let project: Project;
          let status: ProjectState['syncStatus'] = 'idle';

          if (cloud.ok) {
            status = 'synced';
            const cloudData = cloud.record.data as Project & { updatedAt?: string };
            const cloudTime = cloud.record.updatedAt;
            const localTime = local?.updatedAt ?? '';
            if (!local || cloudTime >= localTime) {
              project = normalizeProject(cloudData);
              try {
                localStorage.setItem(storageKey, JSON.stringify(cloudData));
              } catch {
                // Storage full — cloud copy is still authoritative.
              }
            } else {
              project = normalizeProject(local);
              // Local is newer — push it up to converge.
              set({ project, isLoading: false, syncStatus: status });
              get().syncPushDebounced();
              return;
            }
          } else if (cloud.reason === 'not-configured' || cloud.reason === 'unauthorized') {
            status = 'local';
            set({ syncNeedsLogin: cloud.reason === 'unauthorized' });
            project = local ? normalizeProject(local) : createDefaultProject();
            if (!local) {
              try {
                localStorage.setItem(storageKey, JSON.stringify(project));
              } catch {
                // Non-fatal.
              }
            }
          } else {
            // Network error or cloud empty — fall back to local.
            if (local) {
              project = normalizeProject(local);
            } else if (cloud.reason === 'not-found') {
              project = createDefaultProject();
              try {
                localStorage.setItem(storageKey, JSON.stringify(project));
              } catch {
                // Non-fatal.
              }
              set({ project, isLoading: false, syncStatus: status });
              // First save for this workspace — push it to the cloud.
              get().syncPushDebounced();
              return;
            } else {
              project = createDefaultProject();
            }
          }

          set({ project, isLoading: false, syncStatus: status });
        } catch (e) {
          set({ error: 'Failed to load project', isLoading: false, syncStatus: 'error' });
          const project = createDefaultProject();
          set({ project });
        }
      },

      saveProject: async () => {
        const { project, workspaceSlug } = get();
        if (!project) return;
        try {
          const updated = { ...project, updatedAt: new Date().toISOString() };
          localStorage.setItem(workspaceStorageKey(workspaceSlug), JSON.stringify(updated));
          set({ project: updated });
          // Sync to cloud in the background (debounced).
          get().syncPushDebounced();
        } catch (e) {
          set({ error: 'Failed to save project' });
        }
      },

      setProject: (project: Project) => set({ project }),

      clearError: () => set({ error: null }),

      // Cross-device sync
      workspaceSlug: DEFAULT_SLUG,
      syncStatus: 'idle',
      syncNeedsLogin: false,

      syncPush: async () => {
        const { project, workspaceSlug, syncStatus } = get();
        if (!project || syncStatus === 'saving' || syncStatus === 'loading') return;
        set({ syncStatus: 'saving' });
        const record = {
          data: project,
          updatedAt: project.updatedAt ?? new Date().toISOString(),
          deviceId: getDeviceId(),
        };
        const res = await cloudPush(workspaceSlug, record);
        if (res.ok) {
          set({ syncStatus: 'synced', syncNeedsLogin: false });
        } else if (res.reason === 'not-configured') {
          set({ syncStatus: 'local', syncNeedsLogin: false });
        } else if (res.reason === 'unauthorized') {
          set({ syncStatus: 'local', syncNeedsLogin: true });
        } else if (res.reason === 'conflict' && res.record) {
          // Cloud is newer — take it.
          const project = normalizeProject(res.record.data as Project);
          try {
            localStorage.setItem(
              workspaceStorageKey(workspaceSlug),
              JSON.stringify(res.record.data)
            );
          } catch {
            // Non-fatal.
          }
          set({ project, syncStatus: 'synced' });
          get().pushToast('info', 'Updated from another device');
        } else {
          set({ syncStatus: 'error' });
        }
      },

      syncPushDebounced: () => {
        if (typeof window === 'undefined') return;
        const w = window as unknown as { __syncTimer?: number };
        if (w.__syncTimer) window.clearTimeout(w.__syncTimer);
        w.__syncTimer = window.setTimeout(() => {
          get().syncPush();
        }, 2000);
      },

      syncPull: async () => {
        const { workspaceSlug, project } = get();
        const res = await cloudPull(workspaceSlug);
        if (!res.ok) {
          if (res.reason === 'not-configured') set({ syncStatus: 'local', syncNeedsLogin: false });
          else if (res.reason === 'unauthorized')
            set({ syncStatus: 'local', syncNeedsLogin: true });
          return;
        }
        const cloudTime = res.record.updatedAt;
        const localTime = project?.updatedAt ?? '';
        if (cloudTime > localTime) {
          const next = normalizeProject(res.record.data as Project);
          try {
            localStorage.setItem(
              workspaceStorageKey(workspaceSlug),
              JSON.stringify(res.record.data)
            );
          } catch {
            // Non-fatal.
          }
          set({ project: next, syncStatus: 'synced' });
          get().pushToast('info', 'Board updated from another device');
        }
      },

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
        get().pushToast('success', `Issue ${key} created`);
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
        const doomed = get().project?.issues.find((i) => i.id === issueId);
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
        if (doomed) get().pushToast('success', `Issue ${doomed.key} deleted`);
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
        const label = STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
        get().pushToast('success', `${issue.key} moved to ${label}`);
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
        get().pushToast('success', 'Project exported');
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
          get().pushToast('success', 'Project imported');
        } catch (e) {
          get().pushToast('error', 'Invalid project file');
          throw new Error('Invalid project file');
        }
      },

      loadSampleData: () => {
        const project = createSampleProject();
        set({ project });
        get().saveProject();
        get().pushToast('success', 'Sample dataset loaded');
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
        get().pushToast('success', 'Workspace cleared');
      },
    }),
    {
      name: 'm4ster-tracker-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        project: state.project,
        recentIds: state.recentIds,
        starredIds: state.starredIds,
        sidebarSections: state.sidebarSections,
      }),
    }
  )
);
