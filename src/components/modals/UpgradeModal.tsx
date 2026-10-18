import { Check, Crown, X } from 'lucide-react';
import { ModalShell, ModalHeader } from '@/components/ui/ModalShell';
import { usePlanStore, upgradeContextLabel } from '@/store/planStore';
import { PRO_FEATURE_LIST, PRO_PRICE } from '@/lib/plan';

/**
 * The Pro upgrade surface. Shown when a Free-trial user hits a locked
 * feature. The CTA currently flips the local plan (demo checkout) —
 * it gets wired to Stripe in Phase 3.
 */
export function UpgradeModal() {
  const { plan, setPlan, closeUpgrade, upgradeFeature } = usePlanStore();
  const context = upgradeContextLabel(upgradeFeature);
  const isPro = plan === 'pro';

  return (
    <ModalShell
      onClose={closeUpgrade}
      label="Upgrade to Pro"
      panel="max-w-md w-full rounded-2xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title={isPro ? 'M4ster Pro' : 'Go Pro'}
        onClose={closeUpgrade}
        icon={<Crown size={20} className="text-[var(--accent-bright)]" />}
      />
      <div className="px-6 pb-6">
        {context && !isPro && (
          <p className="text-[13px] text-[var(--text-muted)] -mt-1 mb-4">
            <span className="font-medium text-[var(--text-primary)]">
              {context}
            </span>{' '}
            is a Pro feature.
          </p>
        )}

        <div className="rounded-xl border border-[var(--chrome)] bg-[var(--bg-raised)] p-5 text-center">
          <div className="text-[12px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
            M4ster Pro
          </div>
          <div className="mt-1 text-[34px] font-bold text-[var(--text-primary)] tracking-tight">
            {PRO_PRICE}
            <span className="text-[14px] font-medium text-[var(--text-muted)]">
              /year
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            One price. Every feature. No per-seat math.
          </p>
        </div>

        <ul className="mt-5 space-y-2.5">
          {PRO_FEATURE_LIST.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[var(--text-secondary)]">
              <Check size={15} className="mt-0.5 shrink-0 text-[var(--accent-bright)]" />
              {f}
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="mt-6">
            <p className="text-[13px] text-[var(--text-muted)] text-center">
              You're on Pro — everything is unlocked.
            </p>
            <button
              onClick={() => {
                setPlan('free');
                closeUpgrade();
              }}
              className="mt-3 w-full h-10 rounded-full border border-[var(--chrome)] text-[13.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] motion-press flex items-center justify-center gap-2"
            >
              <X size={15} />
              Switch back to Free trial (demo)
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={() => {
                setPlan('pro');
                closeUpgrade();
              }}
              className="w-full h-11 rounded-full bg-[var(--accent)] text-white text-[14px] font-semibold btn-artcraft shadow-sm motion-press"
            >
              Start free trial — unlock Pro
            </button>
            <p className="mt-2.5 text-[12px] text-[var(--text-faint)] text-center">
              Demo checkout — real billing lands with Stripe in Phase 3.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
