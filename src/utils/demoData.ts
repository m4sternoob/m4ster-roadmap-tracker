import type { Epic, Issue, IssueType, Priority, Project, Sprint, Status } from '@/types';

/**
 * Sample dataset so a fresh workspace looks like a living project
 * instead of an empty board. Game-dev flavored, matching the owner's world.
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
    title: 'Fix 40GB memory leak in digit filter',
    description:
      'The guessing game text fields re-fire on every redraw and rewrite themselves in an infinite loop. Switch to onChange handlers that only rewrite when the filtered text actually changes.',
    type: 'bug',
    status: 'done',
    priority: 'critical',
    storyPoints: 5,
    assignee: 'Master Noob',
    labels: ['macos', 'swift'],
    epic: 0,
    sprint: true,
    comments: [
      {
        author: 'Master Noob',
        text: 'Reproduced on launch — Activity Monitor showed 40GB. Wild.',
        daysAgo: 4,
      },
      {
        author: 'Master Noob',
        text: 'Fixed with onChange guards. Memory stays flat now.',
        daysAgo: 3,
      },
    ],
  },
  {
    n: 2,
    title: 'Port hint engine to macOS',
    description:
      'Mirror the Android HintEngine in Swift: fun-fact riddles, digit-shape wordplay, math riddles, range hints. Never name the number outright.',
    type: 'story',
    status: 'done',
    priority: 'high',
    storyPoints: 8,
    assignee: 'Master Noob',
    labels: ['macos', 'swift'],
    epic: 0,
    sprint: true,
  },
  {
    n: 3,
    title: 'Ship Android v1.4.0 APKs',
    description:
      'Memory Match, TTT misere mode, S&L extra roll on 6. Verify both flavors in CI, forensic-check the APKs, publish the release.',
    type: 'task',
    status: 'review',
    priority: 'high',
    storyPoints: 3,
    assignee: 'Master Noob',
    labels: ['android', 'release'],
    epic: 0,
    sprint: true,
    comments: [
      {
        author: 'Master Noob',
        text: 'Both APKs verified — hints compiled in/out correctly.',
        daysAgo: 1,
      },
    ],
  },
  {
    n: 4,
    title: 'Add on-screen D-pad to Snake',
    description:
      'Up/Down/Left/Right buttons for touch players. Keep swipe working, share the no-180° steering logic between both inputs.',
    type: 'story',
    status: 'in-progress',
    priority: 'medium',
    storyPoints: 5,
    assignee: 'Master Noob',
    labels: ['android', 'ux'],
    epic: 1,
    sprint: true,
    dueInDays: 3,
  },
  {
    n: 5,
    title: 'Ludo quick-play mode',
    description:
      'Shorter matches: fewer tokens to home, faster CPU turns. For players who want a 5-minute game.',
    type: 'story',
    status: 'in-progress',
    priority: 'medium',
    storyPoints: 8,
    labels: ['android'],
    epic: 1,
    sprint: true,
  },
  {
    n: 6,
    title: 'Board columns overflow on small screens',
    description:
      'Horizontal scroll works but the last column gets clipped behind the sidebar on 1280px widths. Check the flex min-widths.',
    type: 'bug',
    status: 'todo',
    priority: 'high',
    storyPoints: 2,
    assignee: 'Master Noob',
    labels: ['web', 'css'],
    epic: 1,
    sprint: true,
    dueInDays: 5,
  },
  {
    n: 7,
    title: 'Daily challenge mode',
    description:
      'One shared puzzle per day across all games, streak tracking, shareable result card. Backlog for v1.5.',
    type: 'epic',
    status: 'todo',
    priority: 'low',
    storyPoints: 13,
    labels: ['v1.5'],
    epic: 1,
  },
  {
    n: 8,
    title: 'Write recruiter-ready README for StumbleGuysClone',
    description:
      'Architecture overview, netcode roadmap, build instructions. No Blueprints — C++ gameplay code only.',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    assignee: 'Master Noob',
    labels: ['portfolio', 'unreal'],
    dueInDays: 7,
  },
  {
    n: 9,
    title: 'Polished UI overhaul for roadmap tracker',
    description:
      'Top bar, sidebar, project tabs, board toolbar with filters, issue detail modal, list view. Make it look like the real thing.',
    type: 'story',
    status: 'in-progress',
    priority: 'critical',
    storyPoints: 8,
    assignee: 'Master Noob',
    labels: ['web', 'ui'],
    sprint: true,
    comments: [{ author: 'Master Noob', text: 'Make it look properly polished.', daysAgo: 0 }],
  },
  {
    n: 10,
    title: 'Applicants: junior gameplay roles watch',
    description:
      'Weekly scan of Ontario junior gameplay/engine/tools postings. Silent on empty weeks.',
    type: 'task',
    status: 'backlog',
    priority: 'low',
    storyPoints: 1,
    labels: ['job-hunt'],
  },
  {
    n: 11,
    title: 'Minesweeper for 5IN1',
    description:
      'Classic minesweeper as the 7th game. First-click safety, chord tapping, flag mode.',
    type: 'story',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 8,
    labels: ['android', 'v1.5'],
    epic: 1,
  },
  {
    n: 12,
    title: 'Crash on rotation during Ludo CPU turn',
    description:
      'Rotating the phone mid-CPU-turn drops the game state. Repro: start CPU turn, rotate twice quickly.',
    type: 'bug',
    status: 'review',
    priority: 'critical',
    storyPoints: 5,
    assignee: 'Master Noob',
    labels: ['android', 'ludo'],
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
      id: 'epic-5in1-launch',
      key: 'MT-E1',
      name: '5IN1 Launch',
      description: 'Everything needed to ship the 5-game app on all platforms.',
      color: '#8b5cf6',
      issues: [],
      createdAt: iso(14),
      updatedAt: iso(2),
    },
    {
      id: 'epic-game-feel',
      key: 'MT-E2',
      name: 'Gameplay Feel',
      description: 'Polish, controls and juice across the mini-games.',
      color: '#0ea5e9',
      issues: [],
      createdAt: iso(10),
      updatedAt: iso(1),
    },
  ];

  const sprint: Sprint = {
    id: 'sprint-1',
    name: 'Sprint 1',
    goal: 'Stabilize 5IN1 across Android and macOS',
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
      createdAt: iso(6 + s.n),
      updatedAt: iso(Math.max(0, 2 - (s.n % 3))),
      dueDate:
        s.dueInDays !== undefined ? new Date(now + s.dueInDays * day).toISOString() : undefined,
      completedAt: s.status === 'done' ? iso(3) : undefined,
    };
    if (epicId) epics.find((e) => e.id === epicId)!.issues.push(issue.id);
    if (s.sprint) sprint.issues.push(issue.id);
    return issue;
  });

  return {
    id: 'sample-project',
    key: 'MT',
    name: 'M4ster Roadmap Tracker',
    description: 'Sample workspace — ship games, track everything.',
    issues,
    epics,
    sprints: [sprint],
    currentSprintId: sprint.id,
    nextIssueNumber: SEED_ISSUES.length + 1,
    createdAt: iso(14),
    updatedAt: new Date().toISOString(),
  };
}
