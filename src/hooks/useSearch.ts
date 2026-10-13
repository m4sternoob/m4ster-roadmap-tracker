import { useState, useCallback, useMemo, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import type { SearchFilters } from '@/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchIssues = useProjectStore((state) => state.searchIssues);
  // Single source of truth lives in the store so TopBar, Cmd+K and App all agree.
  const isOpen = useProjectStore((state) => state.showSearchModal);
  const setStoreOpen = useProjectStore((state) => state.setShowSearchModal);

  // Perform search with current query
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const filters: SearchFilters = { query: query.trim() };
    const issues = searchIssues(filters);

    return issues.map((issue) => {
      const matchedFields: string[] = [];
      const q = query.toLowerCase();

      if (issue.title.toLowerCase().includes(q)) matchedFields.push('title');
      if (issue.description.toLowerCase().includes(q)) matchedFields.push('description');
      if (issue.key.toLowerCase().includes(q)) matchedFields.push('key');
      if (issue.labels.some((l) => l.toLowerCase().includes(q))) matchedFields.push('labels');
      if (issue.assignee?.toLowerCase().includes(q)) matchedFields.push('assignee');

      return { issue, matchedFields };
    });
  }, [query, searchIssues]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          return results[selectedIndex]?.issue;
        case 'Escape':
          close();
          break;
      }
      return null;
    },
    [isOpen, results, selectedIndex]
  );

  const open = useCallback(() => {
    setStoreOpen(true);
    setSelectedIndex(0);
  }, [setStoreOpen]);

  const close = useCallback(() => {
    setStoreOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, [setStoreOpen]);

  // Cmd+K to open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open]);

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen: setStoreOpen,
    results,
    selectedIndex,
    handleKeyDown,
    open,
    close,
  };
}

export const SHORTCUT_LIST: { keys: string; label: string }[] = [
  { keys: '⌘K / Ctrl K', label: 'Command palette' },
  { keys: '/', label: 'Search issues' },
  { keys: '1 – 5', label: 'Board / List / Backlog / Sprints / Reports' },
  { keys: 'N', label: 'New issue' },
  { keys: 'E', label: 'New epic' },
  { keys: 'S', label: 'New sprint' },
  { keys: '?', label: 'This shortcut list' },
  { keys: 'Esc', label: 'Close dialog' },
];

export function useKeyboardShortcuts() {
  const {
    setShowIssueModal,
    setShowEpicModal,
    setShowSprintModal,
    setSelectedIssue,
    setActiveView,
    activeView,
    setShowSearchModal,
    setShowShortcutsModal,
  } = useProjectStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setShowSearchModal(true);
        return;
      }

      // Escape closes the topmost modal
      if (e.key === 'Escape') {
        const st = useProjectStore.getState();
        if (st.showShortcutsModal) return st.setShowShortcutsModal(false);
        if (st.showSettingsModal) return st.setShowSettingsModal(false);
        if (st.showSprintModal) return st.setShowSprintModal(false);
        if (st.showEpicModal) return st.setShowEpicModal(false);
        if (st.showIssueModal) {
          st.setShowIssueModal(false);
          st.setSelectedIssue(null);
          return;
        }
        if (st.showSearchModal) return st.setShowSearchModal(false);
        return;
      }

      // Only trigger shortcuts when not in a modal
      const st = useProjectStore.getState();
      if (
        st.showIssueModal ||
        st.showEpicModal ||
        st.showSprintModal ||
        st.showSettingsModal ||
        st.showSearchModal ||
        st.showShortcutsModal ||
        st.showConfirmDialog
      ) {
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'n':
          if (e.metaKey || e.ctrlKey) return; // Allow browser shortcuts
          e.preventDefault();
          setSelectedIssue(null);
          setShowIssueModal(true);
          break;
        case 'e':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setShowEpicModal(true);
          break;
        case 's':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setShowSprintModal(true);
          break;
        case '1':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setActiveView('board');
          break;
        case '2':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setActiveView('list');
          break;
        case '3':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setActiveView('backlog');
          break;
        case '4':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setActiveView('sprints');
          break;
        case '5':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          setActiveView('reports');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    setShowIssueModal,
    setShowEpicModal,
    setShowSprintModal,
    setSelectedIssue,
    setActiveView,
    activeView,
  ]);
}
