import { useLayoutEffect, useRef, type RefObject } from 'react';
import { cardNodes } from '@/lib/cardNodes';
import type { Issue } from '@/types';

const GLIDE_MS = 240;
const GLIDE_EASING = 'cubic-bezier(0, 0, 0.2, 1)';
const MIN_JUMP = 4; // px — ignore sub-pixel noise
const CLEANUP_SLACK = 60; // ms — clear inline styles once the glide ends

export interface CardRect {
  left: number;
  top: number;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Inverted FLIP offset: how far the card would need to travel back to
 *  where it was. Null when the move is too small to bother animating. */
export function flipDelta(
  prev: CardRect,
  next: CardRect
): { dx: number; dy: number } | null {
  const dx = prev.left - next.left;
  const dy = prev.top - next.top;
  if (Math.abs(dx) < MIN_JUMP && Math.abs(dy) < MIN_JUMP) return null;
  return { dx: Math.round(dx), dy: Math.round(dy) };
}

interface Snapshot {
  rects: Map<string, CardRect>;
  scroll: { x: number; y: number; cx: number; cy: number };
}

/**
 * Cards glide to their new spot when their position changes without a drag —
 * a status change from the move menu, a reshuffle from filters or density,
 * or an update synced from another device. FLIP: snapshot every card's rect
 * after each commit, then animate the delta as a transform-only, 240ms
 * ease-out glide. Motion only — no behavior changes.
 */
export function useCardGlide(
  issues: Issue[],
  draggingId: string | null,
  suppress: RefObject<boolean>,
  scrollRef: RefObject<HTMLElement | null>
) {
  const prev = useRef<Snapshot | null>(null);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    // Rects are viewport-relative, so fold the scroll offsets in — a
    // scrolled board shouldn't read as every card having moved.
    const scroll = {
      x: window.scrollX,
      y: window.scrollY,
      cx: scroller?.scrollLeft ?? 0,
      cy: scroller?.scrollTop ?? 0,
    };
    const rects = new Map<string, CardRect>();
    for (const issue of issues) {
      const node = cardNodes.get(issue.id);
      if (!node) continue;
      const r = node.getBoundingClientRect();
      rects.set(issue.id, {
        left: r.left + scroll.x + scroll.cx,
        top: r.top + scroll.y + scroll.cy,
      });
    }

    const before = prev.current;
    prev.current = { rects, scroll };

    if (draggingId !== null || !before || prefersReducedMotion()) return;
    // A finished drag already has its own motion (dnd-kit's drop
    // animation) — don't pile a glide on top of it.
    if (suppress.current) {
      suppress.current = false;
      return;
    }

    for (const [id, next] of rects) {
      const was = before.rects.get(id);
      if (!was) continue; // brand-new card: it just appears
      const delta = flipDelta(was, next);
      if (!delta) continue;
      const node = cardNodes.get(id);
      if (!node) continue;
      // Invert: put the card back where it was...
      node.style.transition = 'none';
      node.style.transform = `translate(${delta.dx}px, ${delta.dy}px)`;
      // ...then glide it home. Two frames so the inverted position paints.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.style.transition = `transform ${GLIDE_MS}ms ${GLIDE_EASING}`;
          node.style.transform = '';
        });
      });
      // Leave no trace: React's own inline style for an idle card is
      // transform:'' / transition:undefined, so clearing keeps them in sync.
      window.setTimeout(() => {
        node.style.transition = '';
        node.style.transform = '';
      }, GLIDE_MS + CLEANUP_SLACK);
    }
  });
}
