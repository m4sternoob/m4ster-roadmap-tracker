import type { ReactNode } from 'react';

type ViewTransitionProps = {
  /** Name of the currently active view. Changing it replays the entrance. */
  view: string;
  /** The outgoing view, rendered once and faded out. Null when idle. */
  leaving: ReactNode | null;
  children: ReactNode;
};

/* Crossfade wrapper for the main views (Board, Backlog, Sprints, Reports).
   The incoming view plays a short rise-and-fade entrance while the outgoing
   view stays mounted for a beat and fades out above it. Hidden from assistive
   tech while it fades, since it is leaving the page. */
export function ViewTransition({ view, leaving, children }: ViewTransitionProps) {
  return (
    <div className="relative">
      <div key={view} className="view-enter">
        {children}
      </div>
      {leaving !== null && (
        <div
          key={`leaving-${view}`}
          className="view-exit absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {leaving}
        </div>
      )}
    </div>
  );
}
