export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center rounded-full bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm">
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are you looking for?"
        className="w-full bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-500"
        aria-label="Search recommendations"
      />
      <span aria-hidden className="text-zinc-400">
        🔍
      </span>
    </div>
  );
}
