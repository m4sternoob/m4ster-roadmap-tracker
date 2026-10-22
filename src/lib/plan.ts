/**
 * Plan & feature gating for the Free / Pro tiers.
 *
 * Free is the trial: Board + List views, 2 themes, JSON export/import,
 * cloud sync, unlimited issues on one board.
 * Pro ($20/year) unlocks everything else.
 *
 * Gating is enforced only when VITE_PLAN_ENFORCEMENT=true (the experimental
 * preview). Production builds without the flag keep every feature open.
 */

export type Plan = 'free' | 'pro';

export const PRO_PRICE = '$20/year';

/** True on builds where the Free/Pro split is enforced (test preview). */
export function isEnforced(): boolean {
  let fromImportMeta: string | undefined;
  try {
    fromImportMeta = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    ).env?.VITE_PLAN_ENFORCEMENT;
  } catch {
    fromImportMeta = undefined;
  }
  const fromProcess =
    typeof process !== 'undefined'
      ? process.env?.VITE_PLAN_ENFORCEMENT
      : undefined;
  return (fromImportMeta ?? fromProcess) === 'true';
}

/** Snapshot for render-time use in components. */
export const PLAN_ENFORCEMENT = isEnforced();

/** Themes included in the Free trial. Everything else is Pro. */
export const FREE_THEMES = ['midnight', 'porcelain'] as const;

/** Features that require Pro. Anything not listed here is free. */
export type ProFeature =
  | 'view:backlog'
  | 'view:calendar'
  | 'view:timeline'
  | 'view:workload'
  | 'view:sprints'
  | 'view:reports'
  | 'view:archived'
  | 'automations'
  | 'theme:extra'
  | 'theme:aura'
  | 'theme:profiles'
  | 'theme:custom'
  | 'export:csv'
  | 'project:extra'
  | 'ai';

const FEATURE_LABELS: Record<ProFeature, string> = {
  'view:backlog': 'Backlog view',
  'view:calendar': 'Calendar view',
  'view:timeline': 'Timeline view',
  'view:workload': 'Workload view',
  'view:sprints': 'Sprints view',
  'view:reports': 'Reports view',
  'view:archived': 'Archived view',
  automations: 'Automations',
  'theme:extra': 'Extra themes',
  'theme:aura': 'Background aura',
  'theme:profiles': 'Theme profiles',
  'theme:custom': 'Custom themes',
  'export:csv': 'CSV export',
  'project:extra': 'Extra projects',
  ai: 'AI features',
};

export function featureLabel(feature: ProFeature): string {
  return FEATURE_LABELS[feature];
}

/**
 * Whether `plan` may use `feature`.
 * With enforcement off (production), everything is allowed.
 */
export function canUse(plan: Plan, _feature: ProFeature): boolean {
  if (!isEnforced()) return true;
  return plan === 'pro';
}

/** Whether the theme id is included in the Free trial. */
export function isFreeTheme(themeId: string): boolean {
  if (!isEnforced()) return true;
  return (FREE_THEMES as readonly string[]).includes(themeId);
}

export const PRO_FEATURE_LIST: string[] = [
  'Unlimited boards & projects',
  'All views: Backlog, Calendar, Timeline, Sprints, Reports, Workload',
  'Automations engine',
  'All 10 themes + background aura',
  'Theme profiles & custom theme builder',
  'CSV export',
];
