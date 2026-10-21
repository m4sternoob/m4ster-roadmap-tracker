import type { Epic, Issue, IssueType, Priority, Project, Sprint, Status } from '@/types';

/**
 * Sample dataset so a fresh workspace looks like a living project
 * instead of an empty board. Neutral, generic product-team content:
 * a new visitor must never see the owner's real boards here.
 */

interface SeedIssue {
  n: number;
  title: string;
  description: string;
  type: IssueType;
  status: Status;
  priority: Priority;
  storyPoints: number;
  assignee?: string;
  labels: string[];
  epic?: number;
  sprint?: boolean;
  dueInDays?: number;
  comments?: { author: string; text: string; daysAgo: number }[];
}

const SEED_ISSUES: SeedIssue[] = [
  {
    n: 1,
    title: 'Fix session timeout on the checkout page',
    description:
      'Users get logged out mid-checkout when the payment step takes more than a few minutes. Extend the session window during checkout and warn before it expires.',
    type: 'bug',
    status: 'done',
    priority: 'critical',
    storyPoints: 5,
    assignee: 'Alex Chen',
    labels: ['web', 'payments'],
    epic: 0,
    sprint: true,
    comments: [
      { author: 'Alex Chen', text: 'Reproduced — session dies exactly 15 minutes after login.', daysAgo: 4 },
      { author: 'Sarah Kim', text: 'Fix verified on staging, no drop-offs in the last run.', daysAgo: 3 },
    ],
  },
  {
    n: 2,
    title: 'Set up CI pipeline for staging deploys',
    description:
      'Every merge to main should build, run the test suite, and deploy to staging automatically. Fail the pipeline on any red test.',
    type: 'task',
    status: 'done',
    priority: 'high',
    storyPoints: 8,
    assignee: 'Sarah Kim',
    labels: ['devops', 'automation'],
    epic: 0,
    sprint: true,
  },
  {
    n: 3,
    title: 'Add CSV export to reports',
    description:
      'Let users download any report as CSV: same filters, same columns, one click from the Reports view.',
    type: 'story',
    status: 'review',
    priority: 'high',
    storyPoints: 5,
    assignee: 'Mike Ross',
    labels: ['reports', 'export'],
    sprint: true,
    dueInDays: 1,
    comments: [{ author: 'Mike Ross', text: 'Export matches the on-screen table exactly. Ready for review.', daysAgo: 0 }],
  },
  {
    n: 4,
    title: 'Onboarding email sequence (3 emails)',
    description:
      'Welcome, first-project tips, and a check-in on day 3. Friendly tone, one clear action per email, plain-text friendly.',
    type: 'story',
    status: 'in-progress',
    priority: 'medium',
    storyPoints: 5,
    assignee: 'Anna Lee',
    labels: ['growth', 'email'],
    epic: 1,
    sprint: true,
    dueInDays: 3,
  },
  {
    n: 5,
    title: 'Dashboard loads slowly with large projects',
    description:
      'Above roughly 500 cards the dashboard takes 4s+ to render. Profile first, then paginate or virtualize the heavy lists.',
    type: 'task',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    assignee: 'Alex Chen',
    labels: ['performance', 'web'],
    epic: 0,
    sprint: true,
  },
  {
    n: 6,
    title: 'Write API docs for the public endpoints',
    description:
      'Document auth, rate limits, and every public endpoint with copy-paste examples. Keep it in sync with the changelog.',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    assignee: 'Sarah Kim',
    labels: ['docs', 'api'],
    epic: 0,
    dueInDays: 7,
  },
  {
    n: 7,
    title: 'Accessibility pass on forms and dialogs',
    description:
      'Keyboard order, focus states, and screen-reader labels on every form and modal. Target WCAG AA across the app.',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: 5,
    labels: ['a11y', 'ui'],
    epic: 1,
  },
  {
    n: 8,
    title: 'Referral program — design and rewards',
    description:
      'Draft the referral flow: invite link, reward for both sides, fraud checks. Design first, build after launch feedback.',
    type: 'story',
    status: 'backlog',
    priority: 'low',
    storyPoints: 8,
    assignee: 'Anna Lee',
    labels: ['growth'],
    epic: 1,
  },
  {
    n: 9,
    title: 'Landing page hero redesign',
    description:
      'New hero with a live product shot, one-line pitch, and a single call to action. A/B test against the current page for two weeks.',
    type: 'story',
    status: 'review',
    priority: 'high',
    storyPoints: 5,
    assignee: 'Mike Ross',
    labels: ['marketing', 'design'],
    epic: 0,
    dueInDays: 2,
  },
  {
    n: 10,
    title: 'Weekly competitor and market review',
    description:
      'Track pricing changes, new features, and reviews from the top three competitors. One-page summary every Monday.',
    type: 'task',
    status: 'backlog',
    priority: 'low',
    storyPoints: 1,
    labels: ['research'],
  },
  {
    n: 11,
    title: 'Mobile app beta (TestFlight + Play beta)',
    description:
      'Package the app for beta testers: crash reporting on, feedback link in settings, 50-seat first cohort.',
    type: 'story',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 8,
    labels: ['mobile', 'beta'],
    epic: 0,
  },
  {
    n: 12,
    title: 'Crash when rotating during video playback',
    description:
      'Rotating the device mid-playback drops the player state. Repro: start a video, rotate twice quickly. Save and restore playback position.',
    type: 'bug',
    status: 'review',
    priority: 'critical',
    storyPoints: 5,
    assignee: 'Alex Chen',
    labels: ['mobile', 'video'],
    sprint: true,
    dueInDays: 1,
  },
];

