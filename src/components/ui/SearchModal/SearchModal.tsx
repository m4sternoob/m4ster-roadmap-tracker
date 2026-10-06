import { Search, X, User, Tag, Zap } from 'lucide-react';
import type { Issue, Priority, Status } from '@/types';
import { STATUSES } from '@/types';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { useSearch } from '@/hooks/useSearch';

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
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function SearchModal({ onSelectIssue, onClose }: SearchModalProps) {
  const { query, setQuery, isOpen, results, selectedIndex, handleKeyDown, close } = useSearch();

  const handleSelectIssue = (issue: (typeof results)[0]['issue']) => {
    onSelectIssue(issue);
    close();
    onClose();
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 dark:bg-black/70"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-3xl animate-scale-in">
        {/* Search Input */}
        <div className="bg-white dark:bg-dark-card rounded-t-xl border border-slate-200 dark:border-dark-border shadow-xl">
          <div className="relative p-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Search issues... (title, key, labels, assignee)"
              className="w-full pl-10 pr-12 py-3 text-lg bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-inherit"
              aria-label="Search issues"
            />
            <button
              onClick={close}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 motion-press"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="px-4 pb-3 border-t border-slate-200 dark:border-dark-border">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-dark-muted">
              <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">⌘K</kbd> Close
              <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd> Navigate
              <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">⏎</kbd> Select
              <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> Close
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-dark-card rounded-b-xl border border-slate-200 dark:border-dark-border border-t-0 max-h-[60vh] overflow-y-auto shadow-xl">
          {results.length === 0 ? (
            query.trim() ? (
              <div className="p-8 text-center text-slate-500 dark:text-dark-muted">
                <Search className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
                <p className="text-lg">No issues found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or create a new issue</p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-dark-muted">
                <Search className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
                <p className="text-lg">Start typing to search issues</p>
                <p className="text-sm mt-1">Searches title, description, key, labels, assignee</p>
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
                  className={`px-4 py-3 border-t border-slate-200 dark:border-dark-border motion-press cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Issue Type Icon */}
                    <span className="shrink-0 mt-0.5">
                      <IssueTypeIcon type={issue.type} size={15} />
                    </span>

                    {/* Issue Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-slate-600 dark:text-dark-text">
                          {issue.key}
                        </span>
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                          style={{
                            backgroundColor: PRIORITY_COLORS[issue.priority] + '20',
                            color: PRIORITY_COLORS[issue.priority],
                          }}
                        >
                          {issue.priority}
                        </span>
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                          style={{
                            backgroundColor: STATUS_COLORS[issue.status] + '20',
                            color: STATUS_COLORS[issue.status],
                          }}
                        >
                          {STATUSES.find((s) => s.value === issue.status)?.label}
                        </span>
                      </div>

                      <h4 className="mt-1 font-medium text-base text-slate-900 dark:text-dark-text truncate">
                        {highlightMatch(issue.title, query)}
                      </h4>

                      {issue.description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-dark-muted line-clamp-2">
                          {highlightMatch(issue.description, query)}
                        </p>
                      )}

                      {/* Matched fields badges */}
                      {matchedFields.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {matchedFields.map((field) => (
                            <span
                              key={field}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-dark-muted">
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
      </div>
    </div>
  );
}
