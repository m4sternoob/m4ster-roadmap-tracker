# M4ster Tracker Pro — Product Roadmap

> Turn the tracker into a real product: a fast, beautiful project board for
> companies and solo devs who are fed up with bloated per-seat subscriptions.
> Simple free tier. Pro tier at **$20/year** with everything.

## The tiers

**Free — the trial, for trying it out**
- 1 board, unlimited issues
- Board + List views
- Cloud sync across devices
- 2 themes (Midnight, Porcelain)
- JSON export / import

**Pro — $20/year, the full thing**
- Everything in Free, plus:
- Unlimited boards / projects
- All views: Backlog, Calendar, Timeline, Workload, Sprints, Reports, Archive
- Automations engine
- All 6 themes + background aura customization
- Theme profiles (save, name, and switch between your own setups)
- Custom themes (tune your own colors, not just presets)
- CSV export
- AI features (Phase 4)

## How the trial works (live on the test link)

- The experimental preview enforces the split via `VITE_PLAN_ENFORCEMENT=true`.
  Production builds without the flag keep every feature open.
- Free users see Pro features with a lock affordance — clicking one opens the
  **Upgrade modal** ($20/year pitch, feature list).
- Locked right now: Backlog / Calendar / Timeline / Workload / Sprints /
  Reports / Archive views, Automations, 4 extra themes, background aura,
  theme profiles, custom theme builder, CSV export.
- The "Start free trial" button flips the local plan to Pro (demo checkout —
  lets us pitch and test the full product). Real billing lands with Stripe
  in Phase 3.
- Plan pill in the top bar: "Free trial" / "PRO", opens the upgrade modal.

## Phase 1 — Look like a pro (done)
- [x] De-template visual pass (micro-labels, hairline cards, pill system, refined top bar)
- [x] List, Backlog, and remaining views polished
- [x] Designed empty states
- [x] App icon / favicon polish
- [x] Drag-and-drop cursor sync fix (cards stick to the cursor)

## Phase 2 — Pro tier foundations (in progress)
- [x] Free vs Pro gating in the app (`src/lib/plan.ts`, `src/store/planStore.ts`)
- [x] Locked UI: view tabs, automations, themes, aura, profiles, CSV
- [x] "Go Pro" upgrade surface (pricing card, feature comparison)
- [x] Pro badge / plan pill in the UI
- [ ] Theme profiles: save named setups (theme + aura settings), one-click switch — built, needs pitch review
- [ ] Custom theme builder: pick your own accent/background colors, live preview — built, needs pitch review
- [ ] Trial expiry + graceful downgrade rules (decide: 14-day full trial vs free-forever)

## Phase 3 — Sell it ($20/year)
- [ ] Stripe integration: $20/year subscriptions, customer portal (cancel/renew)
- [ ] License states: free / trialing / pro / expired — with graceful downgrade
- [ ] Landing page: what it is, pricing, why it beats bloated incumbents
- [ ] Flip `VITE_PLAN_ENFORCEMENT` on for production when ready
- [ ] Needs his explicit approval at each money step (standing rule)

## Phase 4 — AI (later, Pro-only)
- [ ] AI issue drafting (turn a rough sentence into a titled, labeled, estimated issue)
- [ ] Smart triage suggestions (priority / assignee hints)
- [ ] Sprint summaries and release notes generation
- [ ] Natural-language board search ("show me overdue bugs assigned to me")

## Phase 5 — Growth
- [ ] Public launch (show the demo link around)
- [ ] Team workspaces (shared boards, roles) — only if users ask for it
- [ ] Keep the core fast: the app must never feel heavy

## How we work
- `experimental` branch = test bed and pitch build. Everything new is built and tried there first.
- `main` = PRODUCTION. All features open at all times until Phase 3 says otherwise.
- Merge experimental → main ONLY on his explicit order.
