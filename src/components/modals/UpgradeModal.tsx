import { Check, Crown, X } from 'lucide-react';
import { ModalShell, ModalHeader } from '@/components/ui/ModalShell';
import { usePlanStore, upgradeContextLabel } from '@/store/planStore';
import { PRO_FEATURE_LIST, PRO_PRICE } from '@/lib/plan';

const FREE_FEATURES = [
  'Board + List views',
  '1 project, core tracking',
  'Midnight + Porcelain themes',
  'Local data on your device',
];

const TEAM_FEATURES = [
  'Everything in Pro',
  'Shared boards with invite links',
  'Live presence + team chat',
  'One flat price per workspace — never per seat',
];

/**
 * Plan picker — three-card layout (Free / Pro / Team) in the style of the
 * classic SaaS pricing modal, with our model: one flat yearly price,
 * no per-seat math, no enterprise tier. The CTAs flip the local plan
 * (demo checkout) until Stripe lands in Phase 3.
 */
export function UpgradeModal() {
  const { plan, setPlan, closeUpgrade, upgradeFeature } = usePlanStore();
  const context = upgradeContextLabel(upgradeFeature);
  const isPro = plan === 'pro';

  const unlock = () => {
    setPlan('pro');
    closeUpgrade();
  };

  return (
    <ModalShell
      onClose={closeUpgrade}
      label="Compare plans"
      panel="max-w-3xl w-full rounded-2xl border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title={isPro ? 'M4ster Pro' : 'Compare plans and features'}
        onClose={closeUpgrade}
        icon={<Crown size={20} className="text-[var(--accent-bright)]" />}
      />
      <div className="px-6 pb-6">
        {context && !isPro && (
          <p className="text-[13px] text-[var(--text-muted)] -mt-1 mb-4">
            <span className="font-medium text-[var(--text-primary)]">{context}</span> is a Pro
            feature.
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-3 items-stretch">
          {/* Free */}
          <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] p-5 flex flex-col">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Free</div>
            <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">For trying things out</p>
            <div className="mt-3 text-[26px] font-bold text-[var(--text-primary)]">
              $0
              <span className="text-[13px] font-medium text-[var(--text-muted)]"> forever</span>
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setPlan('free');
                closeUpgrade();
              }}
              className="mt-5 w-full h-10 rounded-full border border-[var(--chrome)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] motion-press"
            >
              {isPro ? 'Switch to Free' : 'Current plan'}
            </button>
          </div>

          {/* Pro — recommended */}
          <div className="relative rounded-xl border-2 border-[var(--accent)] bg-[var(--bg-raised)] p-5 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-[var(--accent)] text-white text-center text-[10.5px] font-bold uppercase tracking-widest py-1">
              Recommended
            </div>
            <div className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">Pro</div>
            <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">For makers who ship</p>
            <div className="mt-3 text-[26px] font-bold text-[var(--text-primary)]">
              {PRO_PRICE}
              <span className="text-[13px] font-medium text-[var(--text-muted)]">/year</span>
            </div>
            <p className="text-[12px] text-[var(--text-faint)]">One price. Every feature. No per-seat math.</p>
            <ul className="mt-4 space-y-2 flex-1">
              {PRO_FEATURE_LIST.slice(0, 6).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--accent-bright)]" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-5 h-10 rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold text-[var(--accent-bright)] border border-[var(--accent)]/50">
                <Check size={15} /> You're on Pro
              </div>
            ) : (
              <button
                onClick={unlock}
                className="mt-5 w-full h-10 rounded-full bg-[var(--accent)] text-white text-[13px] font-semibold btn-artcraft motion-press"
              >
                Start free trial
              </button>
            )}
          </div>

          {/* Team */}
          <div className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-app)] p-5 flex flex-col">
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Team</div>
            <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">Pro, shared with your crew</p>
            <div className="mt-3 text-[26px] font-bold text-[var(--text-primary)]">
              {PRO_PRICE}
              <span className="text-[13px] font-medium text-[var(--text-muted)]">/year flat</span>
            </div>
            <p className="text-[12px] text-[var(--text-faint)]">Per workspace, not per person.</p>
            <ul className="mt-4 space-y-2 flex-1">
              {TEAM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)]">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--accent-bright)]" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-5 h-10 rounded-full flex items-center justify-center text-[13px] font-medium text-[var(--text-muted)] border border-[var(--chrome)]">
                Included in your Pro
              </div>
            ) : (
              <button
                onClick={unlock}
                className="mt-5 w-full h-10 rounded-full border border-[var(--chrome)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] motion-press"
              >
                Start free trial
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-[12px] text-[var(--text-faint)] text-center flex items-center justify-center gap-1.5">
          <X size={12} className="hidden" aria-hidden="true" />
          Demo checkout — real billing lands with Stripe in Phase 3. No enterprise tier, no
          "contact sales", ever.
        </p>
      </div>
    </ModalShell>
  );
}
