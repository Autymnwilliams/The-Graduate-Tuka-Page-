export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Tuka Hotel Pilot</h1>
      <p className="max-w-md text-zinc-600">
        This site is reached via a hotel-specific link, e.g.{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm">/orrington</code>.
      </p>
    </main>
  );
}
