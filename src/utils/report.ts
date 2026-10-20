import type { Project } from '@/types';
import { STATUSES, PRIORITIES, ISSUE_TYPES } from '@/types';

/** Escape text for interpolation into generated HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface ReportStats {
  total: number;
  done: number;
  open: number;
  donePct: number;
  totalPoints: number;
  donePoints: number;
  overdue: { key: string; title: string; dueDate: string; assignee?: string }[];
  byStatus: { label: string; count: number }[];
  byPriority: { label: string; count: number }[];
  byType: { label: string; count: number }[];
  byAssignee: { name: string; total: number; done: number; open: number }[];
  epics: { name: string; color: string; total: number; done: number; pct: number }[];
  sprints: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    issues: number;
    doneIssues: number;
    points: number;
    donePoints: number;
    pct: number;
  }[];
}

export function computeReportStats(project: Project): ReportStats {
  const issues = project.issues.filter((i) => !i.archived);
  const total = issues.length;
  const doneIssues = issues.filter((i) => i.status === 'done');
  const done = doneIssues.length;
  const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const donePoints = doneIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = issues
    .filter((i) => i.status !== 'done' && i.dueDate && new Date(i.dueDate) < today)
    .map((i) => ({ key: i.key, title: i.title, dueDate: i.dueDate!, assignee: i.assignee }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const byStatus = STATUSES.map((s) => ({
    label: s.label,
    count: issues.filter((i) => i.status === s.value).length,
  }));
  const byPriority = PRIORITIES.map((p) => ({
    label: p.label,
    count: issues.filter((i) => i.priority === p.value).length,
  }));
  const byType = ISSUE_TYPES.map((t) => ({
    label: t.label,
    count: issues.filter((i) => i.type === t.value).length,
  }));

  const assigneeMap = new Map<string, { total: number; done: number }>();
  for (const i of issues) {
    const name = i.assignee || 'Unassigned';
    const cur = assigneeMap.get(name) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (i.status === 'done') cur.done += 1;
    assigneeMap.set(name, cur);
  }
  const byAssignee = [...assigneeMap.entries()]
    .map(([name, v]) => ({ name, total: v.total, done: v.done, open: v.total - v.done }))
    .sort((a, b) => b.total - a.total);

  const epics = project.epics.map((e) => {
    const list = issues.filter((i) => i.epicId === e.id);
    const d = list.filter((i) => i.status === 'done').length;
    return {
      name: e.name,
      color: e.color,
      total: list.length,
      done: d,
      pct: list.length ? Math.round((d / list.length) * 100) : 0,
    };
  });

  const sprints = project.sprints.map((s) => {
    const list = issues.filter((i) => s.issues.includes(i.id));
    const d = list.filter((i) => i.status === 'done');
    const pts = list.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const dPts = d.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    return {
      name: s.name,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      issues: list.length,
      doneIssues: d.length,
      points: pts,
      donePoints: dPts,
      pct: pts ? Math.round((dPts / pts) * 100) : list.length ? Math.round((d.length / list.length) * 100) : 0,
    };
  });

  return {
    total,
    done,
    open: total - done,
    donePct: total ? Math.round((done / total) * 100) : 0,
    totalPoints,
    donePoints,
    overdue,
    byStatus,
    byPriority,
    byType,
    byAssignee,
    epics,
    sprints,
  };
}

function bar(label: string, count: number, max: number, color: string): string {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return `<div class="bar-row"><span class="bar-label">${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="bar-count">${count}</span></div>`;
}

function progressRow(name: string, detail: string, pct: number, color: string): string {
  return `<div class="bar-row"><span class="bar-label">${esc(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="bar-count">${esc(detail)}</span></div>`;
}

/** Build a standalone HTML board report and download it as a file. */
export function downloadBoardReport(project: Project): void {
  const st = computeReportStats(project);
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const maxStatus = Math.max(1, ...st.byStatus.map((x) => x.count));
  const maxPriority = Math.max(1, ...st.byPriority.map((x) => x.count));
  const maxType = Math.max(1, ...st.byType.map((x) => x.count));

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(project.name)} — Board Report</title>
<style>
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0b0b12;color:#e8e8f0;margin:0;padding:32px}
  .wrap{max-width:880px;margin:0 auto}
  header{border-bottom:3px solid;border-image:linear-gradient(90deg,#ff2d78,#ff8c00,#ffee00,#00e676,#00ccff,#7c4dff) 1;padding-bottom:16px;margin-bottom:24px}
  h1{margin:0 0 4px;font-size:26px} .sub{color:#9a9ab0;font-size:13px}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .card{background:#15151f;border:1px solid #26263a;border-radius:12px;padding:16px}
  .card .num{font-size:28px;font-weight:700} .card .lbl{color:#9a9ab0;font-size:12px;margin-top:2px}
  h2{font-size:16px;margin:26px 0 10px}
  .panel{background:#15151f;border:1px solid #26263a;border-radius:12px;padding:16px 18px}
  .bar-row{display:flex;align-items:center;gap:10px;margin:7px 0}
  .bar-label{width:130px;font-size:13px;color:#c9c9da;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{flex:1;background:#23232f;border-radius:99px;height:10px;overflow:hidden}
  .bar-fill{height:100%;border-radius:99px}
  .bar-count{width:90px;text-align:right;font-size:13px;color:#c9c9da}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td,th{padding:7px 8px;border-bottom:1px solid #23232f;text-align:left}
  th{color:#9a9ab0;font-weight:600}
  .overdue{color:#ff6b6b}
  footer{color:#66667e;font-size:12px;margin-top:32px;text-align:center}
</style></head><body><div class="wrap">
<header><h1>${esc(project.name)} — Board Report</h1><div class="sub">Project ${esc(project.key)} · Generated ${esc(generated)} · M4ster Tracker</div></header>
<div class="cards">
  <div class="card"><div class="num">${st.total}</div><div class="lbl">Total issues</div></div>
  <div class="card"><div class="num">${st.donePct}%</div><div class="lbl">Complete (${st.done} done)</div></div>
  <div class="card"><div class="num">${st.donePoints}/${st.totalPoints}</div><div class="lbl">Story points done</div></div>
  <div class="card"><div class="num">${st.overdue.length}</div><div class="lbl">Overdue open issues</div></div>
</div>
<h2>By status</h2><div class="panel">${st.byStatus.map((x) => bar(x.label, x.count, maxStatus, '#7c4dff')).join('')}</div>
<h2>By priority</h2><div class="panel">${st.byPriority.map((x) => bar(x.label, x.count, maxPriority, '#ff8c00')).join('')}</div>
<h2>By type</h2><div class="panel">${st.byType.map((x) => bar(x.label, x.count, maxType, '#00ccff')).join('')}</div>
${st.epics.length ? `<h2>Epic progress</h2><div class="panel">${st.epics.map((e) => progressRow(e.name, `${e.done}/${e.total} · ${e.pct}%`, e.pct, e.color || '#36b37e')).join('')}</div>` : ''}
${st.sprints.length ? `<h2>Sprints</h2><div class="panel">${st.sprints.map((s) => progressRow(`${s.name} (${s.status})`, `${s.donePoints}/${s.points} pts · ${s.pct}%`, s.pct, '#36b37e')).join('')}</div>` : ''}
${st.byAssignee.length ? `<h2>Workload</h2><div class="panel"><table><tr><th>Person</th><th>Total</th><th>Done</th><th>Open</th></tr>${st.byAssignee.map((a) => `<tr><td>${esc(a.name)}</td><td>${a.total}</td><td>${a.done}</td><td>${a.open}</td></tr>`).join('')}</table></div>` : ''}
${st.overdue.length ? `<h2>Overdue</h2><div class="panel"><table><tr><th>Issue</th><th>Title</th><th>Due</th><th>Assignee</th></tr>${st.overdue.map((o) => `<tr><td>${esc(o.key)}</td><td>${esc(o.title)}</td><td class="overdue">${esc(o.dueDate)}</td><td>${esc(o.assignee || 'Unassigned')}</td></tr>`).join('')}</table></div>` : ''}
<footer>Generated by M4ster Tracker · ${esc(generated)}</footer>
</div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.key.toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
