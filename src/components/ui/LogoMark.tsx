/**
 * The M4ster brand mark — geometric "MT" monogram.
 * Custom vector paths (not plain text): bold rounded strokes,
 * M with sharp valleys, T with clean crossbar. Designed to read
 * clearly at 14px favicon size up to full brand size.
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
      {/* M: bold geometric with rounded joins */}
      <path
        d="M14 46 V18 L24 32 L34 18 V46"
        stroke="#ffffff"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* T: clean crossbar + stem */}
      <path
        d="M38 18 H54 M46 18 V46"
        stroke="#ffffff"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}
