import { useEffect, useMemo, useState } from 'react';
import type { CreateIssueInput, Issue, IssueType, Priority, Project, Status } from '@/types';
import { PRIORITIES, STATUSES } from '@/types';
import { ChevronDown, Link2, MessageSquare, Plus, Trash2, X, Archive, ArchiveRestore } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { StatusPill } from '@/components/issues/StatusPill';
import { ModalShell } from '@/components/ui/ModalShell';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { AttachmentsField } from '@/components/modals/AttachmentsField';
import { CURRENT_USER } from '@/components/board/boardFilters';
import { formatRelativeTime } from '@/utils/helpers';

const TYPE_ORDER: IssueType[] = ['task', 'story', 'bug', 'epic', 'subtask'];
const TYPE_LABELS: Record<IssueType, string> = {
  task: 'Task',
  story: 'Story',
  bug: 'Bug',
  epic: 'Epic',
  subtask: 'Sub-task',
};

const inputCls =
  'w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-surface)] border border-transparent hover:border-[var(--bg-raised)] focus:border-[var(--accent)] focus:bg-[var(--bg-app)] focus:outline-none text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] motion-interactive';
const labelCls = 'block text-[12px] font-medium text-[var(--text-muted)] mb-1 select-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/* ---------------------------------- create ---------------------------------- */

function CreateForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const { createIssue, newIssueDefaultStatus, newIssuePreset, setNewIssuePreset } =
    useProjectStore();
  const [type, setType] = useState<IssueType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(newIssuePreset?.priority ?? 'medium');
  const [assignee, setAssignee] = useState(newIssuePreset?.assignee ?? '');
  const [labels, setLabels] = useState('');
  const [storyPoints, setStoryPoints] = useState(0);
  const [epicId, setEpicId] = useState('');
  const [sprintId, setSprintId] = useState(project.currentSprintId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);

  const submit = () => {
    if (!title.trim()) {
      setTriedSubmit(true);
      return;
    }
    createIssue({
      title: title.trim(),
      description: description.trim(),
      type,
      status: newIssueDefaultStatus,
      priority,
      storyPoints: Math.max(0, storyPoints || 0),
      assignee: assignee.trim() || undefined,
      labels: labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      epicId: epicId || undefined,
      sprintId: sprintId || undefined,
      dueDate: dueDate || undefined,
    });
    setNewIssuePreset(null);
    onClose();
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Create issue</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 text-[13px] text-[var(--text-muted)]">
        <span className="text-[var(--text-faint)]">Project</span>
        <span className="w-5 h-5 rounded bg-gradient-to-br from-[var(--accent-bright)] to-[var(--accent)] text-white text-[9px] font-bold inline-flex items-center justify-center">
          {project.key.slice(0, 2).toUpperCase()}
        </span>
        <span className="text-[var(--text-secondary)] font-medium">{project.name}</span>
      </div>

      <div className="space-y-4">
        <Field label="Issue type">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] border motion-interactive ${
                  type === t
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)] font-medium'
                    : 'bg-[var(--bg-surface)] border-[var(--bg-raised)] text-[var(--text-muted)] hover:border-[var(--chrome)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <IssueTypeIcon type={t} size={15} />
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </Field>

        <div>
          <label className={labelCls} htmlFor="new-title">
            Summary <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            id="new-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="What needs to be done?"
            className={`${inputCls} ${triedSubmit && !title.trim() ? '!border-[var(--danger)]' : ''}`}
          />
          {triedSubmit && !title.trim() && (
            <p className="text-[var(--danger)] text-[12px] mt-1">Summary is required.</p>
          )}
        </div>

        <div>
          <label className={labelCls} htmlFor="new-desc">
            Description
          </label>
          <textarea
            id="new-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Details, acceptance criteria, notes..."
            className={`${inputCls} resize-y`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>
          <Field label="Assignee">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Name"
              list="assignee-suggestions"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Story points">
            <input
              type="number"
              min={0}
              max={100}
              value={storyPoints}
              onChange={(e) => setStoryPoints(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Epic">
            <div className="relative">
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
              >
                <option value="">None</option>
                {project.epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>
          <Field label="Sprint">
            <div className="relative">
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
              >
                <option value="">Backlog (no sprint)</option>
                {project.sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>
        </div>

        <Field label="Labels (comma separated)">
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="frontend, urgent, ..."
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--bg-raised)]">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] motion-press"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="px-3.5 py-1.5 rounded-md text-[13px] font-medium bg-[var(--accent)] text-white btn-artcraft"
        >
          Create
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- detail ---------------------------------- */

function DetailView({
  project,
  issue,
  onClose,
}: {
  project: Project;
  issue: Issue;
  onClose: () => void;
}) {
  const { updateIssue, deleteIssue, createIssue, addComment, deleteComment, setShowConfirmDialog,
    addDependency, removeDependency, logTime, deleteTimeEntry, archiveIssue, unarchiveIssue } =
    useProjectStore();

  // Live issue from the store so edits reflect immediately.
  const live = useProjectStore((s) => s.project?.issues.find((i) => i.id === issue.id) ?? issue);

  const [title, setTitle] = useState(live.title);
  const [description, setDescription] = useState(live.description);
  const [commentDraft, setCommentDraft] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  useEffect(() => {
    setTitle(live.title);
    setDescription(live.description);
  }, [live.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtasks = useMemo(
    () => project.issues.filter((i) => i.parentId === live.id),
    [project.issues, live.id]
  );
  const sprint = project.sprints.find((s) => s.id === live.sprintId);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== live.title) updateIssue(live.id, { title: t });
    else setTitle(live.title);
  };
  const saveDescription = () => {
    if (description !== live.description) updateIssue(live.id, { description });
  };

  const postComment = () => {
    if (!commentDraft.trim()) return;
    addComment(live.id, CURRENT_USER, commentDraft);
    setCommentDraft('');
  };

  /** Render @mentions in comment text as highlighted pills. */
  const renderMentions = (text: string): React.ReactNode[] =>
    text.split(/(@[A-Za-z0-9._-]{2,32})/g).map((part, i) =>
      /^@[A-Za-z0-9._-]{2,32}$/.test(part) ? (
        <span
          key={i}
          className="px-1 rounded bg-[var(--accent)]/15 text-[var(--accent-bright)] font-medium"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  const addSubtask = () => {
    const t = subtaskDraft.trim();
    if (!t) return;
    createIssue({
      title: t,
      type: 'subtask',
      status: live.status,
      parentId: live.id,
      priority: live.priority,
    });
    setSubtaskDraft('');
    setShowSubtaskInput(false);
  };

  const confirmDelete = () =>
    setShowConfirmDialog({
      title: `Delete ${live.key}?`,
      message: 'This will permanently delete the issue and its subtasks.',
      onConfirm: () => {
        subtasks.forEach((s) => deleteIssue(s.id));
        deleteIssue(live.id);
        onClose();
      },
    });

  return (
    <div className="max-h-[88vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 sticky top-0 bg-[var(--bg-sunken)] z-10 border-b border-[var(--bg-raised)]">
        <IssueTypeIcon type={live.type} size={17} />
        <span className="text-[13px] font-medium text-[var(--text-muted)]">{live.key}</span>
        <button
          className="flex items-center gap-1 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] px-1.5 py-1 rounded hover:bg-[var(--bg-surface)] motion-press"
          title="Copy link"
          onClick={() =>
            navigator.clipboard
              ?.writeText(`${window.location.origin}${window.location.pathname}#${live.key}`)
              .catch(() => {})
          }
        >
          <Link2 size={13} />
        </button>
        <span className="flex-1" />
        <button
          onClick={() => {
            if (live.archived) {
              unarchiveIssue(live.id);
            } else {
              archiveIssue(live.id);
              onClose();
            }
          }}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
          aria-label={live.archived ? `Restore ${live.key}` : `Archive ${live.key}`}
          title={live.archived ? 'Restore from archive' : 'Archive issue'}
        >
          {live.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        </button>
        <button
          onClick={confirmDelete}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--danger)] motion-press"
          aria-label={`Delete ${live.key}`}
          title="Delete issue"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] motion-press"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Main column */}
        <div className="flex-1 min-w-0 p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label="Issue summary"
            className="w-full text-[20px] font-semibold text-[var(--text-primary)] bg-transparent border border-transparent hover:border-[var(--bg-raised)] focus:border-[var(--accent)] rounded-md px-2 py-1 -ml-2 focus:outline-none motion-interactive"
          />

          <div className="mt-4">
            <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1.5">
              Description
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={6}
              placeholder="Add a description... (drag bottom-right corner to resize)"
              className="w-full min-h-[140px] px-2.5 py-2 rounded-md bg-transparent border border-transparent hover:border-[var(--bg-raised)] focus:border-[var(--accent)] focus:bg-[var(--bg-app)] focus:outline-none text-[13.5px] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] resize-y motion-interactive cursor-ns-resize"
            />
          </div>

          {/* Subtasks */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                Sub-tasks{' '}
                <span className="text-[var(--text-faint)] font-normal">
                  {subtasks.filter((s) => s.status === 'done').length}/{subtasks.length}
                </span>
              </span>
              {!showSubtaskInput && (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="flex items-center gap-1 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-surface)] motion-press"
                >
                  <Plus size={13} /> Add
                </button>
              )}
            </div>
            {showSubtaskInput && (
              <div className="flex gap-2 mb-2">
                <input
                  autoFocus
                  value={subtaskDraft}
                  onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Sub-task summary"
                  className={inputCls}
                />
                <button
                  onClick={addSubtask}
                  className="px-3 rounded-md text-[13px] font-medium bg-[var(--accent)] text-white btn-artcraft shrink-0"
                >
                  Add
                </button>
              </div>
            )}
            <div className="space-y-1">
              {subtasks.map((s) => (
                <button
                  key={s.id}
                  onClick={() => useProjectStore.getState().setSelectedIssue(s)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-surface)] text-left motion-interactive group"
                >
                  <IssueTypeIcon type={s.type} size={14} />
                  <span className="font-mono text-[11.5px] text-[var(--text-faint)]">{s.key}</span>
                  <span
                    className={`flex-1 text-[13px] truncate ${s.status === 'done' ? 'line-through text-[var(--text-faint)]' : 'text-[var(--text-secondary)]'}`}
                  >
                    {s.title}
                  </span>
                  <StatusPill status={s.status} />
                </button>
              ))}
              {subtasks.length === 0 && !showSubtaskInput && (
                <p className="text-[12.5px] text-[var(--text-faint)] px-1">No sub-tasks yet.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-6">
            <div className="flex items-center gap-1.5 mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
              <MessageSquare size={14} className="text-[var(--text-muted)]" />
              Comments
              {live.comments.length > 0 && (
                <span className="text-[var(--text-faint)] font-normal">{live.comments.length}</span>
              )}
            </div>
            <div className="flex gap-2.5 mb-4">
              <Avatar name={CURRENT_USER} size={28} />
              <div className="flex-1">
                <MentionTextarea
                  value={commentDraft}
                  onChange={setCommentDraft}
                  rows={2}
                  placeholder="Add a comment... (@ to mention)"
                  className={`${inputCls} resize-y`}
                  onSubmit={postComment}
                />
                {commentDraft.trim() && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setCommentDraft('')}
                      className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] motion-press"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={postComment}
                      className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white motion-press"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {[...live.comments]
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((c) => (
                  <div key={c.id} className="flex gap-2.5 group">
                    <Avatar name={c.author} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {c.author}
                        </span>
                        <span className="text-[11.5px] text-[var(--text-faint)]">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                        <button
                          onClick={() => deleteComment(live.id, c.id)}
                          className="ml-auto text-[11.5px] text-[var(--text-faint)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 motion-press"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-[13.5px] text-[var(--text-secondary)] mt-0.5 whitespace-pre-wrap break-words">
                        {renderMentions(c.text)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Attachments */}
          <AttachmentsField live={live} />
        </div>

        {/* Right rail */}
        <div className="w-full md:w-[240px] shrink-0 p-5 md:border-l border-t md:border-t-0 border-[var(--bg-raised)] space-y-4">
          <Field label="Status">
            <div className="relative">
              <select
                value={live.status}
                onChange={(e) => updateIssue(live.id, { status: e.target.value as Status })}
                className={`${inputCls} appearance-none pr-8 cursor-pointer font-medium`}
                aria-label="Status"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
            <div className="mt-1.5">
              <StatusPill status={live.status} />
            </div>
          </Field>

          <Field label="Assignee">
            <div className="flex items-center gap-2">
              {live.assignee && <Avatar name={live.assignee} size={22} />}
              <input
                value={live.assignee ?? ''}
                onChange={(e) =>
                  updateIssue(live.id, { assignee: e.target.value.trim() || undefined })
                }
                placeholder="Unassigned"
                list="assignee-suggestions"
                className={inputCls}
                aria-label="Assignee"
              />
            </div>
          </Field>

          <Field label="Priority">
            <div className="relative">
              <select
                value={live.priority}
                onChange={(e) => updateIssue(live.id, { priority: e.target.value as Priority })}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                aria-label="Priority"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                <PriorityIcon priority={live.priority} size={14} />
              </span>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Story points">
              <input
                type="number"
                min={0}
                max={100}
                value={live.storyPoints}
                onChange={(e) =>
                  updateIssue(live.id, { storyPoints: Math.max(0, Number(e.target.value) || 0) })
                }
                className={inputCls}
                aria-label="Story points"
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={live.dueDate ? live.dueDate.slice(0, 10) : ''}
                onChange={(e) => updateIssue(live.id, { dueDate: e.target.value || undefined })}
                className={`${inputCls} [color-scheme:dark]`}
                aria-label="Due date"
              />
            </Field>
          </div>

          <Field label="Epic">
            <div className="relative">
              <select
                value={live.epicId ?? ''}
                onChange={(e) => updateIssue(live.id, { epicId: e.target.value || undefined })}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                aria-label="Epic"
              >
                <option value="">None</option>
                {project.epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>

          <Field label="Sprint">
            <div className="relative">
              <select
                value={live.sprintId ?? ''}
                onChange={(e) => updateIssue(live.id, { sprintId: e.target.value || undefined })}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                aria-label="Sprint"
              >
                <option value="">Backlog</option>
                {project.sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
              />
            </div>
          </Field>

          <Field label="Labels">
            <input
              defaultValue={live.labels.join(', ')}
              onBlur={(e) =>
                updateIssue(live.id, {
                  labels: e.target.value
                    .split(',')
                    .map((l) => l.trim())
                    .filter(Boolean),
                })
              }
              placeholder="comma, separated"
              className={inputCls}
              aria-label="Labels"
            />
          </Field>

          <DependenciesField
            live={live}
            project={project}
            addDependency={addDependency}
            removeDependency={removeDependency}
            inputCls={inputCls}
          />

          <TimeTrackingField
            live={live}
            updateIssue={updateIssue}
            logTime={logTime}
            deleteTimeEntry={deleteTimeEntry}
            inputCls={inputCls}
          />

          <div className="pt-2 text-[12px] text-[var(--text-faint)] space-y-1">
            <div>Created {formatRelativeTime(live.createdAt)}</div>
            <div>Updated {formatRelativeTime(live.updatedAt)}</div>
            {sprint && <div>Sprint: {sprint.name}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ dependencies ------------------------------ */

function DependenciesField({
  live,
  project,
  addDependency,
  removeDependency,
  inputCls,
}: {
  live: Issue;
  project: Project;
  addDependency: (a: string, b: string) => void;
  removeDependency: (a: string, b: string) => void;
  inputCls: string;
}) {
  const [pick, setPick] = useState('');
  const blockedBy = (live.blockedBy ?? [])
    .map((id) => project.issues.find((i) => i.id === id))
    .filter((i): i is Issue => !!i);
  const blocking = project.issues.filter((i) => (i.blockedBy ?? []).includes(live.id));
  const candidates = project.issues.filter(
    (i) => i.id !== live.id && !(live.blockedBy ?? []).includes(i.id)
  );
  const openIssue = (issue: Issue) => useProjectStore.getState().setSelectedIssue(issue);

  return (
    <Field label="Blocked by">
      {blockedBy.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {blockedBy.map((dep) => (
            <li
              key={dep.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg-raised)]"
            >
              <button
                onClick={() => openIssue(dep)}
                className="flex-1 min-w-0 text-left flex items-center gap-2 hover:underline"
                title={dep.title}
              >
                <span className="font-mono text-[11.5px] text-[var(--text-faint)] shrink-0">
                  {dep.key}
                </span>
                <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
                  {dep.title}
                </span>
              </button>
              <button
                onClick={() => removeDependency(live.id, dep.id)}
                className="text-[var(--text-faint)] hover:text-[var(--danger)] motion-press"
                aria-label={`Remove dependency on ${dep.key}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {blocking.length > 0 && (
        <p className="text-[12px] text-[var(--text-muted)] mb-2">
          Blocking: {blocking.map((b) => b.key).join(', ')}
        </p>
      )}
      <div className="flex gap-1.5">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className={`${inputCls} flex-1 min-w-0 cursor-pointer`}
          aria-label="Add blocking issue"
        >
          <option value="">Add blocker…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.key} — {c.title.slice(0, 40)}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            if (pick) {
              addDependency(live.id, pick);
              setPick('');
            }
          }}
          disabled={!pick}
          className="px-2.5 rounded-md bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 motion-press"
          aria-label="Add dependency"
        >
          <Plus size={15} />
        </button>
      </div>
    </Field>
  );
}

/* ------------------------------ time tracking ----------------------------- */

function TimeTrackingField({
  live,
  updateIssue,
  logTime,
  deleteTimeEntry,
  inputCls,
}: {
  live: Issue;
  updateIssue: (id: string, input: Partial<CreateIssueInput>) => void;
  logTime: (id: string, hours: number, note: string, author: string) => void;
  deleteTimeEntry: (id: string, entryId: string) => void;
  inputCls: string;
}) {
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [showLog, setShowLog] = useState(false);
  const entries = live.timeEntries ?? [];
  const total = entries.reduce((s, e) => s + e.hours, 0);

  const submit = () => {
    const h = parseFloat(hours);
    if (!(h > 0)) return;
    logTime(live.id, Math.round(h * 100) / 100, note, CURRENT_USER);
    setHours('');
    setNote('');
    setShowLog(false);
  };

  return (
    <Field label="Time tracking">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          min={0}
          step={0.5}
          value={live.timeEstimate ?? ''}
          onChange={(e) =>
            updateIssue(live.id, {
              timeEstimate: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0),
            })
          }
          placeholder="Est."
          className={`${inputCls} w-20`}
          aria-label="Time estimate (hours)"
        />
        <span className="text-[12px] text-[var(--text-faint)]">h est.</span>
        <span className="ml-auto text-[12.5px] text-[var(--text-secondary)] font-medium">
          {total.toFixed(total % 1 ? 1 : 0)}h logged
        </span>
      </div>
      {live.timeEstimate != null && live.timeEstimate > 0 && (
        <div className="h-1.5 rounded-full bg-[var(--bg-raised)] mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              total > live.timeEstimate ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
            }`}
            style={{ width: `${Math.min(100, (total / live.timeEstimate) * 100)}%` }}
          />
        </div>
      )}
      {entries.length > 0 && (
        <ul className="space-y-1 mb-2 max-h-32 overflow-y-auto">
          {[...entries]
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .map((e) => (
              <li
                key={e.id}
                className="group flex items-center gap-2 text-[12px] text-[var(--text-muted)]"
              >
                <span className="font-medium text-[var(--text-secondary)]">{e.hours}h</span>
                <span className="flex-1 truncate" title={e.note}>
                  {e.note || <span className="italic">no note</span>}
                </span>
                <span className="text-[var(--text-faint)]">{formatRelativeTime(e.date)}</span>
                <button
                  onClick={() => deleteTimeEntry(live.id, e.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-[var(--danger)] motion-press"
                  aria-label="Delete time entry"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
        </ul>
      )}
      {showLog ? (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="number"
              min={0}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className={`${inputCls} w-24`}
              aria-label="Hours worked"
              autoFocus
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you do?"
              className={`${inputCls} flex-1 min-w-0`}
              aria-label="Work note"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setShowLog(false)}
              className="px-2.5 py-1 rounded-md text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] motion-press"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!(parseFloat(hours) > 0)}
              className="px-2.5 py-1 rounded-md text-[12.5px] font-medium bg-[var(--accent)] text-white disabled:opacity-40 motion-press"
            >
              Log time
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowLog(true)}
          className="text-[12.5px] text-[var(--accent-bright)] hover:underline motion-press"
        >
          + Log work
        </button>
      )}
    </Field>
  );
}

/* ---------------------------------- shell ---------------------------------- */

export function IssueModal({
  project,
  issue,
  onClose,
}: {
  project: Project;
  issue: Issue | null;
  onClose: () => void;
}) {
  const isEditing = !!issue;

  return (
    <ModalShell
      onClose={onClose}
      label={isEditing ? `Issue ${issue.key}` : 'Create issue'}
      panel={`w-full rounded-xl border border-white/10 bg-[var(--bg-deep)] text-slate-100 shadow-2xl shadow-black/60 animate-scale-in max-h-[90vh] overflow-y-auto ${
        isEditing ? 'max-w-4xl' : 'max-w-2xl'
      }`}
    >
      <datalist id="assignee-suggestions">
        {Array.from(new Set(project.issues.map((i) => i.assignee).filter(Boolean))).map((a) => (
          <option key={a} value={a!} />
        ))}
      </datalist>
      {isEditing && issue ? (
        <DetailView project={project} issue={issue} onClose={onClose} />
      ) : (
        <CreateForm project={project} onClose={onClose} />
      )}
    </ModalShell>
  );
}
