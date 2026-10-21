import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileSpreadsheet,
  FileJson,
  Mountain,
} from 'lucide-react';
import type { Project, Status } from '@/types';
import { STATUSES } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { computeReportStats, downloadBoardReport } from '@/utils/report';
import { getEpicProgress } from '@/utils/helpers';

/** Status colors — same palette the Search modal and Workload view use. */
const STATUS_COLORS: Record<Status, string> = {
  backlog: '#64748b',
  todo: '#0ea5e9',
  'in-progress': '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
};

/** "Oct 5" — treats YYYY-MM-DD as a calendar day (no UTC-midnight shift). */
function formatShortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSprintBurndownData(project: Project, sprintId: string) {
  const sprint = project.sprints.find((s) => s.id === sprintId);
  if (!sprint || sprint.status === 'planning') return null;

  const sprintIssues = project.issues.filter((i) => sprint.issues.includes(i.id));
  const totalPoints = sprintIssues.reduce((sum, i) => sum + i.storyPoints, 0);
  if (totalPoints === 0) return null;

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const today = new Date();
  const elapsedDays = Math.max(
    0,
    Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  );

  // Ideal burndown line
  const ideal = Array.from({ length: totalDays + 1 }, (_, i) => ({
    day: i,
    points: Math.round(totalPoints * (1 - i / totalDays)),
  }));

  // Actual burndown - based on done issues
  const donePoints = sprintIssues
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + i.storyPoints, 0);
  const actual = Array.from({ length: elapsedDays + 1 }, (_, i) => ({
    day: i,
    points: Math.round(totalPoints - donePoints * (i / Math.max(1, elapsedDays))),
  }));

  return { ideal, actual, totalPoints, donePoints, totalDays, elapsedDays, sprint };
}

