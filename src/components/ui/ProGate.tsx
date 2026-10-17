import { Lock } from 'lucide-react';
import { usePlanStore } from '@/store/planStore';
import { canUse, featureLabel, type ProFeature } from '@/lib/plan';

/**
 * Renders children when the plan allows `feature`; otherwise renders a
 * compact locked row that opens the upgrade modal on click.
 */
export function ProGate({
  feature,
  children,
  title,
  blurb,
}: {
  feature: ProFeature;
  children: React.ReactNode;
  title?: string;
  blurb?: string;
}) {
  // NOTE: subscribe to `plan` itself — selecting the `can` helper would
  // never re-render because it's a stable function reference.
  const plan = usePlanStore((s) => s.plan);
  const can = (f: ProFeature) => canUse(plan, f);
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  if (can(feature)) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => openUpgrade(feature)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-[var(--chrome)] px-3 py-2.5 text-left hover:border-[var(--accent-bright)] motion-interactive"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent-bright)]">
        <Lock size={13} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--text-primary)]">
          {title ?? featureLabel(feature)}
          <span className="rounded-full bg-[var(--accent)]/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[var(--accent-bright)]">
            Pro
          </span>
        </span>
        {blurb && (
          <span className="block truncate text-[11.5px] text-[var(--text-faint)]">
            {blurb}
          </span>
        )}
      </span>
    </button>
  );
}
