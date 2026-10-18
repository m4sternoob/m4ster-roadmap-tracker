import { useEffect, useRef } from 'react';

/**
 * CursorOrb — the m4ster signature cursor.
 *
 * A violet aura orb + bright core follow the pointer with lerped trailing
 * (slow glow trails behind a fast dot, 01-binary-portfolio vibe).
 *
 * - Grows softly over interactive elements (links, buttons, inputs…)
 * - THE SACRED DOWNLOAD MOMENT: over [data-cursor="download"] buttons ONLY,
 *   the orb goes big + bright, the core turns white-hot, a pulsing ring
 *   radiates, and the button gets a magnetic pull toward the pointer.
 *   This effect is reserved for download buttons — regular buttons get
 *   normal hover glow and nothing more.
 *
 * Desktop (fine pointer + hover) only. Native cursor is hidden via the
 * `custom-cursor` body class (see styles/index.css); touch devices keep
 * their native behavior. Respects prefers-reduced-motion.
 */
const INTERACTIVE_SEL =
  'a, button, [role="button"], input, select, textarea, [contenteditable], [data-cursor]';
const DOWNLOAD_SEL = '[data-cursor="download"]';
const MAGNET_SEL = '[data-magnet]';
const MAGNET_MAX = 7; // px of pull toward the pointer
const MAGNET_RADIUS = 90; // px — pull only when the pointer is this close

export function CursorOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    const orb = orbRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!orb || !dot || !ring) return;

    document.body.classList.add('custom-cursor', 'cursor-alive');

    // Pointer + lerped render state
    let px = -100;
    let py = -100;
    let ox = -100; // orb (trailing glow)
    let oy = -100;
    let dx = -100; // dot (fast core)
    let dy = -100;
    let scale = 0; // 0 = hidden until first move
    let scaleTarget = 1;
    let visible = false;
    let down = false;
    let downloading = false;
    let raf = 0;
    let magnetEl: HTMLElement | null = null;
    let lastMagnet: HTMLElement | null = null;
    let mx = 0;
    let my = 0; // current magnet offset (lerped)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!visible) {
        visible = true;
        ox = dx = px;
        oy = dy = py;
        orb.style.opacity = '1';
        dot.style.opacity = '1';
        ring.style.opacity = downloading ? '1' : '0';
      }
      const t = e.target as HTMLElement | null;
      const hit = t?.closest?.(INTERACTIVE_SEL) as HTMLElement | null;
      downloading = !!t?.closest?.(DOWNLOAD_SEL);
      scaleTarget = downloading ? 2.4 : hit ? 1.55 : 1;
      orb.classList.toggle('is-download', downloading);
      dot.classList.toggle('is-download', downloading);
      ring.classList.toggle('is-download', downloading);
      ring.style.opacity = downloading && visible ? '1' : '0';
      magnetEl = (t?.closest?.(MAGNET_SEL) as HTMLElement | null) ?? null;
    };

    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        visible = false;
        orb.style.opacity = '0';
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      }
    };
    const onBlur = () => {
      visible = false;
      orb.style.opacity = '0';
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const frame = () => {
      // trailing: dot snaps, glow drifts behind
      dx = lerp(dx, px, 0.42);
      dy = lerp(dy, py, 0.42);
      ox = lerp(ox, px, 0.16);
      oy = lerp(oy, py, 0.16);
      const sTarget = visible ? (down ? scaleTarget * 0.72 : scaleTarget) : 0;
      scale = lerp(scale, sTarget, 0.22);

      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      orb.style.transform = `translate3d(${ox}px, ${oy}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      ring.style.transform = `translate3d(${ox}px, ${oy}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;

      // magnetic pull on the hovered [data-magnet] element (download buttons only)
      const active = magnetEl && visible ? magnetEl : null;
      if (active) {
        lastMagnet = active;
        const r = active.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(px - cx, py - cy);
        const reach = MAGNET_RADIUS + Math.max(r.width, r.height) / 2;
        if (dist < reach) {
          const pull = Math.min(1, 1 - dist / reach);
          mx = lerp(mx, ((px - cx) / Math.max(dist, 1)) * MAGNET_MAX * pull, 0.25);
          my = lerp(my, ((py - cy) / Math.max(dist, 1)) * MAGNET_MAX * pull, 0.25);
        } else {
          mx = lerp(mx, 0, 0.25);
          my = lerp(my, 0, 0.25);
        }
        active.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
      } else if (lastMagnet) {
        // ease the previous element back to rest
        mx = lerp(mx, 0, 0.3);
        my = lerp(my, 0, 0.3);
        lastMagnet.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
        if (Math.abs(mx) < 0.1 && Math.abs(my) < 0.1) {
          lastMagnet.style.transform = '';
          lastMagnet = null;
          mx = my = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onBlur);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onBlur);
      document.body.classList.remove('custom-cursor', 'cursor-alive');
      if (lastMagnet) lastMagnet.style.removeProperty('transform');
    };
  }, []);

  return (
    <>
      <div ref={orbRef} className="cursor-orb" aria-hidden="true" />
      <div ref={ringRef} className="cursor-orb-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-orb-dot" aria-hidden="true" />
    </>
  );
}
