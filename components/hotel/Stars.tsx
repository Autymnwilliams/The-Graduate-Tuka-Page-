export function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`${size} tracking-tight text-[var(--tuka-gold)]`} aria-hidden>
      {"★".repeat(rounded)}
      <span className="text-zinc-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
