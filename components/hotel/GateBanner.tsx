"use client";

export function GateBanner({
  lockedCount,
  onCtaClick,
  href,
}: {
  lockedCount: number;
  onCtaClick: () => void;
  href: string;
}) {
  if (lockedCount <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div aria-hidden className="grid grid-cols-3 gap-1 opacity-40 blur-[2px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-12 rounded bg-zinc-400 dark:bg-zinc-600" />
        ))}
      </div>
      <p className="font-medium text-zinc-800 dark:text-zinc-200">
        +{lockedCount} more pick{lockedCount === 1 ? "" : "s"} waiting for you
      </p>
      <a
        href={href}
        onClick={onCtaClick}
        className="rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-secondary)]"
      >
        Sign up to see them all
      </a>
    </div>
  );
}
