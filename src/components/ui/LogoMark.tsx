/**
 * The M4ster brand mark — neon glowing "MT" monogram, 80% icon coverage.
 * Light lavender (#e9d5ff) with SVG neon glow filter, thick rounded
 * flowing strokes. MT spans 80% of the icon (not small).
 * Rendered without its own background: the parent provides the
 * (theme-aware accent) rounded square behind it.
 */
export function LogoMark({ size = 16 }: { size?: number }) {
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
        stroke="#e9d5ff"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gid})`}
      />
    </svg>
  );
}
