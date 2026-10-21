import { Search, X, User, Tag, Zap, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Issue, Priority, Status } from '@/types';
import { STATUSES } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { useSearch } from '@/hooks/useSearch';
import { ModalShell } from '@/components/ui/ModalShell';
import { useProjectStore } from '@/store/projectStore';
import { usePlanStore } from '@/store/planStore';
import { canUse } from '@/lib/plan';

interface SearchModalProps {
  onSelectIssue: (issue: Issue) => void;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#64748b',
  medium: '#0ea5e9',
  high: '#f59e0b',
  critical: '#ef4444',
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: '#64748b',
  todo: '#0ea5e9',
  'in-progress': '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-500/30 px-0.5 text-yellow-200">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function SearchModal({ onSelectIssue, onClose }: SearchModalProps) {
  const { query, setQuery, isOpen, results, selectedIndex, handleKeyDown, close } = useSearch();
  const [actionIndex, setActionIndex] = useState(0);
  const isActionMode = query.startsWith('>');

  const paletteActions = useMemo(() => {
    const s = useProjectStore.getState();
    const all = [
      { id: 'go-board', label: 'Go to Board', hint: '1', run: () => s.setActiveView('board') },
      { id: 'go-list', label: 'Go to List', hint: '2', run: () => s.setActiveView('list') },
      { id: 'go-backlog', label: 'Go to Backlog', hint: '3', run: () => s.setActiveView('backlog') },
      { id: 'go-calendar', label: 'Go to Calendar', hint: '4', run: () => s.setActiveView('calendar') },
      { id: 'go-timeline', label: 'Go to Timeline', hint: '5', run: () => s.setActiveView('timeline') },
      { id: 'go-workload', label: 'Go to Workload', hint: '6', run: () => s.setActiveView('workload') },
      { id: 'go-sprints', label: 'Go to Sprints', hint: '7', run: () => s.setActiveView('sprints') },
      { id: 'go-reports', label: 'Go to Reports', hint: '8', run: () => s.setActiveView('reports') },
      {
        id: 'new-issue', label: 'New issue', hint: 'N',
        run: () => { s.setNewIssueDefaultStatus('backlog'); s.setSelectedIssue(null); s.setShowIssueModal(true); },
      },
      { id: 'new-epic', label: 'New epic', hint: 'E', run: () => s.setShowEpicModal(true) },
      { id: 'new-sprint', label: 'New sprint', hint: 'S', run: () => s.setShowSprintModal(true) },
      { id: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', run: () => s.setShowShortcutsModal(true) },
      { id: 'settings', label: 'Project settings', hint: '', run: () => s.setShowSettingsModal(true) },
      { id: 'export', label: 'Export workspace JSON', hint: '', run: () => s.exportProject() },
      {
        id: 'export-csv',
        label: 'Export issues as CSV',
        hint: 'Pro',
        run: () => {
          const { plan, openUpgrade } = usePlanStore.getState();
          if (!canUse(plan, 'export:csv')) {
            openUpgrade('export:csv');
            return;
          }
          s.exportCSV();
        },
      },
    ];
    const q = query.slice(1).trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  const runAction = (i: number) => {
    const a = paletteActions[i];
    if (!a) return;
    close();
    onClose();
    // Run after the modal closes so focus/blur settles.
    setTimeout(() => a.run(), 0);
  };

  const onPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (!isActionMode) return handleKeyDown(e);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActionIndex((p) => Math.min(p + 1, paletteActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActionIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAction(actionIndex);
    } else {
      handleKeyDown(e);
    }
  };

  const handleSelectIssue = (issue: (typeof results)[0]['issue']) => {
    onSelectIssue(issue);
    close();
    onClose();
  };

  const createNewIssue = () => {
    const s = useProjectStore.getState();
    close();
    onClose();
    // Run after the modal closes so focus/blur settles (same as palette actions).
    setTimeout(() => {
      s.setNewIssueDefaultStatus('backlog');
      s.setSelectedIssue(null);
      s.setShowIssueModal(true);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      onClose={close}
      align="top"
      label="Search issues"
      panel="w-full max-w-3xl animate-scale-in"
    >
      {/* Search Input */}
      <div className="rounded-t-xl border border-white/10 bg-[var(--bg-deep)] shadow-2xl shadow-black/50">
        <div className="relative p-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActionIndex(0); }}
            onKeyDown={onPaletteKeyDown}
            autoFocus
            placeholder="Search issues... (title, key, labels, assignee) — type > for actions"
            className="w-full rounded-lg border border-white/10 bg-[var(--bg-deep)] py-3 pl-10 pr-12 text-lg text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            aria-label="Search issues"
          />
          <button
            onClick={close}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 motion-press"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="border-t border-white/10 px-4 pb-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">⌘K</kbd> Close
            </span>
            <span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">⏎</kbd> Select
            </span>
            <span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[60vh] overflow-y-auto rounded-b-xl border border-t-0 border-white/10 bg-[var(--bg-deep)] shadow-2xl shadow-black/50">
        {isActionMode ? (
          paletteActions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-lg text-slate-200">No actions match "{query.slice(1).trim()}"</p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Actions">
              {paletteActions.map((a, i) => (
                <li
                  key={a.id}
                  role="option"
                  aria-selected={i === actionIndex}
                  onClick={() => runAction(i)}
                  className={`flex cursor-pointer items-center justify-between border-t border-white/5 px-4 py-3 motion-press ${
                    i === actionIndex ? 'bg-primary-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3 text-[15px] text-slate-100">
                    <ChevronRight size={15} className="text-slate-500" />
                    {a.label}
                  </span>
                  {a.hint && (
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                      {a.hint}
                    </kbd>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : results.length === 0 ? (
          query.trim() ? (
            <div className="p-8 text-center text-slate-400">
              <Search className="mx-auto mb-3 text-slate-600" size={32} />
              <p className="text-lg text-slate-200">No issues found for "{query}"</p>
              <p className="mt-1 text-sm">Try different keywords, or create a new issue</p>
              <button
                onClick={createNewIssue}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-85 motion-press"
              >
                Create issue
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Search className="mx-auto mb-3 text-slate-600" size={32} />
              <p className="text-lg text-slate-200">Start typing to search issues</p>
              <p className="mt-1 text-sm">Searches title, description, key, labels, assignee</p>
            </div>
          )
        ) : (
          <ul role="listbox" aria-label="Search results">
            {results.map(({ issue, matchedFields }, index) => (
              <li
                key={issue.id}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleSelectIssue(issue)}
                // Staggered entry: first few rows rise in one after another.
                style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
                className={`animate-fade-up cursor-pointer border-t border-white/5 px-4 py-3 motion-press ${
                  index === selectedIndex ? 'bg-primary-500/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    <IssueTypeIcon type={issue.type} size={15} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-400">
                        {issue.key}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: PRIORITY_COLORS[issue.priority] + '20',
                          color: PRIORITY_COLORS[issue.priority],
                        }}
                      >
                        {issue.priority}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: STATUS_COLORS[issue.status] + '20',
                          color: STATUS_COLORS[issue.status],
                        }}
                      >
                        {STATUSES.find((s) => s.value === issue.status)?.label}
                      </span>
                    </div>

                    <h4 className="mt-1 truncate text-base font-medium text-slate-100">
                      {highlightMatch(issue.title, query)}
                    </h4>

                    {issue.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                        {highlightMatch(issue.description, query)}
                      </p>
                    )}

                    {matchedFields.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {matchedFields.map((field) => (
                          <span
                            key={field}
                            className="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-300"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {issue.assignee && (
                        <span className="flex items-center gap-1">
                          <User size={12} /> {issue.assignee}
                        </span>
                      )}
                      {issue.labels.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {issue.labels.slice(0, 3).join(', ')}
                          {issue.labels.length > 3 && ` +${issue.labels.length - 3}`}
                        </span>
                      )}
                      {issue.storyPoints > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Zap size={12} /> {issue.storyPoints} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
