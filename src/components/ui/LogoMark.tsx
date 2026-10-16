/**
 * The M4ster brand mark — white "M4" monogram.
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
      <text
        x="32"
        y="42.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={900}
        fontSize={29}
        fill="#ffffff"
      >
        M4
      </text>
    </svg>
  );
}
