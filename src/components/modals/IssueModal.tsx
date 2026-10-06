import { useEffect } from 'react';
import type { Issue, Project, Status, IssueType, Priority } from '@/types';
import { X, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PRIORITIES, ISSUE_TYPES, STATUSES } from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface IssueModalProps {
  project: Project;
  issue: Issue | null;
  onClose: () => void;
}

const defaultValues = {
  title: '',
  description: '',
  type: 'task' as IssueType,
  status: 'backlog' as Status,
  priority: 'medium' as Priority,
  storyPoints: 0,
  assignee: '',
  labels: '',
  epicId: '',
  sprintId: '',
  dueDate: '',
};

export function IssueModal({ project, issue, onClose }: IssueModalProps) {
  const isEditing = !!issue;
  const { createIssue, updateIssue, deleteIssue } = useProjectStore.getState();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues });

  useEffect(() => {
    if (issue) {
      Object.entries(issue).forEach(([key, value]) => {
        if (key === 'labels') {
          setValue('labels', (value as string[]).join(', '));
        } else if (key in defaultValues) {
          setValue(key as keyof typeof defaultValues, value as any);
        }
      });
    } else {
      Object.keys(defaultValues).forEach((key) => {
        setValue(
          key as keyof typeof defaultValues,
          defaultValues[key as keyof typeof defaultValues]
        );
      });
      setValue('status', useProjectStore.getState().newIssueDefaultStatus);
    }
  }, [issue, setValue]);

  const onSubmit = (data: typeof defaultValues) => {
    if (!data.title.trim()) return;

    const issueData = {
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      status: data.status,
      priority: data.priority,
      storyPoints: data.storyPoints,
      assignee: data.assignee.trim() || undefined,
      labels: data.labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      epicId: data.epicId || undefined,
      sprintId: data.sprintId || undefined,
      dueDate: data.dueDate || undefined,
    };

    if (isEditing && issue) {
      updateIssue(issue.id, issueData);
    } else {
      createIssue(issueData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && issue && window.confirm('Delete this issue?')) {
      deleteIssue(issue.id);
      onClose();
    }
  };

  const epics = project.epics;
  const sprints = project.sprints;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
    >
      <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-border sticky top-0 bg-inherit z-10">
          <h2 id="issue-modal-title" className="text-xl font-semibold">
            {isEditing ? 'Edit Issue' : 'Create Issue'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg motion-press"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4" noValidate>
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="title"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What needs to be done?"
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Details, acceptance criteria, notes..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Type
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} style={{ color: p.color }}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="storyPoints" className="block text-sm font-medium mb-1">
                Story Points
              </label>
              <input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                {...register('storyPoints', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium mb-1">
                Assignee
              </label>
              <input
                id="assignee"
                type="text"
                {...register('assignee')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="epicId" className="block text-sm font-medium mb-1">
                Epic
              </label>
              <select
                id="epicId"
                {...register('epicId')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">None</option>
                {epics.map((epic) => (
                  <option
                    key={epic.id}
                    value={epic.id}
                    style={{ borderLeft: `4px solid ${epic.color}` }}
                  >
                    {epic.key}: {epic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sprintId" className="block text-sm font-medium mb-1">
                Sprint
              </label>
              <select
                id="sprintId"
                {...register('sprintId')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">None</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="labels" className="block text-sm font-medium mb-1">
              Labels (comma separated)
            </label>
            <input
              id="labels"
              type="text"
              {...register('labels')}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="frontend, backend, urgent, etc."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-border">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 motion-press flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 motion-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press flex items-center gap-2"
            >
              <Save size={16} /> {isEditing ? 'Save Changes' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
