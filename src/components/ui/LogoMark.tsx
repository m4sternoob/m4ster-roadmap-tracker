/**
 * The M4ster brand mark — neon glowing "MT" monogram, 80% icon coverage.
 * Thick rounded flowing strokes with an SVG glow filter. The stroke uses
 * currentColor so icon packs control the letter color (white, dark, or
 * theme-accent). Rendered without its own background: the parent provides
 * the icon-pack rounded square behind it.
 */
export function LogoMark({ size = 21 }: { size?: number }) {
  const gid = `neon-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={gid} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M9 50 V14 L25 34 L41 14 H60 M51 14 V50"
        stroke="currentColor"
        strokeWidth={10.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gid})`}
      />
    </svg>
  );
}
