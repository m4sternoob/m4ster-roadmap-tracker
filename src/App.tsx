import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { TopBar } from '@/components/layout/TopBar';
import { SideNav } from '@/components/layout/SideNav';
import { ProjectHeader } from '@/components/layout/ProjectHeader';
import { BoardView } from '@/components/views/BoardView';
import { ListView } from '@/components/views/ListView';
import { BacklogView } from '@/components/views/BacklogView';
import { SprintsView } from '@/components/views/SprintsView';
import { ReportsView } from '@/components/views/ReportsView';
import { IssueModal } from '@/components/modals/IssueModal';
import { EpicModal } from '@/components/modals/EpicModal';
import { SprintModal } from '@/components/modals/SprintModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchModal } from '@/components/ui/SearchModal/SearchModal';
import { useSearch, useKeyboardShortcuts } from '@/hooks/useSearch';
import type { Issue } from '@/types';

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
  } = useProjectStore();

  const { close: closeSearch, isOpen: showSearchModal } = useSearch();
  useKeyboardShortcuts();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1d2125]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#0c66e4] border-t-transparent animate-spin" />
          <p className="text-sm text-[#8c9bab]">Loading project…</p>
        </div>
      </div>
    );
  }

  const handleIssueClick = (issue: Issue | null) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const handleSearchSelectIssue = (issue: Issue | null) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col bg-[#1d2125] text-[#e6edf3] font-sans overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />

        <div className="flex flex-1 min-h-0">
          <SideNav project={project} collapsed={sidebarCollapsed} />

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <ProjectHeader project={project} />

            <main className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              {activeView === 'board' && (
                <BoardView project={project} onIssueClick={handleIssueClick} />
              )}
              {activeView === 'list' && (
                <ListView project={project} onIssueClick={handleIssueClick} />
              )}
              {activeView === 'backlog' && (
                <BacklogView project={project} onIssueClick={handleIssueClick} />
              )}
              {activeView === 'sprints' && (
                <SprintsView project={project} onIssueClick={handleIssueClick} />
              )}
              {activeView === 'reports' && <ReportsView project={project} />}
            </main>
          </div>
        </div>

        {showIssueModal && (
          <IssueModal
            project={project}
            issue={selectedIssue}
            onClose={() => {
              setShowIssueModal(false);
              setSelectedIssue(null);
              useProjectStore.getState().setNewIssuePreset(null);
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
