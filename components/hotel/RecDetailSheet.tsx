"use client";

import { useRouter } from "next/navigation";
import type { PublicHotel, RecWithStats } from "@/lib/types";
import { walkMinutes } from "@/lib/distance";
import { categoryLabel } from "@/lib/categoryIcon";

export interface RecDetailSheetProps {
  rec: RecWithStats;
  hotel: PublicHotel;
  onClose: () => void;
}

/** Compact peek shown over the map when a pin is tapped; tapping it opens the full rec page. */
export function RecDetailSheet({ rec, hotel, onClose }: RecDetailSheetProps) {
  const router = useRouter();
  const minutes = walkMinutes(hotel.coordinates, rec.coordinates);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 max-h-[85%] cursor-pointer overflow-y-auto rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
      onClick={() => router.push(`/${hotel.slug}/recs/${rec.id}`)}
    >
      <div className="flex items-start justify-between gap-2 px-5 pt-4">
        <span className="rounded-full bg-[var(--tuka-gold)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--tuka-ink)] uppercase">
          {categoryLabel(rec.category)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-zinc-400 hover:bg-zinc-100"
        >
          ×
        </button>
      </div>

      <div className="px-5 pt-2 pb-5">
        <h2 className="text-3xl text-zinc-900">{rec.name}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
          <span aria-hidden>📍</span>
          <span>
            {minutes} min walk from {hotel.name}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{rec.shortDescription}</p>
      </div>
    </div>
  );
}
