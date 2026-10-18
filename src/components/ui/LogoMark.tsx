/**
 * The M4ster brand mark — neon glowing "MT" monogram.
 * Light lavender (#e9d5ff) with SVG neon glow filter, thick rounded
 * flowing strokes. Matches the purple neon app-icon aesthetic.
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
        d="M12 48 V16 L26 34 L40 16 H56 M48 16 V48"
        stroke="#e9d5ff"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gid})`}
      />
    </svg>
  );
}
