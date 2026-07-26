function LockedRecSkeleton() {
  return (
    <div aria-hidden className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 blur-[3px]">
      <div className="h-20 w-20 shrink-0 rounded-lg bg-zinc-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 rounded bg-zinc-200" />
        <div className="h-3 w-1/3 rounded-full bg-zinc-200" />
        <div className="h-3 w-full rounded bg-zinc-200" />
      </div>
    </div>
  );
}

export function GateBanner({ lockedCount, href }: { lockedCount: number; href: string }) {
  if (lockedCount <= 0) return null;

  const skeletonCount = Math.min(lockedCount, 3);

  return (
    <div className="relative flex flex-col gap-3">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <LockedRecSkeleton key={i} />
      ))}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <p className="font-medium text-zinc-800">
          +{lockedCount} more pick{lockedCount === 1 ? "" : "s"} waiting for you
        </p>
        <a
          href={href}
          className="rounded-full bg-[var(--tuka-ink)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Sign up to see them all
        </a>
      </div>
    </div>
  );
}
