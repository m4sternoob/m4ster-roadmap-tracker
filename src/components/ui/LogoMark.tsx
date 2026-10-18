/**
 * The M4ster brand mark — refined "MT" monogram.
 * Thin elegant strokes (not bold), balanced spacing, reads clearly
 * at all sizes. Inspired by neon app-icon aesthetics: clean lines,
 * subtle presence, professional.
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
        d="M16 44 V20 L25 32 L34 20 V44"
        stroke="#ffffff"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39 20 H53 M46 20 V44"
        stroke="#ffffff"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
