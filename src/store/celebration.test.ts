// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/store/projectStore';
import { createSampleProject } from '@/utils/demoData';

beforeEach(() => {
  useProjectStore.setState({ project: createSampleProject(), celebration: null });
});

function aNonDoneIssue() {
  return useProjectStore.getState().project!.issues.find((i) => i.status !== 'done')!;
}

describe('celebration', () => {
  it('fires when a card is moved to Done via moveIssue', () => {
    const issue = aNonDoneIssue();
    useProjectStore.getState().moveIssue(issue.id, 'done');
    const c = useProjectStore.getState().celebration;
    expect(c).toMatchObject({ issueId: issue.id, title: issue.title });
    expect(c!.nonce).toBeGreaterThan(0);
  });

  it('does not fire for moves to other statuses', () => {
    const issue = aNonDoneIssue();
    useProjectStore.getState().moveIssue(issue.id, 'in-progress');
    expect(useProjectStore.getState().celebration).toBeNull();
  });

  it('does not fire when the card is already Done', () => {
    const done = useProjectStore.getState().project!.issues.find((i) => i.status === 'done');
    if (!done) return; // sample data always has a Done card; skip otherwise
    useProjectStore.getState().moveIssue(done.id, 'done');
    expect(useProjectStore.getState().celebration).toBeNull();
  });

  it('fires on updateIssue status flips to Done', () => {
    const issue = aNonDoneIssue();
    useProjectStore.getState().updateIssue(issue.id, { status: 'done' });
    expect(useProjectStore.getState().celebration).toMatchObject({ issueId: issue.id });
  });

  it('stays quiet for silent updateIssue status flips (automations)', () => {
    const issue = aNonDoneIssue();
    useProjectStore.getState().updateIssue(issue.id, { status: 'done' }, true);
    expect(useProjectStore.getState().celebration).toBeNull();
  });

  it('bumps the nonce on repeat celebrations and clears on demand', () => {
    const first = aNonDoneIssue();
    const second = useProjectStore
      .getState()
      .project!.issues.find((i) => i.status !== 'done' && i.id !== first.id)!;
    useProjectStore.getState().moveIssue(first.id, 'done');
    const nonce1 = useProjectStore.getState().celebration!.nonce;
    useProjectStore.getState().moveIssue(second.id, 'done');
    const c = useProjectStore.getState().celebration!;
    expect(c.nonce).toBeGreaterThan(nonce1);
    expect(c.issueId).toBe(second.id);
    useProjectStore.getState().clearCelebration();
    expect(useProjectStore.getState().celebration).toBeNull();
  });
});
