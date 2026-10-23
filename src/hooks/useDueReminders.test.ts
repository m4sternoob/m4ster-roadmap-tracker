// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStore } from '@/store/projectStore';
import { createSampleProject } from '@/utils/demoData';
import {
  classifyDue,
  collectDueReminders,
  dueBody,
  dayString,
  useDueReminders,
} from '@/hooks/useDueReminders';
import type { Issue } from '@/types';

// Fixed "now" so day-boundary tests are deterministic.
const NOW = new Date('2026-10-21T12:00:00');
const day = (offset: number) => dayString(new Date(NOW.getTime() + offset * 86400000));

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'i1',
    key: 'MT-1',
    title: 'Fix the login bug',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'high',
    storyPoints: 2,
    labels: [],
    comments: [],
    attachments: [],
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    blockedBy: [],
    timeEntries: [],
    archived: false,
    ...overrides,
  };
}

const memStore: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(memStore)) delete memStore[k];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memStore[k] ?? null,
    setItem: (k: string, v: string) => {
      memStore[k] = v;
    },
    removeItem: (k: string) => {
      delete memStore[k];
    },
    clear: () => {
      for (const k of Object.keys(memStore)) delete memStore[k];
    },
  });
  useProjectStore.setState({ notifications: [] });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('classifyDue', () => {
  it('flags a past-due open issue as overdue', () => {
    expect(classifyDue(makeIssue({ dueDate: day(-1) }), NOW)).toBe('overdue');
  });
  it('flags today and tomorrow as due-soon', () => {
    expect(classifyDue(makeIssue({ dueDate: day(0) }), NOW)).toBe('due-soon');
    expect(classifyDue(makeIssue({ dueDate: day(1) }), NOW)).toBe('due-soon');
  });
  it('ignores dates further out', () => {
    expect(classifyDue(makeIssue({ dueDate: day(3) }), NOW)).toBeNull();
  });
  it('ignores done, archived, and dateless issues', () => {
    expect(classifyDue(makeIssue({ dueDate: day(-1), status: 'done' }), NOW)).toBeNull();
    expect(classifyDue(makeIssue({ dueDate: day(-1), archived: true }), NOW)).toBeNull();
    expect(classifyDue(makeIssue(), NOW)).toBeNull();
  });
  it('accepts full ISO datetimes, not just date strings', () => {
    expect(classifyDue(makeIssue({ dueDate: `${day(-2)}T09:30:00.000Z` }), NOW)).toBe('overdue');
  });
});

describe('dueBody', () => {
  it('describes overdue, today, and tomorrow naturally', () => {
    expect(dueBody(makeIssue({ dueDate: day(-1) }), 'overdue', NOW)).toContain('was due');
    expect(dueBody(makeIssue({ dueDate: day(0) }), 'due-soon', NOW)).toContain('is due today');
    expect(dueBody(makeIssue({ dueDate: day(1) }), 'due-soon', NOW)).toContain('is due tomorrow');
  });
  it('quotes the issue title', () => {
    expect(dueBody(makeIssue({ dueDate: day(0) }), 'due-soon', NOW)).toContain('"Fix the login bug"');
  });
});

describe('collectDueReminders', () => {
  it('never reminds twice for the same issue + date + bucket', () => {
    const issues = [makeIssue({ dueDate: day(-1) })];
    const first = collectDueReminders(issues, {}, 'p1', NOW);
    expect(first.reminders).toHaveLength(1);
    const second = collectDueReminders(issues, first.ledger, 'p1', NOW);
    expect(second.reminders).toHaveLength(0);
  });
  it('reminds again when due-soon escalates to overdue', () => {
    const soon = makeIssue({ dueDate: day(1) });
    const first = collectDueReminders([soon], {}, 'p1', NOW);
    expect(first.reminders[0].bucket).toBe('due-soon');
    const later = new Date(NOW.getTime() + 3 * 86400000); // now it's overdue
    const second = collectDueReminders([soon], first.ledger, 'p1', later);
    expect(second.reminders).toHaveLength(1);
    expect(second.reminders[0].bucket).toBe('overdue');
  });
  it('reminds again when the due date itself changes', () => {
    const issue = makeIssue({ dueDate: day(-1) });
    const first = collectDueReminders([issue], {}, 'p1', NOW);
    const moved = { ...issue, dueDate: day(-5) };
    const second = collectDueReminders([moved], first.ledger, 'p1', NOW);
    expect(second.reminders).toHaveLength(1);
  });
  it('skips done and archived issues', () => {
    const issues = [
      makeIssue({ id: 'a', dueDate: day(-1), status: 'done' }),
      makeIssue({ id: 'b', dueDate: day(-1), archived: true }),
    ];
    expect(collectDueReminders(issues, {}, 'p1', NOW).reminders).toHaveLength(0);
  });
});

describe('useDueReminders', () => {
  it('posts a due notification for an overdue issue and never repeats it', () => {
    const project = createSampleProject();
    project.issues = [makeIssue({ id: 'x1', key: 'MT-9', dueDate: day(-2) })];
    useProjectStore.setState({ project });

    const { rerender } = renderHook(() => useDueReminders());
    const first = useProjectStore.getState().notifications;
    expect(first).toHaveLength(1);
    expect(first[0].type).toBe('due');
    expect(first[0].title).toBe('Overdue: MT-9');
    expect(first[0].issueKey).toBe('MT-9');
    expect(first[0].issueId).toBe('x1');

    // Simulate an unrelated project edit (new object identity) — no repeat.
    useProjectStore.setState({ project: { ...project, updatedAt: new Date().toISOString() } });
    rerender();
    expect(useProjectStore.getState().notifications).toHaveLength(1);
  });

  it('collapses a large overdue backlog into individual + summary notifications', () => {
    const project = createSampleProject();
    project.issues = Array.from({ length: 8 }, (_, n) =>
      makeIssue({ id: `x${n}`, key: `MT-${n}`, dueDate: day(-1) })
    );
    useProjectStore.setState({ project });

    renderHook(() => useDueReminders());
    const notes = useProjectStore.getState().notifications;
    expect(notes).toHaveLength(6); // 5 individual + 1 summary
    expect(notes[0].title).toContain('3 more');
    expect(notes[0].issueId).toBeUndefined();
  });

  it('stays quiet when nothing is due', () => {
    const project = createSampleProject();
    project.issues = [makeIssue({ dueDate: day(10) })];
    useProjectStore.setState({ project });

    renderHook(() => useDueReminders());
    expect(useProjectStore.getState().notifications).toHaveLength(0);
  });
});
