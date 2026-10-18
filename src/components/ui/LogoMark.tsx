/**
 * The M4ster brand mark — neon "MT" monogram with black outline.
 * White MT with black outline for max contrast/readability.
 * Thick rounded flowing strokes: M's right peak flows into T's crossbar.
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
      {/* Black outline (behind) */}
      <path
        d="M12 48 V16 L26 34 L40 16 H56 M48 16 V48"
        stroke="#000000"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* White MT (front) */}
      <path
        d="M12 48 V16 L26 34 L40 16 H56 M48 16 V48"
        stroke="#ffffff"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
