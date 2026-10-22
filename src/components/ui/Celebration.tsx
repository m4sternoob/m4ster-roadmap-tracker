import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { cardNodes } from '@/lib/cardNodes';

/**
 * Celebration — a confetti burst when a card lands in Done.
 *
 * The store flips `celebration` (with a fresh nonce) on every Done-move;
 * this component watches it, fires one canvas burst from the landed card's
 * screen position (viewport center if the card isn't mounted), then clears
 * the state. Pure canvas + rAF, pointer-transparent, and skipped entirely
 * under prefers-reduced-motion.
 */

type RGB = [number, number, number];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  fill: string;
  life: number;
  ttl: number;
  sway: number;
  phase: number;
}

const BURST_MS = 1400;
const COUNT = 90;

function hexToRgb(s: string): RGB {
  const h =
    s.length === 4
      ? s
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : s.slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Confetti in the active theme's accent family, plus gold and white. */
function palette(): string[] {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
  const accents: RGB[] = [
    hexToRgb(get('--accent-bright', '#579dff')),
    hexToRgb(get('--accent', '#0c66e4')),
    hexToRgb(get('--accent-deep', '#0055cc')),
  ];
  const base = accents.map(([r, g, b]) => `rgb(${r},${g},${b})`);
  return [...base, 'rgb(250,204,21)', 'rgb(255,255,255)'];
}

function spawnBurst(cx: number, cy: number, colors: string[]): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < COUNT; i++) {
    // Upward cone: most pieces arc up from the card, a few spray low.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
    const speed = 300 + Math.random() * 560;
    parts.push({
      x: cx + (Math.random() - 0.5) * 24,
      y: cy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 4 + Math.random() * 5,
      h: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 16,
      fill: colors[i % colors.length],
      life: BURST_MS,
      ttl: BURST_MS,
      sway: 40 + Math.random() * 90,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return parts;
}

export function Celebration() {
  const celebration = useProjectStore((s) => s.celebration);
  const clearCelebration = useProjectStore((s) => s.clearCelebration);
  const fired = useRef(0);

  useEffect(() => {
    if (!celebration || fired.current === celebration.nonce) return;
    fired.current = celebration.nonce;

    // Reduced motion: no confetti, just acknowledge the event.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearCelebration();
      return;
    }

    const node = cardNodes.get(celebration.issueId);
    const rect = node?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:120;`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      clearCelebration();
      return;
    }
    ctx.scale(dpr, dpr);

    const parts = spawnBurst(cx, cy, palette());
    let raf = 0;
    let last = performance.now();
    let alive = true;

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let anyAlive = false;
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life -= dt * 1000;
        anyAlive = true;
        // Gravity + air drag + a flutter so pieces drift like paper.
        p.vy += 1500 * dt;
        const drag = Math.pow(0.35, dt);
        p.vx *= drag;
        p.vy *= Math.pow(0.55, dt);
        p.vx += Math.sin((now / 1000) * 9 + p.phase) * p.sway * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 450));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.fill;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (anyAlive) raf = requestAnimationFrame(frame);
      else finish();
    };

    const finish = () => {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      canvas.remove();
      clearCelebration();
    };

    // Safety net: a hidden tab stalls rAF; never leave a stale overlay.
    const safety = window.setTimeout(finish, BURST_MS + 1200);
    raf = requestAnimationFrame(frame);

    return () => {
      window.clearTimeout(safety);
      finish();
    };
  }, [celebration, clearCelebration]);

  return null;
}
