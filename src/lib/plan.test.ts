import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProFeature } from './plan';

type PlanModule = typeof import('./plan');

async function loadPlan(enforced: boolean): Promise<PlanModule> {
  vi.resetModules();
  vi.stubEnv('VITE_PLAN_ENFORCEMENT', enforced ? 'true' : 'false');
  return (await import('./plan')) as PlanModule;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('plan gating', () => {
  it('allows everything when enforcement is off (production)', async () => {
    const plan = await loadPlan(false);
    expect(plan.canUse('free', 'view:calendar')).toBe(true);
    expect(plan.canUse('free', 'automations')).toBe(true);
    expect(plan.canUse('free', 'theme:custom')).toBe(true);
    expect(plan.isFreeTheme('violet')).toBe(true);
  });

  it('locks pro features for free plan when enforced', async () => {
    const plan = await loadPlan(true);
    expect(plan.canUse('free', 'view:calendar')).toBe(false);
    expect(plan.canUse('free', 'view:backlog')).toBe(false);
    expect(plan.canUse('free', 'automations')).toBe(false);
    expect(plan.canUse('free', 'theme:extra')).toBe(false);
    expect(plan.canUse('free', 'theme:aura')).toBe(false);
    expect(plan.canUse('free', 'theme:profiles')).toBe(false);
    expect(plan.canUse('free', 'theme:custom')).toBe(false);
    expect(plan.canUse('free', 'export:csv')).toBe(false);
  });

  it('unlocks everything for pro plan when enforced', async () => {
    const plan = await loadPlan(true);
    expect(plan.canUse('pro', 'view:calendar')).toBe(true);
    expect(plan.canUse('pro', 'automations')).toBe(true);
    expect(plan.canUse('pro', 'theme:custom')).toBe(true);
    expect(plan.canUse('pro', 'export:csv')).toBe(true);
  });

  it('free trial includes exactly Midnight and Porcelain themes', async () => {
    const plan = await loadPlan(true);
    expect(plan.isFreeTheme('midnight')).toBe(true);
    expect(plan.isFreeTheme('porcelain')).toBe(true);
    expect(plan.isFreeTheme('ocean')).toBe(false);
    expect(plan.isFreeTheme('ember')).toBe(false);
    expect(plan.isFreeTheme('forest')).toBe(false);
    expect(plan.isFreeTheme('violet')).toBe(false);
  });

  it('labels every pro feature for the upgrade modal', async () => {
    const plan = await loadPlan(true);
    const features: ProFeature[] = [
      'view:backlog',
      'view:calendar',
      'view:timeline',
      'view:workload',
      'view:sprints',
      'view:reports',
      'view:archived',
      'automations',
      'theme:extra',
      'theme:aura',
      'theme:profiles',
      'theme:custom',
      'export:csv',
      'project:extra',
      'ai',
    ];
    for (const f of features) {
      expect(plan.featureLabel(f).length).toBeGreaterThan(0);
    }
  });
});
