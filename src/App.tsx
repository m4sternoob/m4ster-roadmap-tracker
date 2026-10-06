import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { BoardView } from '@/components/views/BoardView';
import { BacklogView } from '@/components/views/BacklogView';
import { SprintsView } from '@/components/views/SprintsView';
import { ReportsView } from '@/components/views/ReportsView';
import { Toolbar } from '@/components/ui/Toolbar';
import { ViewTransition } from '@/components/ui/ViewTransition';
import { IssueModal } from '@/components/modals/IssueModal';
import { EpicModal } from '@/components/modals/EpicModal';
import { SprintModal } from '@/components/modals/SprintModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchModal } from '@/components/ui/SearchModal/SearchModal';
import { useSearch, useKeyboardShortcuts } from '@/hooks/useSearch';

function App() {
  const {
    initializeProject,
    project,
    activeView,
    selectedIssue,
    setSelectedIssue,
    showIssueModal,
    setShowIssueModal,
    showEpicModal,
    setShowEpicModal,
    showSprintModal,
    setShowSprintModal,
    showSettingsModal,
    setShowSettingsModal,
    showConfirmDialog,
    setShowConfirmDialog,
    dragOverColumn,
    setDragOverColumn,
  } = useProjectStore();

  const { open: openSearch, close: closeSearch, isOpen: showSearchModal } = useSearch();
  useKeyboardShortcuts();

  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

  type ActiveView = 'board' | 'backlog' | 'sprints' | 'reports';

  // Keep the outgoing view mounted for a beat so the switch crossfades
  // instead of snapping. The timer only clears the layer after the
  // exit animation has had time to finish.
  const [leavingView, setLeavingView] = useState<ActiveView | null>(null);
  const lastView = useRef<ActiveView>(activeView);

  useEffect(() => {
    if (lastView.current === activeView) return;
    const outgoing = lastView.current;
    lastView.current = activeView;
    setLeavingView(outgoing);
    const timer = window.setTimeout(() => setLeavingView(null), 240);
    return () => window.clearTimeout(timer);
  }, [activeView]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-dark-muted">Loading project…</p>
        </div>
      </div>
    );
  }

  const handleIssueClick = (issue: typeof selectedIssue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const handleSearchSelectIssue = (issue: typeof selectedIssue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const renderView = (view: ActiveView) => {
    switch (view) {
      case 'board':
        return (
          <BoardView
            project={project}
            dragOverColumn={dragOverColumn}
            setDragOverColumn={setDragOverColumn}
            onIssueClick={handleIssueClick}
          />
        );
      case 'backlog':
        return <BacklogView project={project} onIssueClick={handleIssueClick} />;
      case 'sprints':
        return <SprintsView project={project} onIssueClick={handleIssueClick} />;
      case 'reports':
        return <ReportsView project={project} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-dark-bg dark:text-dark-text font-sans">
        <Toolbar project={project} onSearch={openSearch} />

        <main className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <ViewTransition view={activeView} leaving={leavingView ? renderView(leavingView) : null}>
            {renderView(activeView)}
          </ViewTransition>
        </main>

        {showIssueModal && (
          <IssueModal
            project={project}
            issue={selectedIssue}
            onClose={() => {
              setShowIssueModal(false);
              setSelectedIssue(null);
            }}
          />
        )}

        {showEpicModal && <EpicModal project={project} onClose={() => setShowEpicModal(false)} />}

        {showSprintModal && (
          <SprintModal project={project} onClose={() => setShowSprintModal(false)} />
        )}

        {showSettingsModal && (
          <SettingsModal project={project} onClose={() => setShowSettingsModal(false)} />
        )}

        {showConfirmDialog && (
          <ConfirmDialog
            title={showConfirmDialog.title}
            message={showConfirmDialog.message}
            onConfirm={() => {
              showConfirmDialog.onConfirm();
              setShowConfirmDialog(null);
            }}
            onCancel={() => setShowConfirmDialog(null)}
          />
        )}

        {showSearchModal && (
          <SearchModal onSelectIssue={handleSearchSelectIssue} onClose={() => closeSearch()} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
