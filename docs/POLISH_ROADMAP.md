# Polish Roadmap — Notion-grade motion & feel

Target: make m4ster-roadmap-tracker feel like Notion — calm, instant, physical.
Principles: 100-300ms ease-out motion on transform/opacity only; every control
reacts instantly (hover/press/focus); progressive disclosure; quiet feedback
(toasts, not dialogs); helpful empty states; skeleton > spinner; always respect
`prefers-reduced-motion`.

## Phase 1 — Motion foundation (Days 1-5)

- [x] Day 1: Motion tokens — CSS vars for durations/easings
      (`--motion-fast: 120ms`, `--motion-normal: 200ms`, `--motion-slow: 300ms`,
      ease-out curves), a `prefers-reduced-motion` guard, audit and replace ad-hoc
      transitions across the app.
- [x] Day 2: Button & icon micro-interactions — press scale (0.97), hover state
      audit on toolbar buttons, pills, selects. No dead-feeling controls.
- [x] Day 3: Card hover polish — IssueCard lift + shadow on hover, quick actions
      (edit/move) revealed on hover instead of always visible.
- [x] Day 4: Modal choreography — shared ModalShell (backdrop blur fade +
      panel scale entry, Escape/click-outside close, scroll lock) for IssueModal,
      EpicModal, SprintModal, SettingsModal, ConfirmDialog, SearchModal; legacy
      modals restyled to the dark palette.
- [x] Day 5: View transitions — animated crossfade/slide when switching
      Board / Backlog / Sprints / Reports.

## Phase 2 — Feedback & states (Days 6-10)

- [x] Day 6: Toast system — quiet success/error toasts for create, move,
      delete, import/export. No alert-style interruptions.
- [x] Day 7: Skeleton loading — replace the boot spinner with content-shaped
      skeleton screens.
- [x] Day 8: Empty states with CTAs — Notion-style helpful empties
      ("Create your first issue", "No issues match these filters") with actions.
      Fixes the dead-zeros first impression for new visitors.
- [x] Day 9: Drag & drop feel — DragOverlay preview follows the cursor 1:1
      (lifted, tilted card; original stays as faded placeholder), column drop
      ring highlight, 200ms ease-out snap-back on cancel.
- [x] Day 10: Command palette motion pass — stagger results, smooth open/close,
      hover/active states on rows.

## Phase 3 — Depth & density (Days 11-14)

- [x] Day 11: Column collapse/expand (animated).
- [x] Day 12: Board density toggle — compact / comfortable.
- [x] Day 13: Column filters — shipped as a board-level FilterPanel
      (type/priority/status/assignee/epic/label + grouping) in the UI overhaul;
      dead per-column ColumnFilter removed.
- [x] Day 14: Focus visibility & keyboard affordance pass — visible focus rings,
      skip link, logical tab order.

## Daily operating cadence

- Each morning: implement the next unchecked item, verify `npm run build`
  passes, push to `main` (one approval tap), Vercel auto-deploys, verify green.
- Check the box in this file with the same commit. Roadmap is the source of
  truth — if an item needs to move, edit it here first.
