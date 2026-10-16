# M4ster Tracker Pro — Product Roadmap

> The plan to turn the tracker into a real product: a Jira alternative for
> companies and solo devs who are fed up with Jira subscriptions.
> Simple free tier. Pro tier at **$20/year** with everything.

## The tiers

**Free — simple, for trying it out**
- 1 board, unlimited issues
- Board + List views
- Cloud sync across devices
- 2 basic themes (Midnight, Porcelain)
- JSON export / import

**Pro — $20/year, the full thing**
- Everything in Free, plus:
- Unlimited boards / projects
- All views: Sprints, Reports, Calendar, Timeline, Workload, Archive
- Automations engine
- All 6 themes + Background aura customization
- Theme profiles (save, name, and switch between your own setups)
- Custom themes (tune your own colors, not just presets)
- CSV export
- AI features (Phase 4)

## Phase 1 — Look like a pro (in progress)
- [x] De-template visual pass (micro-labels, hairline cards, pill system, refined top bar) — built on `experimental`, awaiting merge approval
- [ ] Apply the same polish to List, Backlog, and the remaining views
- [ ] Designed empty states everywhere (no dead "nothing here" screens)
- [ ] App icon / favicon and social preview polish

## Phase 2 — Pro tier foundations
- [ ] Free vs Pro gating in the app (feature flags per tier)
- [ ] Theme profiles: save named setups (theme + aura settings), one-click switch
- [ ] Custom theme builder: pick your own accent/background colors, live preview
- [ ] Pro badge in the UI for paying users
- [ ] "Go Pro" upgrade surface (pricing card, feature comparison)

## Phase 3 — Sell it ($20/year)
- [ ] Stripe integration: $20/year subscriptions, customer portal (cancel/renew)
- [ ] License states: free / trialing / pro / expired — with graceful downgrade
- [ ] Landing page: what it is, why not Jira, pricing
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
- `experimental` branch = test bed. Everything new is built and tried there first.
- `main` = PRODUCTION. Stays pro, all features, public at all times.
- Merge experimental → main ONLY on his explicit order.
- Business + testing talk lives in the experimental chat, not in code comments.
