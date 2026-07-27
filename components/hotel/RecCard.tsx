import Link from "next/link";
import type { RecWithStats } from "@/lib/types";
import { categoryLabel } from "@/lib/categoryIcon";
import { RecPhoto } from "./RecPhoto";
import { Stars } from "./Stars";

export interface RecCardProps {
  hotelSlug: string;
  rec: RecWithStats;
  isSelected: boolean;
  onSelect: (id: string) => void;
  cardRef?: (el: HTMLElement | null) => void;
}

export function RecCard({ hotelSlug, rec, isSelected, onSelect, cardRef }: RecCardProps) {
  return (
    <Link
      ref={cardRef}
      href={`/${hotelSlug}/recs/${rec.id}`}
      onClick={() => onSelect(rec.id)}
      className={`flex gap-3 rounded-2xl border p-3 transition-colors ${
        isSelected ? "border-[var(--tuka-ink)] bg-zinc-50" : "border-zinc-200 bg-white"
      }`}
    >
      <RecPhoto
        src={rec.photoUrls[0]}
        alt={rec.name}
        category={rec.category}
        className="h-20 w-20 shrink-0 rounded-xl bg-zinc-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg text-zinc-900">{rec.name}</h3>
          <span className="shrink-0 text-sm text-zinc-500">{rec.priceLevel}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-full bg-[var(--tuka-gold)] px-2 py-0.5 text-xs font-semibold tracking-wide text-[var(--tuka-ink)] uppercase">
            {categoryLabel(rec.category)}
          </span>
          {rec.isFeatured && <span className="text-xs font-medium text-amber-700">Featured</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{rec.shortDescription}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          {rec.stats.avgRating !== null && (
            <span className="flex items-center gap-1">
              <Stars rating={rec.stats.avgRating} /> {rec.stats.avgRating.toFixed(1)} (
              {rec.stats.reviewCount})
            </span>
          )}
          {rec.stats.likeCount > 0 && (
            <span className="flex items-center gap-1">
              <span aria-hidden>❤️</span> {rec.stats.likeCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
