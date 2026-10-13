import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/sync/auth';
import { TopBar } from '@/components/layout/TopBar';
import { SideNav } from '@/components/layout/SideNav';
import { ProjectHeader } from '@/components/layout/ProjectHeader';
import { BoardView } from '@/components/views/BoardView';
import { ListView } from '@/components/views/ListView';
import { BacklogView } from '@/components/views/BacklogView';
import { SprintsView } from '@/components/views/SprintsView';
import { ReportsView } from '@/components/views/ReportsView';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { WorkloadView } from '@/components/views/WorkloadView';
import { IssueModal } from '@/components/modals/IssueModal';
import { EpicModal } from '@/components/modals/EpicModal';
import { SprintModal } from '@/components/modals/SprintModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchModal } from '@/components/ui/SearchModal/SearchModal';
import { Toasts } from '@/components/ui/Toasts';
import { AppSkeleton } from '@/components/ui/Skeletons';
import { LiveBackground } from '@/components/ui/LiveBackground';
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
    showShortcutsModal,
    setShowShortcutsModal,
    showConfirmDialog,
    setShowConfirmDialog,
  } = useProjectStore();

  const { close: closeSearch, isOpen: showSearchModal } = useSearch();
  useKeyboardShortcuts();
  // Start collapsed on small screens so the board gets the room.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.5px)');
    const onChange = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    initializeProject();
    // Surface Google OAuth outcomes (?auth=...) as a toast, then clean the URL.
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (authResult) {
      const messages: Record<string, string> = {
        cancelled: 'Google sign-in was cancelled.',
        error: 'Google sign-in failed — please try again.',
        'not-configured': 'Google sign-in is not set up on this deployment yet.',
      };
      useProjectStore
        .getState()
        .pushToast(
          authResult === 'cancelled' ? 'info' : 'error',
          messages[authResult] ?? 'Google sign-in failed — please try again.'
        );
      params.delete('auth');
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState(null, '', clean);
    }
  }, [initializeProject]);

  // Poll for changes from other devices every 30s.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = useProjectStore.getState();
      if (document.hidden || s.syncStatus === 'saving' || s.syncStatus === 'loading') return;
      s.syncPull();
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  // Tell the boot guard in index.html the app mounted successfully.
  useEffect(() => {
    (window as unknown as { __APP_MOUNTED?: boolean }).__APP_MOUNTED = true;
  }, []);

  if (!project) {
    return <AppSkeleton />;
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
      <AuthProvider>
        <div className="relative h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] font-sans overflow-hidden">
          <LiveBackground />
          <div className="relative z-10 flex flex-col h-full min-h-0">
            {/* Skip link: first tab stop, visible only on keyboard focus. */}
            <a href="#board-content" className="skip-link">
              Skip to board content
            </a>
            <TopBar onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />

            <div className="flex flex-1 min-h-0">
              <SideNav project={project} collapsed={sidebarCollapsed} />

              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <ProjectHeader project={project} />

                <main
                  id="board-content"
                  tabIndex={-1}
                  className="flex-1 min-h-0 overflow-y-auto px-5 py-4 bg-transparent"
                >
                  <div key={activeView} className="animate-view-enter h-full">
                    {activeView === 'board' && (
                      <BoardView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'list' && (
                      <ListView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'backlog' && (
                      <BacklogView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'calendar' && (
                      <CalendarView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'timeline' && (
                      <TimelineView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'workload' && (
                      <WorkloadView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'sprints' && (
                      <SprintsView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'reports' && <ReportsView project={project} />}
                  </div>
                </main>
              </div>
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

          {showShortcutsModal && <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />}

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

          <Toasts />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
