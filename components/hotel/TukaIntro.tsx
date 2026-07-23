export function TukaIntro({ welcomeMessage }: { welcomeMessage: string }) {
  return (
    <div className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Tuka is a local recommendations app — think of this page as a free preview from your hotel.
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{welcomeMessage}</p>
    </div>
  );
}
