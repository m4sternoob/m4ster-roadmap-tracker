import { useEffect, useRef } from 'react';

/**
 * LiveBackground — the app's "living" backdrop, now touch-interactive.
 *
 * A canvas of soft aurora orbs in the active theme's accent palette drifts
 * slowly behind the interface. Orbs gently push away from your cursor or
 * finger, a soft glow follows the pointer, and taps send out a ripple.
 * Pure canvas + rAF (GPU-friendly), pointer-transparent, paused when the tab
 * is hidden, and still under `prefers-reduced-motion`.
 */

type RGB = [number, number, number];

function parseColor(s: string): RGB {
  const t = s.trim();
  if (t.startsWith('#')) {
    const h =
      t.length === 4
        ? t
            .slice(1)
            .split('')
            .map((c) => c + c)
            .join('')
        : t.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = t.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [88, 157, 255];
}

function readTheme(): { colors: RGB[]; dark: boolean } {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string, fallback: string) => cs.getPropertyValue(n).trim() || fallback;
  return {
    colors: [
      parseColor(get('--accent-bright', '#579dff')),
      parseColor(get('--accent', '#0c66e4')),
      parseColor(get('--accent-deep', '#0055cc')),
    ],
    dark: document.documentElement.classList.contains('dark'),
  };
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: RGB;
  a: number;
  phase: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  a: number;
}

const ORB_COUNT = 12;
const FIELD_RADIUS = 360;

export function LiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let { colors, dark } = readTheme();

    // Re-read palette whenever the theme flips.
    const themeObserver = new MutationObserver(() => {
      ({ colors, dark } = readTheme());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    const orbs: Orb[] = Array.from({ length: ORB_COUNT }, () => ({
      x: rnd(0, w),
      y: rnd(0, h),
      vx: rnd(-0.6, 0.6),
      vy: rnd(-0.5, 0.5),
      r: rnd(160, 340),
      c: colors[Math.floor(Math.random() * colors.length)],
      a: rnd(0.3, 0.52),
      phase: rnd(0, Math.PI * 2),
    }));
    const ripples: Ripple[] = [];

    // Pointer state (mouse + touch via Pointer Events).
    const pointer = { x: -9999, y: -9999, active: false };
    const glow = { x: -9999, y: -9999 };
    const RIPPLE_COLOR: RGB = colors[0];

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 8, a: 0.35 });
      if (ripples.length > 8) ripples.shift();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown, { passive: true });

    const drawOrb = (x: number, y: number, r: number, c: RGB, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
      g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';

      // Ease the follow-glow toward the pointer.
      glow.x += (pointer.x - glow.x) * 0.09;
      glow.y += (pointer.y - glow.y) * 0.09;
      if (pointer.active) {
        drawOrb(glow.x, glow.y, 260, colors[0], dark ? 0.24 : 0.14);
      }

      for (const o of orbs) {
        // Drift (faster than before) + gentle parallax opposite the pointer.
        o.x += o.vx;
        o.y += o.vy;
        o.phase += 0.014;
        // Parallax: orbs shift slightly against pointer position.
        const parX = pointer.active ? (0.5 - pointer.x / w) * 26 : 0;
        const parY = pointer.active ? (0.5 - pointer.y / h) * 26 : 0;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;

        // Strong push away from the pointer.
        let px = o.x;
        let py = o.y;
        if (pointer.active) {
          const dx = o.x - pointer.x;
          const dy = o.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < FIELD_RADIUS && d > 1) {
            const f = ((FIELD_RADIUS - d) / FIELD_RADIUS) * 3.4;
            px += (dx / d) * f;
            py += (dy / d) * f;
          }
        }

        // Breathing.
        const breathe = 1 + Math.sin(o.phase) * 0.15;
        drawOrb(px + parX, py + parY, o.r * breathe, o.c, o.a);
      }

      // Tap ripples.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 7;
        rp.a *= 0.94;
        if (rp.a < 0.015) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${RIPPLE_COLOR[0]},${RIPPLE_COLOR[1]},${RIPPLE_COLOR[2]},${rp.a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      void 0;
    };

    let onVis: (() => void) | null = null;
    if (reduced) {
      // One calm static frame — no motion, still themed.
      ctx.clearRect(0, 0, w, h);
      for (const o of orbs) drawOrb(o.x, o.y, o.r, o.c, o.a * 0.8);
    } else {
      onVis = () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else raf = requestAnimationFrame(frame);
      };
      document.addEventListener('visibilitychange', onVis);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (onVis) document.removeEventListener('visibilitychange', onVis);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div className="live-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <span className="live-vignette" />
    </div>
  );
}
