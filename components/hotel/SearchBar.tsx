export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search recs by name, category, or tag..."
        className="w-full rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="Search recommendations"
      />
    </div>
  );
}
