import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  HelpCircle,
  Plus,
  Layers,
  Calendar,
  BarChart2,
  List,
  Keyboard,
  Maximize,
} from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useProjectStore } from '@/store/projectStore';

interface CommandPaletteProps {
  onClose: () => void;
}

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'create' | 'view' | 'help' | 'system';
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { toggleFullscreen } = useFullscreen();
  const { setActiveView } = useProjectStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [query, setQuery] = useState('');

  // Build command actions
  const actions = useMemo((): CommandAction[] => {
    const actions: CommandAction[] = [
      // Navigation
      {
        id: 'search',
        label: 'Search Issues',
        description: 'Open global search (Cmd+K)',
        shortcut: '⌘K',
        icon: <Search size={16} />,
        action: () => {},
        category: 'navigation',
      },
      {
        id: 'board',
        label: 'Board View',
        description: 'Switch to Kanban board',
        shortcut: '1',
        icon: <Layers size={16} />,
        action: () => setActiveView('board'),
        category: 'navigation',
      },
      {
        id: 'backlog',
        label: 'Backlog View',
        description: 'View backlog items',
        shortcut: '2',
        icon: <List size={16} />,
        action: () => setActiveView('backlog'),
        category: 'navigation',
      },
      {
        id: 'sprints',
        label: 'Sprints View',
        description: 'View sprints',
        shortcut: '3',
        icon: <Calendar size={16} />,
        action: () => setActiveView('sprints'),
        category: 'navigation',
      },
      {
        id: 'reports',
        label: 'Reports View',
        description: 'View burndown charts',
        shortcut: '4',
        icon: <BarChart2 size={16} />,
        action: () => setActiveView('reports'),
        category: 'navigation',
      },

      // Create
      {
        id: 'new-issue',
        label: 'New Issue',
        description: 'Create a new issue',
        shortcut: 'N',
        icon: <Plus size={16} />,
        action: () => {
          useProjectStore.getState().setSelectedIssue(null);
          useProjectStore.getState().setShowIssueModal(true);
        },
        category: 'create',
      },
      {
        id: 'new-epic',
        label: 'New Epic',
        description: 'Create a new epic',
        shortcut: 'E',
        icon: <Layers size={16} />,
        action: () => useProjectStore.getState().setShowEpicModal(true),
        category: 'create',
      },
      {
        id: 'new-sprint',
        label: 'New Sprint',
        description: 'Create a new sprint',
        shortcut: 'S',
        icon: <Calendar size={16} />,
        action: () => useProjectStore.getState().setShowSprintModal(true),
        category: 'create',
      },

      // View
      {
        id: 'toggle-fullscreen',
        label: 'Toggle Fullscreen',
        description: 'Toggle fullscreen mode',
        shortcut: 'F / F11',
        icon: <Maximize size={16} />,
        action: () => {},
        category: 'view',
      },

      // Help
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'Show all keyboard shortcuts',
        shortcut: '?',
        icon: <HelpCircle size={16} />,
        action: () => {
          /* show shortcuts help */
        },
        category: 'help',
      },
    ];

    return actions;
  }, []);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      return actions;
    }
    const q = query.toLowerCase();
    return actions.filter(
      (action) =>
        action.label.toLowerCase().includes(q) ||
        action.description?.toLowerCase().includes(q) ||
        action.shortcut?.toLowerCase().includes(q) ||
        action.category.toLowerCase().includes(q)
    );
  }, [actions, query]);

  // Handle keyboard navigation inside palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedActionIndex((prev) => Math.min(prev + 1, filteredActions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedActionIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedActionIndex]) {
            filteredActions[selectedActionIndex].action();
            setIsOpen(false);
            onClose();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          onClose();
          break;
      }
    },
    [filteredActions, selectedActionIndex, onClose]
  );

  // Global key handlers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setSelectedActionIndex(0);
      }
      // F / F11 for fullscreen
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleFullscreen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div className="w-full max-w-2xl animate-scale-in">
        <div className="bg-white dark:bg-dark-card rounded-xl border dark:border-dark-border shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b dark:border-dark-border">
            <h2 id="command-palette-title" className="text-xl font-semibold">
              Command Palette
            </h2>
            <div className="flex items-center gap-2">
              <Keyboard className="text-slate-400 dark:text-dark-muted" size={18} />
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose();
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg motion-press"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Type a command..."
                className="w-full pl-12 pr-12 py-3 text-lg bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-inherit"
                aria-label="Search commands"
              />
              <Keyboard
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {filteredActions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-dark-muted">
                <Search className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
                <p className="text-lg">No commands found for "{query}"</p>
              </div>
            ) : (
              <ul role="listbox" aria-label="Commands">
                {filteredActions.map((action, index) => (
                  <li
                    key={action.id}
                    role="option"
                    aria-selected={index === selectedActionIndex}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedActionIndex(index)}
                    className={`px-4 py-3 rounded-lg motion-press cursor-pointer flex items-center gap-3 ${
                      index === selectedActionIndex
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-dark-muted">
                      {action.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-dark-text truncate">
                        {action.label}
                      </div>
                      {action.description && (
                        <p className="text-sm text-slate-500 dark:text-dark-muted truncate">
                          {action.description}
                        </p>
                      )}
                    </div>
                    {action.shortcut && (
                      <span className="px-2 py-0.5 text-xs font-mono text-slate-400 dark:text-dark-muted bg-slate-100 dark:bg-slate-800 rounded">
                        {action.shortcut}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-3 border-t dark:border-dark-border text-xs text-slate-400 dark:text-dark-muted text-center">
            <Keyboard size={12} className="inline" />{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd>{' '}
            Execute &nbsp;
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> Close
            &nbsp;
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd> Navigate
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'create' | 'view' | 'help' | 'system';
}
