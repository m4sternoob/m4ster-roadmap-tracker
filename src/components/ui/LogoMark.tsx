/**
 * The M4ster brand mark — neon "MT" monogram.
 * Thick rounded flowing strokes like neon signage: the M's right peak
 * flows into the T's crossbar. Light lavender (#e9d5ff) for neon feel.
 * Matches the purple neon app-icon aesthetic.
 * Rendered without its own background: the parent provides the
 * (theme-aware accent) rounded square behind it.
 */
export function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 48 V16 L26 34 L40 16 H56 M48 16 V48"
        stroke="#e9d5ff"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
