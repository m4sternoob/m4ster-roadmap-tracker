import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from 'lucide-react';
import type { Issue, Priority, Project, Status } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityIcon } from '@/components/issues/PriorityIcon';
import { Avatar } from '@/components/issues/Avatar';
import { StatusPill } from '@/components/issues/StatusPill';
import { useProjectStore } from '@/store/projectStore';

type SortKey = 'key' | 'title' | 'status' | 'priority' | 'assignee' | 'storyPoints' | 'dueDate';

const STATUS_ORDER: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

function compare(a: Issue, b: Issue, key: SortKey): number {
  switch (key) {
    case 'key':
      return a.key.localeCompare(b.key, undefined, { numeric: true });
    case 'title':
      return a.title.localeCompare(b.title);
    case 'status':
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    case 'priority':
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    case 'assignee':
      return (a.assignee ?? '').localeCompare(b.assignee ?? '');
    case 'storyPoints':
      return a.storyPoints - b.storyPoints;
    case 'dueDate':
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  }
}

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: null, label: 'Type', className: 'w-12' },
  { key: 'key', label: 'Key', className: 'w-24' },
  { key: 'title', label: 'Summary' },
  { key: 'status', label: 'Status', className: 'w-32' },
  { key: 'assignee', label: 'Assignee', className: 'w-36' },
  { key: 'priority', label: 'Priority', className: 'w-28' },
  { key: 'storyPoints', label: 'Points', className: 'w-16 text-right' },
  { key: 'dueDate', label: 'Due', className: 'w-28' },
];

export function ListView({
  project,
  onIssueClick,
}: {
  project: Project;
  onIssueClick: (issue: Issue) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('key');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const issues = useMemo(() => {
    const sorted = [...project.issues].sort((a, b) => compare(a, b, sortKey));
    return sortDir === 1 ? sorted : sorted.reverse();
  }, [project.issues, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const openCreate = () => {
    const s = useProjectStore.getState();
    s.setNewIssueDefaultStatus('backlog');
    s.setNewIssuePreset(null);
    s.setSelectedIssue(null);
    s.setShowIssueModal(true);
  };

  return (
    <div className="rounded-xl border border-[#2c333a] bg-[#1d2125] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-[#2c333a]">
              {COLUMNS.map((col) => (
                <th key={col.label} className={`px-3 py-2.5 ${col.className ?? ''}`}>
                  {col.key ? (
                    <button
                      onClick={() => toggleSort(col.key!)}
                      className="flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wider text-[#626f86] hover:text-[#b6c2cf] motion-press"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 1 ? (
                          <ArrowUp size={11} className="text-[#579dff]" />
                        ) : (
                          <ArrowDown size={11} className="text-[#579dff]" />
                        )
                      ) : (
                        <ChevronsUpDown size={11} className="opacity-0 hover:opacity-60" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#626f86]">
                      {col.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className="border-b border-[#2c333a]/60 last:border-0 hover:bg-[#22272b] cursor-pointer motion-interactive"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onIssueClick(issue);
                }}
              >
                <td className="px-3 py-2">
                  <IssueTypeIcon type={issue.type} size={16} />
                </td>
                <td className="px-3 py-2 font-mono text-[12px] text-[#8c9bab] whitespace-nowrap">
                  {issue.key}
                </td>
                <td className="px-3 py-2 text-[13.5px] text-[#e6edf3] max-w-[320px] truncate">
                  {issue.title}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={issue.status} />
                </td>
                <td className="px-3 py-2">
                  {issue.assignee ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-[#b6c2cf]">
                      <Avatar name={issue.assignee} size={20} />
                      <span className="truncate max-w-[100px]">{issue.assignee}</span>
                    </span>
                  ) : (
                    <span className="text-[12.5px] text-[#626f86]">Unassigned</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <PriorityIcon priority={issue.priority} size={13} />
                    <span className="text-[12.5px] text-[#8c9bab] capitalize">
                      {issue.priority}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-[13px] text-[#b6c2cf]">
                  {issue.storyPoints > 0 ? (
                    issue.storyPoints
                  ) : (
                    <span className="text-[#3d474f]">–</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[12.5px] text-[#8c9bab] whitespace-nowrap">
                  {issue.dueDate ? (
                    new Date(issue.dueDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  ) : (
                    <span className="text-[#3d474f]">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {issues.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] text-[#8c9bab] mb-4">No issues yet — create the first one.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-md text-[13px] font-medium bg-[#0c66e4] hover:bg-[#0055cc] text-white motion-press inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create issue
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-[#2c333a] text-[12px] text-[#626f86]">
          {issues.length} issue{issues.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
