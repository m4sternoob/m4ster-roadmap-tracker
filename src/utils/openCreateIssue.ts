import { useProjectStore } from '@/store/projectStore';
import type { Status } from '@/types';

/** Open the issue modal for a brand-new issue. Shared by empty states and menus. */
export function openCreateIssue(defaultStatus: Status = 'backlog') {
  const store = useProjectStore.getState();
  store.setNewIssueDefaultStatus(defaultStatus);
  store.setNewIssuePreset(null);
  store.setSelectedIssue(null);
  store.setShowIssueModal(true);
}
