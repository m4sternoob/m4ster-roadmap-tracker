import { BarChart2, TrendingUp, TrendingDown, Minus, Mountain } from 'lucide-react';
import type { Project } from '@/types';
import { STATUSES } from '@/types';
import { getColorForStatus, getEpicProgress } from '@/utils/helpers';

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
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Mountain size={24} /> Epic Progress
      </h2>
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
                            backgroundColor: getColorForStatus(s.value),
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
                            style={{ backgroundColor: getColorForStatus(s.value) }}
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

  if (activeSprints.length === 0 && !hasEpics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <BarChart2 size={64} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Reports Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Create an epic or a sprint and add issues with story points to see progress reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      {hasEpics && <EpicProgressSection project={project} />}

      {activeSprints.length > 0 && (
        <>
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

            const {
              ideal,
              actual,
              totalPoints,
              donePoints,
              totalDays,
              elapsedDays,
              sprint: s,
            } = data;
            const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
            const isComplete = s.status === 'completed' || progress >= 100;
            const isBehind =
              actual.length > 1 &&
              actual[actual.length - 1].points > ideal[actual.length - 1].points;

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
        </>
      )}
    </div>
  );
}
