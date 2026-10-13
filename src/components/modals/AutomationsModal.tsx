import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { ModalShell, ModalHeader } from '@/components/ui/ModalShell';
import { useProjectStore } from '@/store/projectStore';
import { PRIORITIES, STATUSES } from '@/types';
import type { AutomationAction, AutomationTrigger } from '@/types';

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'issue_created', label: 'Issue created' },
  { value: 'status_changed', label: 'Status changes to…' },
  { value: 'priority_changed', label: 'Priority changes to…' },
  { value: 'assigned', label: 'Issue assigned' },
];

const ACTIONS: { value: AutomationAction; label: string }[] = [
  { value: 'set_status', label: 'Set status to…' },
  { value: 'set_priority', label: 'Set priority to…' },
  { value: 'assign', label: 'Assign to…' },
  { value: 'add_label', label: 'Add label…' },
  { value: 'notify', label: 'Send notification…' },
];

const TRIGGER_LABEL: Record<AutomationTrigger, string> = {
  issue_created: 'When an issue is created',
  status_changed: 'When status becomes',
  priority_changed: 'When priority becomes',
  assigned: 'When an issue is assigned',
};

const ACTION_LABEL: Record<AutomationAction, string> = {
  set_status: 'set status',
  set_priority: 'set priority',
  assign: 'assign to',
  add_label: 'add label',
  notify: 'notify',
};

export function AutomationsModal({ onClose }: { onClose: () => void }) {
  const rules = useProjectStore((s) => s.automationRules);
  const addAutomationRule = useProjectStore((s) => s.addAutomationRule);
  const toggleAutomationRule = useProjectStore((s) => s.toggleAutomationRule);
  const deleteAutomationRule = useProjectStore((s) => s.deleteAutomationRule);

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('status_changed');
  const [triggerValue, setTriggerValue] = useState('done');
  const [action, setAction] = useState<AutomationAction>('assign');
  const [actionValue, setActionValue] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);

  const needsTriggerValue = trigger === 'status_changed' || trigger === 'priority_changed';

  const save = () => {
    if (!actionValue.trim()) return;
    addAutomationRule({
      name: name.trim() || `${TRIGGER_LABEL[trigger]} → ${ACTION_LABEL[action]} ${actionValue}`,
      enabled: true,
      trigger,
      triggerValue: needsTriggerValue ? triggerValue : undefined,
      action,
      actionValue: actionValue.trim(),
    });
    setName('');
    setActionValue('');
    setShowBuilder(false);
  };

  const inputCls =
    'w-full px-2.5 py-1.5 rounded-md border border-[var(--bg-raised)] bg-[var(--bg-sunken)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]';

  return (
    <ModalShell
      onClose={onClose}
      label="Automations"
      panel="max-w-lg w-full rounded-xl border border-white/10 bg-[var(--bg-deep)] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title="Automations"
        onClose={onClose}
        icon={<Zap size={20} className="text-slate-400" />}
      />
      <div className="px-5 py-4 space-y-3">
        <p className="text-[12.5px] text-slate-400">
          Rules run automatically when issues change. They never trigger each other.
        </p>

        {rules.length === 0 && !showBuilder && (
          <p className="text-[13px] text-slate-500 py-4 text-center">
            No rules yet. e.g. "when status becomes done → assign to QA".
          </p>
        )}

        {rules.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] ${
              r.enabled ? '' : 'opacity-50'
            }`}
          >
            <button
              role="switch"
              aria-checked={r.enabled}
              aria-label={`Toggle ${r.name}`}
              onClick={() => toggleAutomationRule(r.id)}
              className={`w-9 h-5 rounded-full shrink-0 transition-colors motion-press ${
                r.enabled ? 'bg-[var(--accent)]' : 'bg-white/10'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  r.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium text-slate-200 truncate">{r.name}</div>
              <div className="text-[12px] text-slate-500">
                {TRIGGER_LABEL[r.trigger]}
                {r.triggerValue ? ` ${r.triggerValue}` : ''} → {ACTION_LABEL[r.action]}{' '}
                {r.actionValue}
              </div>
            </div>
            <button
              onClick={() => deleteAutomationRule(r.id)}
              className="p-1.5 rounded-md text-slate-500 hover:text-[var(--danger)] motion-press"
              aria-label={`Delete ${r.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {showBuilder ? (
          <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3.5 space-y-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rule name (optional)"
              className={inputCls}
              aria-label="Rule name"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11.5px] text-slate-500">When</span>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
                  className={`${inputCls} mt-1 cursor-pointer`}
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11.5px] text-slate-500">Then</span>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as AutomationAction)}
                  className={`${inputCls} mt-1 cursor-pointer`}
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {needsTriggerValue && (
              <label className="block">
                <span className="text-[11.5px] text-slate-500">
                  {trigger === 'status_changed' ? 'New status' : 'New priority'}
                </span>
                <select
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  className={`${inputCls} mt-1 cursor-pointer`}
                >
                  {(trigger === 'status_changed' ? STATUSES : PRIORITIES).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="text-[11.5px] text-slate-500">
                {action === 'set_status'
                  ? 'Status'
                  : action === 'set_priority'
                    ? 'Priority'
                    : action === 'assign'
                      ? 'Assignee name'
                      : action === 'add_label'
                        ? 'Label'
                        : 'Notification text'}
              </span>
              {action === 'set_status' || action === 'set_priority' ? (
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className={`${inputCls} mt-1 cursor-pointer`}
                >
                  <option value="">Choose…</option>
                  {(action === 'set_status' ? STATUSES : PRIORITIES).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder={
                    action === 'assign' ? 'e.g. Master Noob' : action === 'add_label' ? 'e.g. qa' : 'e.g. Needs QA review'
                  }
                  className={`${inputCls} mt-1`}
                />
              )}
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowBuilder(false)}
                className="px-3 py-1.5 rounded-md text-[13px] text-slate-400 hover:text-slate-200 motion-press"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!actionValue.trim()}
                className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--accent)] text-white disabled:opacity-40 motion-press"
              >
                Save rule
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/15 text-[13px] text-slate-300 hover:border-[var(--accent)]/50 hover:text-white w-full justify-center motion-press"
          >
            <Plus size={15} /> New rule
          </button>
        )}
      </div>
    </ModalShell>
  );
}
