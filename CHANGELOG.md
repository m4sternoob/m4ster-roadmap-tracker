# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased — test build]

### Test-build branding
- Preview/test deployments (VITE_TEST_BUILD=true in the Vercel Preview
  environment) now carry TEST branding: "— Test" in the tab title and a
  TEST pill beside the space name. Production keeps the clean name.

### Demo data + first-run tutorial
- Demo seed is now neutral sample content (fictional product team) — a
  fresh visitor no longer lands on the owner's personal board.
- Welcome modal upgraded to a 5-step quick tour: welcome, dragging cards,
  views, inviting the team, day/night + customize. Step dots, Back/Skip,
  shown once per browser.

### Fixed — appearance controls
- Font picker: Pro fonts were hardcoded-locked on every build (production
  included). Locks now follow the plan only where enforcement is on;
  production has every font open, and a locked font opens the upgrade modal.
- Cursor style + font are reactive and persist across reloads (they were
  applied imperatively and lost on refresh).
- Default theme is now Porcelain (friendly light) instead of Violet dark.
- New one-click Sun/Moon day-night toggle in the top bar; the choice is
  saved, and deep customization stays in the Customize panel.

### Added — workspace views pass
- Summary, For you, Docs, Development views and an Assets register.
- List view rebuilt as an issue table (Reporter + Resolution + Created +
  Updated columns, row selection with an "N of M" footer, inline status
  dropdown, inline Create row).
- Board cards rearranged to the reference layout (due line with overdue
  warning, key in the footer row).
- Plan picker modal with Free / Pro / Team cards (flat yearly price).
- Sidebar: current space expands into its views, Operations opens
  Development, Apps opens a launcher popover — no dead buttons.
- Non-board views code-split; initial JS bundle down ~13%.

### Added

- **Multiplayer boards**: share a board with an invite link; signed-in members who join sync against one shared board record
- **Live presence**: who's online, which view they're on, which card they're editing, Figma-style live cursors, and an activity feed
- **Team chat**: #general / #board / #random channels in the team panel (People / Chat / Activity)
- **Reports download**: Download Report button generating a standalone HTML board report, alongside CSV and JSON exports

## [1.0.0] - 2024-09-27

### Added

- **Kanban Board**: 5-column board (Backlog, To Do, In Progress, Review, Done) with drag-and-drop via @dnd-kit
- **Issue Management**: Full CRUD for issues with types (Epic, Story, Task, Subtask, Bug), priorities (Low, Medium, High, Critical), story points, assignees, labels, due dates
- **Epic System**: Color-coded epics with issue grouping and progress tracking
- **Sprint Management**: Complete sprint lifecycle (Planning → Active → Complete) with goals, dates, and issue assignment
- **Burndown Charts**: SVG-based sprint burndown charts showing ideal vs actual progress with health indicators
- **Views**: Board, Backlog (grid), Sprints (list), Reports (burndown)
- **Theme System**: Dark/light mode with system preference detection and localStorage persistence
- **Data Persistence**: localStorage with Zustand persist middleware, auto-save on every mutation
- **Export/Import**: JSON backup/restore of entire project (issues, epics, sprints)
- **Toolbar**: View switching, theme toggle, quick actions (new issue/epic/sprint), import/export
- **Accessibility**: ARIA labels, keyboard navigation, focus management, semantic HTML
- **TypeScript**: Strict mode with path aliases (@/, @components/, @store/, @types/, @utils/)
- **Testing**: Vitest + Testing Library + JSDOM setup with unit tests for helpers
- **CI/CD**: GitHub Actions workflow (lint → typecheck → test → build → Docker → deploy)
- **Docker**: Multi-stage build with nginx, health checks, security headers
- **Code Quality**: Oxlint + ESLint + Prettier + TypeScript strict

### Technical

- React 19 + Vite 8 + Tailwind CSS v4
- Zustand for state management
- date-fns for date utilities
- Lucide React for icons
- React Hook Form for form validation
- React Hot Toast for notifications

## [Unreleased]

### Planned for v1.1

- Global search (Cmd+K)
- Column filters
- Keyboard shortcuts
- PWA support (manifest, service worker)
- Accessibility audit (WCAG AA)
- Virtualized columns
- Column collapse/expand

---

## Legend

| Emoji | Meaning        |
| ----- | -------------- |
| ✨    | New feature    |
| 🐛    | Bug fix        |
| 📝    | Documentation  |
| ♻️    | Refactor       |
| ⚡    | Performance    |
| 🧪    | Tests          |
| 🔧    | Tooling/Config |
| 🔒    | Security       |
| 🐳    | Docker         |
| ♿    | Accessibility  |
