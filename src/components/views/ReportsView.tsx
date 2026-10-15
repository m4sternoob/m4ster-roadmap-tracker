import { BarChart2, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import type { Project, Issue } from '@/types';

interface RepoStat {
  name: string;
  openPRs: number;
  merged: number;
}

/** Extract machine-readable stats embedded by the status-ingest API. */
function parseStatusStats(issue: Issue): RepoStat[] {
  const m = issue.description.match(/<!--status-stats:(.*?)-->/s);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed.repos)) return parsed.repos;
  } catch {
    /* ignore malformed stats */
  }
  return [];
}

/** Strip the embedded stats marker so it never renders as text. */
function cleanStatusDescription(issue: Issue): string {
  return issue.description.replace(/\n\n<!--status-stats:.*?-->/s, '').trim();
}

function StatusReportsSection({ issues }: { issues: Issue[] }) {
  const reports = issues
    .filter((i) => i.labels.includes('status-report') && !i.archived)
    .sort((a, b) => (b.dueDate || b.createdAt).localeCompare(a.dueDate || a.createdAt));
  if (reports.length === 0) return null;

  const [latest, ...older] = reports;
  const stats = parseStatusStats(latest);
  const maxVal = Math.max(1, ...stats.flatMap((s) => [s.openPRs, s.merged]));
  const barH = 26;
  const gap = 14;
  const labelW = 190;
  const chartH = stats.length * (barH + gap);

  return (
    <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border p-6">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Activity size={24} /> Repo Status Reports
      </h2>
      <p className="text-muted-foreground mb-6">
        8-hourly automated check — click any day on the Calendar tab for the full report.
      </p>

      {/* Latest report, big */}
      <div className="rounded-lg border dark:border-dark-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">{latest.title}</h3>
          <span className="text-sm text-muted-foreground font-mono">
            {(latest.dueDate || latest.createdAt).slice(0, 10)}
          </span>
        </div>

        {stats.length > 0 && (
          <div className="mb-5">
            <svg width="100%" height={chartH + 30} viewBox={`0 0 620 ${chartH + 30}`} className="w-full">
              {stats.map((s, i) => {
                const y = i * (barH + gap);
                const openW = (s.openPRs / maxVal) * (620 - labelW - 60);
                const mergedW = (s.merged / maxVal) * (620 - labelW - 60);
                return (
                  <g key={s.name}>
                    <text x={0} y={y + barH / 2 + 4} fontSize="12" fill="currentColor" opacity="0.8">
                      {s.name}
                    </text>
                    <rect x={labelW} y={y} width={Math.max(openW, 2)} height={barH / 2 - 2} rx={3} fill="#f59e0b" opacity="0.85">
                      <title>{s.openPRs} open PRs</title>
                    </rect>
                    <rect x={labelW} y={y + barH / 2 + 2} width={Math.max(mergedW, 2)} height={barH / 2 - 2} rx={3} fill="#22c55e" opacity="0.85">
                      <title>{s.merged} merged (24h)</title>
                    </rect>
                    <text x={labelW + Math.max(openW, mergedW) + 8} y={y + barH / 2 + 4} fontSize="11" fill="currentColor" opacity="0.6">
                      {s.openPRs} open · {s.merged} merged
                    </text>
                  </g>
                );
              })}
              <g fontSize="11" fill="currentColor" opacity="0.6">
                <rect x={labelW} y={chartH + 8} width={12} height={12} rx={3} fill="#f59e0b" />
                <text x={labelW + 18} y={chartH + 18}>Open PRs</text>
                <rect x={labelW + 110} y={chartH + 8} width={12} height={12} rx={3} fill="#22c55e" />
                <text x={labelW + 128} y={chartH + 18}>Merged (24h)</text>
              </g>
            </svg>
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm leading-relaxed">{cleanStatusDescription(latest)}</div>
      </div>

      {/* Older reports */}
      {older.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {older.length} older report{older.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-3 space-y-3">
            {older.map((r) => (
              <div key={r.id} className="rounded-lg border dark:border-dark-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {(r.dueDate || r.createdAt).slice(0, 10)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {cleanStatusDescription(r)}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
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

export function ReportsView({ project }: { project: Project }) {
  const activeSprints = project.sprints.filter(
    (s) => s.status === 'active' || s.status === 'completed'
  );

  if (activeSprints.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto p-4">
        <StatusReportsSection issues={project.issues} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
          <BarChart2 size={64} className="text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Sprints</h2>
          <p className="text-muted-foreground max-w-md">
            Create a sprint and add issues with story points to see burndown charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <StatusReportsSection issues={project.issues} />
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BarChart2 size={24} /> Sprint Burndown
        </h2>
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
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-lg">{s.startDate}</div>
                <div className="text-muted-foreground">Start</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-lg">
                  {elapsedDays} / {totalDays}
                </div>
                <div className="text-muted-foreground">Days Elapsed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-bold text-lg">{s.endDate}</div>
                <div className="text-muted-foreground">End</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
