# m4ster-tracker

> Freemium Jira alternative — project tracker without the per-seat tax. Free forever, Pro at $20/year flat.

[![Live](https://img.shields.io/badge/Live-m4ster--tracker.vercel.app-0ea5e9?style=for-the-badge)](https://m4ster-tracker.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?logo=zustand&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

**m4ster-tracker** is a freemium project tracker for solo devs, indie hackers, and small teams (2-10) who are fed up with Jira's per-seat pricing.

**Pricing:** Free tier for everyone. Pro at **$20/year flat** — no per-seat math, no "contact sales", no enterprise tier. Ever.

**Live:**
- **Production:** https://m4ster-tracker.vercel.app
- **Experimental branch preview:** https://m4ster-tracker-git-experimental-m4ster-verse.vercel.app/

## 🌐 Site structure

One deployment, two doors:

- **`/`** — the public website: what the product is, plans, and app downloads.
- **`/app`** — the full tracker app (this is also where the installed PWA and the desktop app open).
- **`/{workspace-slug}`** — a shared workspace board, same app, scoped to that workspace.

Links with a query string (invite links like `/?join=CODE`, sign-in returns) always open the app, never the website — old bookmarks keep working.

Built with React + TypeScript + Vite + Tailwind + Zustand + dnd-kit. Serverless on Vercel + Upstash Redis.

## ✨ Features

### Board
- Drag-and-drop Kanban (@dnd-kit) — 5 columns (Backlog → To Do → In Progress → Review → Done)
- Fluid responsive columns (1080p, MacBook, 2K, 4K, 90%/100%/110% zoom)
- Whole-board vertical scroll (no per-column scroll traps)
- Most-recently-created/moved card highlighted with red border + glow
- Cursor-accurate drag (1:1 tracking, no offset jumps)

### Views
- **Board:** Kanban with drag-drop
- **List:** Compact table view
- **Calendar:** Month grid with visible borders (light/dark themes)
- **Timeline:** Gantt-style
- **Reports:** Burndown charts, sprint health, board summary, epic progress (completion %, story points, per-status breakdown for each epic) — plus a **Download Report** button (standalone HTML report, CSV and JSON exports)
- **Backlog & Sprints:** Planning → Active → Complete lifecycle

### Multiplayer
- **Share + invite:** the board owner shares a board and sends an invite link; signed-in teammates join the *same* board — card moves and edits sync for everyone
- **Live presence:** avatar stack in the top bar shows who's online and what they're doing (viewing a view, editing a card), with Figma-style live cursors
- **Team chat:** Slack/Discord-style channels (#general, #board, #random) in the team panel, plus a live activity feed of creates, moves and assignments

### Customization
- 10 theme presets (Midnight, Ocean, Ember, Forest, Violet, Porcelain, Crimson, Gold, Rose, Mint)
- Custom theme builder (hex/HSL, 23-var palette)
- Theme profiles (save/load/share)
- Background aura controls (Aurora, Intensity, Motion, Cursor glow, Tap ripples)
- MT logo mark (white on blue gradient)

### Pro Features
- Plan system (Free vs Pro)
- Locked Pro tabs, automations, themes, aura, profiles, CSV export
- Upgrade modal ($20/year pitch)
- "Free trial" / "PRO" pill in top bar

### Data & Sync
- Offline-first with localStorage
- Cloud sync via Vercel serverless API + Upstash Redis
- Debounced auto-sync + 30s pull
- Export/Import JSON
- Per-user boards, Google sign-in

## 🚀 Quick Start

    git clone https://github.com/m4sternoob/m4ster-roadmap-tracker.git
    cd m4ster-roadmap-tracker
    npm install
    npm run dev

## 📦 Scripts

    npm run dev          # Dev server
    npm run build        # Production build
    npm run preview      # Preview build
    npm run test         # Vitest
    npm run lint         # Oxlint
    npm run typecheck    # TypeScript

## 🏺 Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **State:** Zustand with persist middleware
- **Drag-drop:** @dnd-kit
- **Backend:** Vercel serverless functions (self-contained, zero imports)
- **DB:** Upstash Redis
- **Auth:** GitHub OAuth, Google sign-in

## 🗺️ Roadmap

**Phase 1:** Trial build ✅ Done
**Phase 2:** Paywall (Stripe) — next
**Phase 3:** Pro feature mix (Triage, Goals, Forms, dependencies, dashboards)
**Phase 4:** Landing page + launch

**Strategy:** No enterprise. Target solo devs, indie hackers, teams of 2-10. Land 1-2 small teams → they love it → word of mouth → famous.

## 💰 Pricing

| | Free | Pro |
|---|---|---|
| Price | $0 | **$20/year flat** |
| Boards | Unlimited | Unlimited |
| Views | All | All |
| Automations | — | ✅ |
| Custom themes | 10 presets | ✅ Builder + profiles |
| CSV export | — | ✅ |
| Aura effects | Basic | ✅ Full |

No per-seat pricing. No "contact sales". No enterprise tier. Ever.

## 🤝 Contributing

1. Fork → feature branch → PR
2. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
3. Update README in the same pass as code changes

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  <a href="https://m4ster-tracker.vercel.app">Try it live</a> ·
  <a href="https://github.com/m4sternoob/m4ster-roadmap-tracker">⭐ Star</a>
</p>
