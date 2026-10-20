import { BarChart2, TrendingUp, TrendingDown, Minus, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import type { Project } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { computeReportStats, downloadBoardReport } from '@/utils/report';

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

export function ReportsView({ project }: { project: Project }) {
  const activeSprints = project.sprints.filter(
    (s) => s.status === 'active' || s.status === 'completed'
  );

  if (activeSprints.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto p-4">
        <ReportsHeader project={project} />
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
