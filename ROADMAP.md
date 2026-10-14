# M4ster Tracker — Roadmap

The plan to take this from a demo board to a full-fledged app. We ship in a
daily rhythm — **feature days**, **animation days**, and **button-fix days** —
one focused improvement per day, every day.

## How we work

- **Feature day** — a brand-new capability (auth, comments, PWA…)
- **Animation day** — motion, feel, and polish only (no new features)
- **Button-fix day** — audit every control; every button must do something real
- One branch + one PR per day, merged to `main`, Vercel deploys automatically
- Nothing ships unless typecheck, tests, and the production build pass

## Phase 1 — Foundation ✅ done

- Kanban board (5 columns), drag-and-drop, issue/epic/sprint management
- Global search (Cmd+K), filters, reports, keyboard shortcuts
- Six themes + theme picker (Midnight, Ocean, Ember, Forest, Violet, Porcelain)
- Live interactive background (pointer glow, touch ripples, per-theme palettes)
- Working sidebar (For you, Recent, Starred, Sprints, Filters, Reports, Teams, Goals)
- Restrained hover language (150ms fades, instant nav pills)
- Cloud sync (Vercel serverless API + Upstash Redis, last-write-wins)
- Export / import workspace JSON
- PWA service worker (network-first navigations, no more white screen)

## Phase 2 — Accounts 🚧 in progress

- [x] Username + password signup / login / logout (PBKDF2 hashing, HttpOnly sessions)
- [x] Boards scoped per account — sign in on any device, same boards
- [ ] Password reset via email (needs Resend — see Integrations)
- [ ] "Remember me" vs session-only login
- [ ] Profile: change username, change password

## Phase 3 — Feature days

- [x] **Comments on cards** — discuss work right on the issue
- [ ] **File attachments** — Vercel Blob storage for screenshots and docs
- [ ] **Due dates + reminders** — date picker, overdue highlighting
- [ ] **Subtasks / checklists** — break a card into checkable steps
- [ ] **Board templates** — start from Sprint, Bug triage, or Roadmap presets
- [ ] **Bulk actions** — multi-select cards, move/assign/delete in one go
- [ ] **Saved searches** — named filter sets in the sidebar
- [ ] **Activity feed** — who changed what, per board
- [ ] **Public share links** — read-only board link for anyone
- [ ] **Offline queue** — mutations queued in IndexedDB, synced on reconnect

## Phase 4 — Animation days

- [x] **Drag physics** — springy card pickup, drop targets that breathe
- [ ] **Column transitions** — cards glide when status changes elsewhere
- [ ] **Celebration** — confetti burst when a card hits Done
- [ ] **Skeleton polish** — shimmer loading states everywhere, no layout jumps
- [ ] **Micro-interactions** — star pop, checkbox tick, toggle springs
- [ ] **View transitions** — board ↔ list ↔ backlog morph smoothly
- [ ] **Live background v2** — theme-reactive scenes (rain in Ocean, embers in Ember)

## Phase 5 — Button-fix days (recurring audit)

Every control must do something honest. No dead clicks, no fake buttons.

- [x] Audit pass 1: sidebar + top bar
- [ ] Audit pass 2: issue modal + all dialogs
- [ ] Audit pass 3: settings + empty states
- [ ] Anything decorative becomes a real feature or an honest "not in demo" note

## Phase 6 — Integrations

What we can plug in, roughly in order of value per effort:

1. **Discord / Slack webhooks** — "card moved to Done" posts to a channel.
   Simple outgoing webhook, no OAuth needed.
2. **GitHub** — import repo issues as cards; later, two-way status sync.
   Starts with a personal access token, OAuth app for full sync.
3. **Google Calendar** — due dates become calendar events. Needs Google OAuth.
4. **Resend email** — welcome mail, password reset, weekly board digest.
   Free tier covers us (3k emails/month).
5. **Vercel Blob** — powers the attachments feature (Phase 3).
6. **Sentry** — error tracking so we hear about crashes before users do.
7. **Zapier / Make webhooks** — generic outgoing webhook on card events;
   unlocks hundreds of no-code integrations at once.
8. **Stripe** — paid teams / pro workspaces. Much later, only if we want it.

## Out of scope (for now)

- Real-time multiplayer cursors (needs websocket infra — revisit after offline queue)
- Native mobile apps (PWA covers 90% of it)
- Anything that costs money before we need it
