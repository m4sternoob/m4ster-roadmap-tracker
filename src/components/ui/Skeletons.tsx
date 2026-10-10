/** Content-shaped loading placeholders. Pulse is opacity-only and the
 *  global reduced-motion guard kills it for users who ask for calm. */

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-[#2c333a] animate-pulse ${className}`} aria-hidden="true" />;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[#2c333a] bg-[#22272b] px-3 py-2.5 space-y-2">
      <Bar className="h-3.5 w-4/5" />
      <Bar className="h-3 w-3/5" />
      <div className="flex items-center gap-2 pt-1">
        <Bar className="h-4 w-4 rounded-full" />
        <Bar className="h-3 w-16" />
        <div className="flex-1" />
        <Bar className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonColumn() {
  return (
    <div className="w-[270px] min-w-[270px] rounded-xl bg-[#1d2125] p-2 space-y-2">
      <div className="flex items-center gap-2 px-1 py-1">
        <Bar className="h-3 w-20" />
        <Bar className="h-3 w-6" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function AppSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-[#1d2125] overflow-hidden" aria-label="Loading">
      {/* TopBar shape */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-3 border-b border-[#2c333a]">
        <Bar className="h-7 w-7 rounded-[6px]" />
        <Bar className="h-8 w-full max-w-2xl mx-auto rounded-md" />
        <Bar className="h-8 w-20 rounded-md" />
      </div>
      <div className="flex flex-1 min-h-0">
        {/* SideNav shape */}
        <div className="hidden md:flex flex-col gap-2 w-56 shrink-0 border-r border-[#2c333a] p-3">
          <Bar className="h-4 w-24 mb-1" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-7 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Project header shape */}
          <div className="px-5 pt-3 pb-2 flex items-center gap-3 border-b border-[#2c333a]">
            <Bar className="h-6 w-6 rounded-md" />
            <Bar className="h-4 w-48" />
            <div className="flex gap-2 ml-4">
              <Bar className="h-6 w-16 rounded-md" />
              <Bar className="h-6 w-16 rounded-md" />
              <Bar className="h-6 w-16 rounded-md" />
            </div>
          </div>
          {/* Board shape */}
          <div className="flex-1 min-h-0 overflow-hidden px-5 py-4">
            <div className="flex gap-2 items-start">
              <SkeletonColumn />
              <SkeletonColumn />
              <SkeletonColumn />
              <SkeletonColumn />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