function ReportsHeader({ project }: { project: Project }) {
  const exportCSV = useProjectStore((s) => s.exportCSV);
  const exportProject = useProjectStore((s) => s.exportProject);
  const pushToast = useProjectStore((s) => s.pushToast);
  const stats = computeReportStats(project);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-52">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <BarChart2 size={24} /> Reports
          </h2>
          <p className="text-muted-foreground text-sm">
            Board health at a glance — download a full report to share with your team.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              downloadBoardReport(project);
              pushToast('success', 'Report downloaded');
            }}
            data-cursor="download"
            data-magnet
            className="h-9 px-4 rounded-full bg-[var(--accent)] text-white text-[13px] font-medium flex items-center gap-1.5 btn-artcraft shadow-sm"
          >
            <Download size={15} /> Download Report
          </button>
          <button
            onClick={() => exportCSV()}
            data-cursor="download"
            className="h-9 px-3.5 rounded-full border border-[var(--bg-raised)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 motion-interactive"
            title="Download all issues as CSV"
          >
            <FileSpreadsheet size={15} /> CSV
          </button>
          <button
            onClick={() => exportProject()}
            data-cursor="download"
            className="h-9 px-3.5 rounded-full border border-[var(--bg-raised)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 motion-interactive"
            title="Download a JSON backup of the whole board"
          >
            <FileJson size={15} /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { num: String(stats.total), lbl: 'Total issues' },
          { num: `${stats.donePct}%`, lbl: `Complete · ${stats.done} done` },
          { num: `${stats.donePoints}/${stats.totalPoints}`, lbl: 'Story points done' },
          { num: String(stats.overdue.length), lbl: 'Overdue open issues' },
        ].map((c) => (
          <div
            key={c.lbl}
            className="rounded-xl border border-[var(--bg-raised)] bg-[var(--bg-surface)] px-4 py-3"
          >
            <div className="text-[22px] font-bold leading-tight">{c.num}</div>
            <div className="text-[12px] text-muted-foreground">{c.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EpicProgressSection({ project }: { project: Project }) {
  const epicIssues = project.issues.filter((i) => i.epicId);
  const totalDone = epicIssues.filter((i) => i.status === 'done').length;
  const totalPoints = epicIssues.reduce((sum, i) => sum + i.storyPoints, 0);
  const donePoints = epicIssues
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + i.storyPoints, 0);
  const overall = epicIssues.length > 0 ? Math.round((totalDone / epicIssues.length) * 100) : 0;

  const stats = [
    { value: String(epicIssues.length), label: 'Issues in Epics' },
    { value: String(totalDone), label: 'Completed' },
    { value: `${overall}%`, label: 'Overall Complete' },
    { value: `${donePoints} / ${totalPoints}`, label: 'Story Points' },
  ];

  return (
    <div>
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <Mountain size={20} /> Epic Progress
      </h3>
      <p className="text-muted-foreground mb-6">
        How much of each epic is done — by issues and by story points.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="font-bold text-lg">{s.value}</div>
            <div className="text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {project.epics.map((epic) => {
          const p = getEpicProgress(project, epic.id);

          return (
            <div
              key={epic.id}
              className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border p-6"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: epic.color }}
                  />
                  <h3 className="font-semibold truncate">{epic.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{epic.key}</span>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {p.doneIssues} / {p.totalIssues} issues
                </span>
              </div>

              {p.totalIssues === 0 ? (
                <p className="text-sm text-muted-foreground">No issues linked to this epic yet.</p>
              ) : (
                <>
                  <div
                    className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2"
                    role="progressbar"
                    aria-valuenow={p.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${epic.name} completion`}
                  >
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${p.percentComplete}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="font-semibold">{p.percentComplete}% complete</span>
                    <span className="text-muted-foreground">
                      {p.donePoints} / {p.totalPoints} pts
                    </span>
                  </div>

                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {STATUSES.map((s) => {
                      const count = p.statusBreakdown[s.value];
                      if (count === 0) return null;
                      return (
                        <div
                          key={s.value}
                          title={`${s.label}: ${count}`}
                          className="h-full"
                          style={{
                            width: `${(count / p.totalIssues) * 100}%`,
                            backgroundColor: STATUS_COLORS[s.value],
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {STATUSES.map((s) => {
                      const count = p.statusBreakdown[s.value];
                      if (count === 0) return null;
                      return (
                        <span key={s.value} className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[s.value] }}
                          />
                          {s.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportsView({ project }: { project: Project }) {
  const activeSprints = project.sprints.filter(
    (s) => s.status === 'active' || s.status === 'completed'
  );
  const hasEpics = project.epics.length > 0;

  if (activeSprints.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto p-4">
        <ReportsHeader project={project} />
        {hasEpics && <EpicProgressSection project={project} />}
        <div className="flex flex-col items-center justify-center text-center py-14">
          <BarChart2 size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Sprints</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Create a sprint and add issues with story points to see burndown charts. The board
            summary and report download above work any time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <ReportsHeader project={project} />
      {hasEpics && <EpicProgressSection project={project} />}
      <div>
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <BarChart2 size={20} /> Sprint Burndown
        </h3>
        <p className="text-muted-foreground">
          Track sprint progress. Ideal line = planned pace. Actual line = real progress.
        </p>
      </div>

      {activeSprints.map((sprint) => {
        const data = getSprintBurndownData(project, sprint.id);
        if (!data) return null;

        const { ideal, actual, totalPoints, donePoints, totalDays, elapsedDays, sprint: s } = data;
        const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
        const isComplete = s.status === 'completed' || progress >= 100;
        const isBehind =
          actual.length > 1 && actual[actual.length - 1].points > ideal[actual.length - 1].points;

        // Simple SVG chart
        const chartWidth = 600;
        const chartHeight = 300;
        const padding = 40;
        const xScale = (chartWidth - 2 * padding) / totalDays;
        const yScale = (chartHeight - 2 * padding) / totalPoints;

        const idealPath = ideal
          .map((p, i) => `${padding + i * xScale},${padding + p.points * yScale}`)
          .join(' ');
        const actualPath = actual
          .map((p, i) => `${padding + i * xScale},${padding + p.points * yScale}`)
          .join(' ');

        return (
          <div
            key={s.id}
            className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.goal}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span
                  className={`flex items-center gap-1.5 ${isComplete ? 'text-green-500' : isBehind ? 'text-red-500' : 'text-amber-500'}`}
                >
                  {isComplete ? (
                    <TrendingUp size={16} />
                  ) : isBehind ? (
                    <TrendingDown size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                  {isComplete ? 'Complete' : isBehind ? 'Behind' : 'On Track'}
                </span>
                <span className="font-mono text-lg font-bold">{progress}%</span>
                <span className="text-muted-foreground">
                  {donePoints} / {totalPoints} pts
                </span>
              </div>
            </div>

            <div className="relative h-80">
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full"
              >
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      opacity="0.1"
                    />
                  </pattern>
                </defs>
                <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

                {/* Axes */}
                <line
                  x1={padding}
                  y1={padding}
                  x2={padding}
                  y2={chartHeight - padding}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity="0.3"
                />
                <line
                  x1={padding}
                  y1={chartHeight - padding}
                  x2={chartWidth - padding}
                  y2={chartHeight - padding}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity="0.3"
                />

                {/* Y-axis labels */}
                {[0, totalPoints / 2, totalPoints].map((val) => (
                  <text
                    key={val}
                    x={padding - 10}
                    y={chartHeight - padding - val * yScale}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="11"
                    fill="currentColor"
                    opacity="0.6"
                  >
                    {Math.round(val)}
                  </text>
                ))}

                {/* X-axis labels */}
                {Array.from({ length: totalDays + 1 }, (_, i) => i).map((day) => {
                  const dayLabel = day === 0 ? 'Start' : day === totalDays ? 'End' : 'D' + day;
                  return (
                    <text
                      key={day}
                      x={padding + day * xScale}
                      y={chartHeight - padding + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="currentColor"
                      opacity="0.6"
                    >
                      {dayLabel}
                    </text>
                  );
                })}

                {/* Ideal line */}
                <polyline
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  points={idealPath}
                  opacity={0.7}
                />
                <text
                  x={chartWidth - padding - 60}
                  y={padding + 20}
                  fontSize="11"
                  fill="#0ea5e9"
                  opacity={0.7}
                >
                  Ideal
                </text>

                {/* Actual line */}
                <polyline
                  fill="none"
                  stroke={isBehind ? '#ef4444' : isComplete ? '#22c55e' : '#f59e0b'}
                  strokeWidth={3}
                  points={actualPath}
                />
                <text
                  x={chartWidth - padding - 60}
                  y={padding + 40}
                  fontSize="11"
                  fill={isBehind ? '#ef4444' : isComplete ? '#22c55e' : '#f59e0b'}
                >
                  Actual
                </text>

                {/* Today marker */}
                {elapsedDays > 0 && elapsedDays < totalDays && (
                  <line
                    x1={padding + elapsedDays * xScale}
                    y1={padding}
                    x2={padding + elapsedDays * xScale}
                    y2={chartHeight - padding}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    opacity="0.5"
                  >
                    <title>Today</title>
                  </line>
                )}
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 min-w-0">
                <div className="font-bold text-lg truncate">{formatShortDate(s.startDate)}</div>
                <div className="text-muted-foreground">Start</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-lg">
                  {elapsedDays} / {totalDays}
                </div>
                <div className="text-muted-foreground">Days Elapsed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 min-w-0">
                <div className="font-bold text-lg truncate">{formatShortDate(s.endDate)}</div>
                <div className="text-muted-foreground">End</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
