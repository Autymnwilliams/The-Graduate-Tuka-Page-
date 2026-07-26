export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Tuka Hotel Pilot
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        This site is reached via a hotel-specific link, e.g.{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
          /orrington
        </code>
        .
      </p>
    </main>
  );
}
