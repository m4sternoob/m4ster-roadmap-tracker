import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Plan, ProFeature } from '@/lib/plan';
import { featureLabel } from '@/lib/plan';

interface PlanState {
  /** Current plan. Defaults to 'free' (the trial). */
  plan: Plan;
  /** Upgrade modal visibility + which feature triggered it. */
  upgradeOpen: boolean;
  upgradeFeature: ProFeature | null;
  setPlan: (plan: Plan) => void;
  openUpgrade: (feature?: ProFeature) => void;
  closeUpgrade: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: 'free',
      upgradeOpen: false,
      upgradeFeature: null,
      setPlan: (plan) => set({ plan }),
      openUpgrade: (feature) =>
        set({ upgradeOpen: true, upgradeFeature: feature ?? null }),
      closeUpgrade: () => set({ upgradeOpen: false, upgradeFeature: null }),
    }),
    {
      name: 'mt_plan_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ plan: s.plan }),
    },
  ),
);

/** Human label for the feature that triggered the upgrade modal, if any. */
export function upgradeContextLabel(feature: ProFeature | null): string | null {
  return feature ? featureLabel(feature) : null;
}
