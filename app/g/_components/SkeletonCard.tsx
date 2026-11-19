// app/g/_components/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col justify-between min-h-[160px]">
      <div>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-ink/10"></div>
            <div className="h-3 w-32 rounded bg-ink/5"></div>
          </div>
          <div className="h-6 w-16 rounded-full bg-ink/10"></div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-4 w-12 rounded bg-ink/5"></div>
          <div className="h-4 w-12 rounded bg-ink/5"></div>
        </div>
      </div>
      <div className="mt-4 h-9 w-full rounded-lg bg-ink/5"></div>
    </div>
  );
}