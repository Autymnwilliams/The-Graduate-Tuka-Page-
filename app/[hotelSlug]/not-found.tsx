export default function HotelNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Hotel not found</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        We couldn&rsquo;t find a Tuka page for this hotel. Please check with the front desk for the
        correct link.
      </p>
    </main>
  );
}
