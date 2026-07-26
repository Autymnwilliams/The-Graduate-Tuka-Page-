import type { Rec } from "@/lib/types";
import { categoryLabel } from "@/lib/categoryIcon";

export interface RecCardProps {
  rec: Rec;
  isSelected: boolean;
  onSelect: (id: string) => void;
  cardRef?: (el: HTMLElement | null) => void;
}

export function RecCard({ rec, isSelected, onSelect, cardRef }: RecCardProps) {
  return (
    <article
      ref={cardRef}
      onClick={() => onSelect(rec.id)}
      className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors ${
        isSelected
          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- per-hotel asset path, not a static import */}
      <img
        src={rec.photoUrl}
        alt={rec.name}
        className="h-20 w-20 shrink-0 rounded-xl bg-zinc-200 object-cover dark:bg-zinc-800"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display truncate text-lg text-zinc-900 dark:text-zinc-50">
            {rec.name}
          </h3>
          <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{rec.priceLevel}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-primary)]">
            {categoryLabel(rec.category)}
          </span>
          {rec.isFeatured && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Featured</span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {rec.shortDescription}
        </p>
      </div>
    </article>
  );
}
