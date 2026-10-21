import { useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { formatDate } from '@/utils/helpers';
import type { Issue } from '@/types';

export type DueBucket = 'overdue' | 'due-soon';

export interface DueReminder {
  issue: Issue;
  bucket: DueBucket;
}

/** Individual notifications per scan before the rest collapse into one summary. */
const MAX_INDIVIDUAL = 5;
const LEDGER_KEY = 'm4ster-tracker-due-reminders';

/** A date key is `${projectId}:${issueId}:${dueDay}:${bucket}` — a new due date
 *  or an escalation (due-soon → overdue) reminds again, anything else doesn't. */
type ReminderLedger = Record<string, true>;

function reminderKey(projectId: string, issue: Issue, bucket: DueBucket): string {
  return `${projectId}:${issue.id}:${issue.dueDate!.slice(0, 10)}:${bucket}`;
}

/** Local YYYY-MM-DD for "now" (or an offset from it) — string compare keeps
 *  day math timezone-safe for plain date inputs. */
export function dayString(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Which reminder bucket an issue falls in, or null when it needs none. */
export function classifyDue(issue: Issue, now = new Date()): DueBucket | null {
  if (!issue.dueDate || issue.status === 'done' || issue.archived) return null;
  const due = issue.dueDate.slice(0, 10);
  const today = dayString(now);
  if (due < today) return 'overdue';
  const tomorrow = dayString(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  if (due <= tomorrow) return 'due-soon';
  return null;
}

/**
 * Pure core: which fresh reminders to fire, given what's already been sent.
 * Returns the reminders plus the updated ledger (caller persists it).
 */
export function collectDueReminders(
  issues: Issue[],
  ledger: ReminderLedger,
  projectId: string,
  now = new Date()
): { reminders: DueReminder[]; ledger: ReminderLedger } {
  const next: ReminderLedger = { ...ledger };
  const reminders: DueReminder[] = [];
  for (const issue of issues) {
    const bucket = classifyDue(issue, now);
    if (!bucket) continue;
    const key = reminderKey(projectId, issue, bucket);
    if (next[key]) continue;
    next[key] = true;
    reminders.push({ issue, bucket });
  }
  return { reminders, ledger: next };
}

/** Human-readable reminder text for one issue. */
export function dueBody(issue: Issue, bucket: DueBucket, now = new Date()): string {
  const due = issue.dueDate!.slice(0, 10);
  const when =
    bucket === 'overdue'
      ? `was due ${formatDate(`${due}T12:00:00`)}`
      : due === dayString(now)
        ? 'is due today'
        : 'is due tomorrow';
  return `"${issue.title}" ${when}.`;
}

function readLedger(): ReminderLedger {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as ReminderLedger) : {};
  } catch {
    return {};
  }
}

function writeLedger(ledger: ReminderLedger): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Storage unavailable — worst case a reminder repeats next session.
  }
}

/**
 * Fires a 'due' notification per overdue / due-soon issue the user hasn't
 * been reminded about yet, then records them so they never fire twice.
 * Re-runs whenever the project changes so newly set due dates get picked up.
 */
export function useDueReminders(): void {
  const project = useProjectStore((s) => s.project);
  const addNotification = useProjectStore((s) => s.addNotification);

  useEffect(() => {
    if (!project) return;
    const { reminders, ledger } = collectDueReminders(project.issues, readLedger(), project.id);
    writeLedger(ledger);
    if (reminders.length === 0) return;

    const individual = reminders.slice(0, MAX_INDIVIDUAL);
    for (const { issue, bucket } of individual) {
      addNotification({
        type: 'due',
        title: bucket === 'overdue' ? `Overdue: ${issue.key}` : `Due soon: ${issue.key}`,
        body: dueBody(issue, bucket),
        issueId: issue.id,
        issueKey: issue.key,
      });
    }
    const rest = reminders.length - individual.length;
    if (rest > 0) {
      addNotification({
        type: 'due',
        title: `${rest} more ${rest === 1 ? 'issue needs' : 'issues need'} attention`,
        body: reminders
          .slice(MAX_INDIVIDUAL)
          .map((r) => r.issue.key)
          .join(', '),
      });
    }
  }, [project, addNotification]);
}