export function createSampleProject(): Project {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const iso = (daysAgo: number) => new Date(now - daysAgo * day).toISOString();

  const epics: Epic[] = [
    {
      id: 'epic-launch',
      key: 'MT-E1',
      name: 'Product Launch',
      description: 'Everything needed to ship v1.0 to the public.',
      color: '#8b5cf6',
      issues: [],
      createdAt: iso(14),
      updatedAt: iso(2),
    },
    {
      id: 'epic-onboarding',
      key: 'MT-E2',
      name: 'Customer Onboarding',
      description: 'Make the first-run experience effortless for new users.',
      color: '#0ea5e9',
      issues: [],
      createdAt: iso(10),
      updatedAt: iso(1),
    },
  ];

  const sprint: Sprint = {
    id: 'sprint-1',
    name: 'Sprint 1',
    goal: 'Ship the public beta',
    startDate: iso(7),
    endDate: new Date(now + 7 * day).toISOString(),
    status: 'active',
    issues: [],
    createdAt: iso(7),
    updatedAt: iso(0),
  };

  const issues: Issue[] = SEED_ISSUES.map((s) => {
    const epicId = s.epic !== undefined ? epics[s.epic].id : undefined;
    const issue: Issue = {
      id: `seed-issue-${s.n}`,
      key: `MT-${s.n}`,
      title: s.title,
      description: s.description,
      type: s.type,
      status: s.status,
      priority: s.priority,
      storyPoints: s.storyPoints,
      assignee: s.assignee,
      labels: s.labels,
      epicId,
      sprintId: s.sprint ? sprint.id : undefined,
      comments: (s.comments ?? []).map((c, i) => ({
        id: `seed-comment-${s.n}-${i}`,
        author: c.author,
        text: c.text,
        createdAt: iso(c.daysAgo),
      })),
      attachments: [],
      createdAt: iso(6 + s.n),
      updatedAt: iso(Math.max(0, 2 - (s.n % 3))),
      dueDate:
        s.dueInDays !== undefined ? new Date(now + s.dueInDays * day).toISOString() : undefined,
      completedAt: s.status === 'done' ? iso(3) : undefined,
      blockedBy: [],
      timeEntries: [],
      archived: false,
    };
    if (epicId) epics.find((e) => e.id === epicId)!.issues.push(issue.id);
    if (s.sprint) sprint.issues.push(issue.id);
    return issue;
  });

  return {
    id: 'sample-project',
    key: 'MT',
    name: 'M4ster Tracker',
    description: 'Sample workspace — explore the board, then make it your own.',
    issues,
    epics,
    sprints: [sprint],
    currentSprintId: sprint.id,
    nextIssueNumber: SEED_ISSUES.length + 1,
    createdAt: iso(14),
    updatedAt: new Date().toISOString(),
  };
}
