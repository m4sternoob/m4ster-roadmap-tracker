successfully downloaded text file (SHA: df561a0e46949e7b3cac82e362de15857cb4e05c)",
        "type": "text"
      },
      {
        "resource": {
          "mimeType": "text/plain; charset=utf-8",
          "text": "# m4ster-tracker

> Professional roadmap tracker for product teams â Kanban, sprints, burndown, dark mode.

![m4ster-tracker banner](https://img.shields.io/badge/m4ster--tracker-v1.0.0-0ea5e9?style=for-the-badge&logo=react&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?logo=zustand&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## ð¯ Overview

**m4ster-tracker** is a production-ready, offline-first roadmap tracker built for product teams and solo developers. It combines a clean Kanban board with sprint planning, burndown analytics, and epic management â all in a fast, accessible, dark-mode-friendly SPA.

No backend required. Data persists in localStorage. Deploy anywhere as static files.

## â¨ Features

| Category             | Features                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Kanban Board**     | Drag-and-drop (@dnd-kit), 5 columns (Backlog â To Do â In Progress â Review â Done), priority sorting, virtualized columns           |
| **Issue Management** | Create/edit/delete, types (Epic/Story/Task/Subtask/Bug), priorities, story points, assignees, labels, due dates, epic/sprint linking |
| **Epics**            | Color-coded, issue grouping, progress tracking                                                                                       |
| **Sprints**          | Planning â Active â Complete lifecycle, sprint goals, burndown charts, issue assignment                                              |
| **Reports**          | SVG burndown charts (ideal vs actual), velocity tracking, sprint health indicators                                                   |
| **UX**               | Dark/light theme (system + manual), keyboard navigation, ARIA labels, focus management, responsive grid                              |
| **Data**             | localStorage persistence, export/import JSON backups, zero-config                                                                    |
| **DevEx**            | TypeScript strict, ESLint + Oxlint, Prettier, Vitest, CI/CD, Docker                                                                  |

## ð¸ Screenshots

| Board View                           | Backlog                                  | Sprint Burndown                            |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------ |
| ![board](docs/screenshots/board.png) | ![backlog](docs/screenshots/backlog.png) | ![burndown](docs/screenshots/burndown.png) |

_Add screenshots to `docs/screenshots/` after first deploy_

## ð Quick Start

### Prerequisites

- Node.js 20+
- npm / pnpm / yarn

### Local Development

```bash
# Clone
git clone https://github.com/m4sternoob/m4ster-roadmap-tracker.git
cd m4ster-roadmap-tracker

# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build â ./dist
npm run preview      # Preview production build locally
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # Oxlint + ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
npm run format:check # Check formatting
npm run typecheck    # TypeScript validation
```

## ð³ Docker

```bash
# Build image
docker build -t m4ster-tracker .

# Run container (port 80)
docker run -d -p 80:80 --name m4ster-tracker m4ster-tracker

# Or with docker-compose
docker-compose up -d
```

**docker-compose.yml** (for production):

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '80:80'
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '-q', '--spider', 'http://localhost/']
      interval: 30s
      timeout: 3s
      retries: 3
```

## âï¸ Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Auto-detects Vite â deploys on every push
4. Custom domain in Settings â Domains

### Netlify

```bash
npm run build
# Drag ./dist to Netlify Drop or connect repo
```

### Static Hosting (Anywhere)

```bash
npm run build
# Upload ./dist to: GitHub Pages, Cloudflare Pages, AWS S3, Firebase, Surge, etc.
```

### Docker Hub / Container Registry

```bash
docker tag m4ster-tracker m4sternoob/m4ster-roadmap-tracker:latest
docker push m4sternoob/m4ster-roadmap-tracker:latest
```

## ðï¸ Architecture

```
src/
âââ components/
â   âââ modals/          # IssueModal, EpicModal, SprintModal, SettingsModal
â   âââ providers/       # ThemeProvider
â   âââ ui/              # Column, IssueCard, Toolbar, SectionHeader, ConfirmDialog
â   âââ views/           # BoardView, BacklogView, SprintsView, ReportsView
âââ store/
â   âââ projectStore.ts  # Zustand store with persistence middleware
âââ types/
â   âââ index.ts         # All TypeScript interfaces & constants
âââ utils/
â   âââ constants.ts     # Color maps, status styles
â   âââ helpers.ts       # generateIssueKey, formatDate, isOverdue, etc.
âââ styles/
â   âââ index.css        # Tailwind v4 + custom utilities
âââ test/
â   âââ setup.ts         # Vitest globals, mocks
âââ main.tsx             # Entry point
```

### State Management

- **Zustand** with `persist` middleware â localStorage
- Single source of truth for Project, Issues, Epics, Sprints, UI state
- Optimistic updates, auto-save on every mutation

### Data Model

```typescript
Project {
  id, key, name, description
  issues: Issue[]
  epics: Epic[]
  sprints: Sprint[]
  nextIssueNumber
}

Issue {
  id, key, title, description
  type: 'epic'|'story'|'task'|'subtask'|'bug'
  status: 'backlog'|'todo'|'in-progress'|'review'|'done'
  priority: 'low'|'medium'|'high'|'critical'
  storyPoints, assignee, labels[], epicId, parentId, sprintId
  dueDate, createdAt, updatedAt, completedAt
}

Epic { id, key, name, description, color, issues[], createdAt }
Sprint { id, name, goal, startDate, endDate, status, issues[] }
```

## ð§ª Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report (HTML in ./coverage)
npm run test:coverage
```

**Test Structure:**

- `src/utils/helpers.test.ts` â Pure function tests (generate keys, formatting, overdue detection)
- Add component tests in `src/components/**/*.test.tsx`
- Add integration tests in `src/test/integration/`

## ð§ Configuration

### Tailwind v4

`tailwind.config.js` â Custom colors, fonts, animations, dark mode

### TypeScript

`tsconfig.json` â Strict mode, path aliases (`@/`, `@components/`, etc.)

### Vite

`vite.config.ts` â Aliases, chunk splitting, dev server config

### CI/CD

`.github/workflows/ci.yml` â Lint â Test â Build â Docker â Deploy

## ðºï¸ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed phases.

| Phase    | Focus                                                | Status     |
| -------- | ---------------------------------------------------- | ---------- |
| **v1.0** | Core Kanban, sprints, burndown, themes, persistence  | â Done    |
| **v1.1** | Search/filter, keyboard shortcuts, PWA, a11y audit   | ð Next    |
| **v1.2** | Backend API, auth, realtime, comments, teams         | â³ Planned |
| **v1.3** | GitHub/GitLab sync, webhooks, Slack/Discord, imports | â³ Planned |
| **v2.0** | Time tracking, AI assist, custom fields, automation  | â³ Planned |

## ð¤ Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Oxlint (run `npm run lint:fix`)
- Prettier (run `npm run format`)
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)

## ð License

MIT License â see [LICENSE](LICENSE) for details.

## ð Acknowledgments

- [@dnd-kit](https://dndkit.com/) â Accessible drag-and-drop
- [Zustand](https://zustand-demo.pmnd.rs/) â Simple state management
- [Tailwind CSS](https://tailwindcss.com/) â Utility-first styling
- [Lucide](https://lucide.dev/) â Beautiful icons
- [date-fns](https://date-fns.org/) â Date utilities
- [Vite](https://vite.dev/) â Lightning-fast build tool

## ð Support

- **Issues**: [GitHub Issues](https://github.com/m4sternoob/m4ster-roadmap-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/m4sternoob/m4ster-roadmap-tracker/discussions)
- **Security**: Email xyaz@gmail.com (see SECURITY.md)

---

<p align="center">
  Built with â¤ï¸ for product teams everywhere.<br>
  <a href="https://github.com/m4sternoob/m4ster-roadmap-tracker">â­ Star this repo</a> if you find it useful!
</p>
