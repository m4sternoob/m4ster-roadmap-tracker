import { Suspense, lazy, useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { usePlanStore } from '@/store/planStore';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/sync/auth';
import { TopBar } from '@/components/layout/TopBar';
import { SideNav } from '@/components/layout/SideNav';
import { ProjectHeader } from '@/components/layout/ProjectHeader';
import { BoardView } from '@/components/views/BoardView';
// Non-board views are code-split: the board is the landing view, everything
// else loads on first open (keeps the initial bundle lean).
const ListView = lazy(() => import('@/components/views/ListView').then((m) => ({ default: m.ListView })));
const BacklogView = lazy(() => import('@/components/views/BacklogView').then((m) => ({ default: m.BacklogView })));
const SprintsView = lazy(() => import('@/components/views/SprintsView').then((m) => ({ default: m.SprintsView })));
const ReportsView = lazy(() => import('@/components/views/ReportsView').then((m) => ({ default: m.ReportsView })));
const CalendarView = lazy(() => import('@/components/views/CalendarView').then((m) => ({ default: m.CalendarView })));
const TimelineView = lazy(() => import('@/components/views/TimelineView').then((m) => ({ default: m.TimelineView })));
const WorkloadView = lazy(() => import('@/components/views/WorkloadView').then((m) => ({ default: m.WorkloadView })));
const ArchivedView = lazy(() => import('@/components/views/ArchivedView').then((m) => ({ default: m.ArchivedView })));
const SummaryView = lazy(() => import('@/components/views/SummaryView').then((m) => ({ default: m.SummaryView })));
const ForYouView = lazy(() => import('@/components/views/ForYouView').then((m) => ({ default: m.ForYouView })));
const DocsView = lazy(() => import('@/components/views/DocsView').then((m) => ({ default: m.DocsView })));
const DevelopmentView = lazy(() => import('@/components/views/DevelopmentView').then((m) => ({ default: m.DevelopmentView })));
const AssetsView = lazy(() => import('@/components/views/AssetsView').then((m) => ({ default: m.AssetsView })));

function ViewFallback() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading view">
      <div className="h-8 w-56 rounded-lg bg-[var(--bg-raised)]" />
      <div className="h-40 rounded-xl bg-[var(--bg-raised)]/70" />
      <div className="h-40 rounded-xl bg-[var(--bg-raised)]/50" />
    </div>
  );
}
import { IssueModal } from '@/components/modals/IssueModal';
import { EpicModal } from '@/components/modals/EpicModal';
import { SprintModal } from '@/components/modals/SprintModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { AutomationsModal } from '@/components/modals/AutomationsModal';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchModal } from '@/components/ui/SearchModal/SearchModal';
import { Toasts } from '@/components/ui/Toasts';
import { Celebration } from '@/components/ui/Celebration';
import { AppSkeleton } from '@/components/ui/Skeletons';
import { LiveBackground } from '@/components/ui/LiveBackground';
import { CursorOrb } from '@/components/ui/CursorOrb';
import { useSearch, useKeyboardShortcuts } from '@/hooks/useSearch';
import { useDueReminders } from '@/hooks/useDueReminders';
import { CollabRoot } from '@/collab/CollabUI';
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
    showAutomationsModal,
    setShowAutomationsModal,
    showConfirmDialog,
    setShowConfirmDialog,
  } = useProjectStore();

  const { close: closeSearch, isOpen: showSearchModal } = useSearch();
  useKeyboardShortcuts();
  useDueReminders();
  const demoSeeded = useProjectStore((s) => s.demoSeeded);

  // First-run greeting: show once when a fresh visitor lands on demo data.
  // Keys off the store's write-once mt_fresh_seed_v1 marker (demoSeeded
  // itself races with the multiple initializeProject calls).
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (!project) return;
    try {
      if (localStorage.getItem('mt_welcomed_v1')) return;
      if (!demoSeeded && !localStorage.getItem('mt_fresh_seed_v1')) return;
    } catch {
      if (!demoSeeded) return;
    }
    setShowWelcome(true);
  }, [project, demoSeeded]);

  const dismissWelcome = () => {
    try {
      localStorage.setItem('mt_welcomed_v1', '1');
      localStorage.removeItem('mt_fresh_seed_v1');
    } catch {
      // Non-fatal.
    }
    setShowWelcome(false);
  };
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
          <CursorOrb />
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
                  // The board manages its own column scrolling so the column
                  // headers stay pinned; every other view scrolls the page.
                  className={`flex-1 min-h-0 px-5 py-4 bg-transparent ${
                    activeView === 'board' ? 'overflow-hidden' : 'overflow-y-auto'
                  }`}
                >
                  <div key={activeView} className="animate-view-enter h-full">
                    <Suspense fallback={<ViewFallback />}>
                    {activeView === 'board' && (
                      <BoardView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'summary' && (
                      <SummaryView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'foryou' && (
                      <ForYouView project={project} onIssueClick={handleIssueClick} />
                    )}
                    {activeView === 'docs' && <DocsView project={project} />}
                    {activeView === 'assets' && <AssetsView project={project} />}
                    {activeView === 'development' && (
                      <DevelopmentView project={project} onIssueClick={handleIssueClick} />
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
                    {activeView === 'archived' && (
                      <ArchivedView project={project} onIssueClick={handleIssueClick} />
                    )}
                    </Suspense>
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

          {showAutomationsModal && (
            <AutomationsModal onClose={() => setShowAutomationsModal(false)} />
          )}

          <PlanUpgradeMount />

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

          {showWelcome && <WelcomeModal onClose={dismissWelcome} />}

          <CollabRoot />
          <Toasts />
          <Celebration />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

/** Renders the Pro upgrade modal whenever a locked feature is hit. */
function PlanUpgradeMount() {
  const upgradeOpen = usePlanStore((s) => s.upgradeOpen);
  if (!upgradeOpen) return null;
  return <UpgradeModal />;
}
