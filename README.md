# m4ster-tracker

> Professional roadmap tracker for product teams — Kanban, sprints, burndown, dark mode.

![m4ster-tracker banner](https://img.shields.io/badge/m4ster--tracker-v1.0.0-0ea5e9?style=for-the-badge&logo=react&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?logo=zustand&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

**m4ster-tracker** is a production-ready, offline-first roadmap tracker built for product teams and solo developers. It combines a clean Kanban board with sprint planning, burndown analytics, and epic management — all in a fast, accessible, dark-mode-friendly SPA.

No backend required. Data persists in localStorage. Deploy anywhere as static files.

## ✨ Features

| Category             | Features                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Kanban Board**     | Drag-and-drop (@dnd-kit), 5 columns (Backlog → To Do → In Progress → Review → Done), priority sorting, paginated columns             |
| **Issue Management** | Create/edit/delete, types (Epic/Story/Task/Subtask/Bug), priorities, story points, assignees, labels, due dates, epic/sprint linking |
| **Epics**            | Color-coded, issue grouping, progress tracking                                                                                       |
| **Sprints**          | Planning → Active → Complete lifecycle, sprint goals, burndown charts, issue assignment                                              |
| **Reports**          | SVG burndown charts (ideal vs actual), sprint progress and behind/on-track indicators                                                |
| **UX**               | Dark/light theme (system + manual), keyboard navigation, ARIA labels, focus management, responsive grid                              |
| **Data**             | localStorage persistence, export/import JSON backups, zero-config                                                                    |
| **DevEx**            | TypeScript strict, Oxlint, Prettier, Vitest, CI/CD, Docker                                                                           |

## 📸 Screenshots

_Screenshots will be added to `docs/screenshots/` after the first deploy._

## 🚀 Quick Start

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
npm run build        # Production build → ./dist
npm run preview      # Preview production build locally
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # Oxlint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
npm run format:check # Check formatting
npm run typecheck    # TypeScript validation
```

## 🐳 Docker

```bash
# Build image
docker build -t m4ster-tracker .

# Run container (port 80)
docker run -d -p 80:80 --name m4ster-tracker m4ster-tracker
```

> No `docker-compose.yml` is shipped with this repo — the container above is all you need for a static deploy.

## ☁️ Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Auto-detects Vite → deploys on every push
4. Custom domain in Settings → Domains

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

## 🏗️ Architecture

```
src/
├── components/
│   ├── modals/          # IssueModal, EpicModal, SprintModal, SettingsModal
│   ├── providers/       # ThemeProvider
│   ├── ui/              # Column, IssueCard, Toolbar, SectionHeader, ConfirmDialog
│   └── views/           # BoardView, BacklogView, SprintsView, ReportsView
├── store/
│   └── projectStore.ts  # Zustand store with persistence middleware
├── types/
│   └── index.ts         # All TypeScript interfaces & constants
├── utils/
│   ├── constants.ts     # Color maps, status styles
│   └── helpers.ts       # generateIssueKey, formatDate, isOverdue, etc.
├── styles/
│   └── index.css        # Tailwind v4 + custom utilities
├── test/
│   └── setup.ts         # Vitest globals, mocks
└── main.tsx             # Entry point
```

### State Management

- **Zustand** with `persist` middleware → localStorage
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

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report (HTML in ./coverage)
npm run test:coverage
```

**Test Structure:**

- `src/utils/helpers.test.ts` — Pure function tests (generate keys, formatting, overdue detection)
- Add component tests in `src/components/**/*.test.tsx`
- Add integration tests in `src/test/integration/`

## 🔧 Configuration

### Tailwind v4

`tailwind.config.js` — Custom colors, fonts, animations, dark mode

### TypeScript

`tsconfig.json` — Strict mode, path aliases (`@/`, `@components/`, etc.)

### Vite

`vite.config.ts` — Aliases, chunk splitting, dev server config

### CI/CD

`.github/workflows/ci.yml` — Lint → Test → Build → Docker → Deploy

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed phases.

| Phase    | Focus                                                | Status     |
| -------- | ---------------------------------------------------- | ---------- |
| **v1.0** | Core Kanban, sprints, burndown, themes, persistence  | ✅ Done    |
| **v1.1** | Search/filter, keyboard shortcuts, PWA, a11y audit   | 🔄 Next    |
| **v1.2** | Backend API, auth, realtime, comments, teams         | ⏳ Planned |
| **v1.3** | GitHub/GitLab sync, webhooks, Slack/Discord, imports | ⏳ Planned |
| **v2.0** | Time tracking, AI assist, custom fields, automation  | ⏳ Planned |

## 🤝 Contributing

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

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [@dnd-kit](https://dndkit.com/) — Accessible drag-and-drop
- [Zustand](https://zustand-demo.pmnd.rs/) — Simple state management
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Lucide](https://lucide.dev/) — Beautiful icons
- [date-fns](https://date-fns.org/) — Date utilities
- [Vite](https://vite.dev/) — Lightning-fast build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/m4sternoob/m4ster-roadmap-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/m4sternoob/m4ster-roadmap-tracker/discussions)
- **Security**: Email masternoob102030@gmail.com (see SECURITY.md)

---

<p align="center">
  Built with ❤️ for product teams everywhere.<br>
  <a href="https://github.com/m4sternoob/m4ster-roadmap-tracker">⭐ Star this repo</a> if you find it useful!
</p>
