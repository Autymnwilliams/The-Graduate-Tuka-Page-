"use client";

import type { PublicHotel, Rec } from "@/lib/types";
import { walkMinutes } from "@/lib/distance";
import { categoryLabel } from "@/lib/categoryIcon";

export interface RecDetailSheetProps {
  rec: Rec;
  hotel: PublicHotel;
  expanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}

export function RecDetailSheet({ rec, hotel, expanded, onClose, onToggleExpand }: RecDetailSheetProps) {
  const minutes = walkMinutes(hotel.coordinates, rec.coordinates);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${rec.coordinates.lat},${rec.coordinates.lng}`;

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 max-h-[85%] overflow-y-auto rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)] dark:bg-zinc-950 ${
        expanded ? "" : "cursor-pointer"
      }`}
      onClick={expanded ? undefined : onToggleExpand}
    >
      <div className="flex items-start justify-between gap-2 px-5 pt-4">
        <span className="rounded-full bg-[var(--brand-primary)]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--brand-primary)] uppercase">
          {categoryLabel(rec.category)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ×
        </button>
      </div>

      <div className="px-5 pt-2 pb-5">
        <h2 className="font-display text-3xl text-zinc-900 dark:text-zinc-50">{rec.name}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <span aria-hidden>📍</span>
          <span>{minutes} min walk from {hotel.name}</span>
        </div>

        {!expanded && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {rec.shortDescription}
          </p>
        )}

        {expanded && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {rec.priceLevel}
              </span>
              {rec.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-[var(--brand-secondary)]"
            >
              <span>
                <span className="block text-xs font-semibold tracking-wide opacity-80 uppercase">
                  From {hotel.name}
                </span>
                <span className="block text-sm">
                  {rec.address} <span className="underline">click for directions</span>
                </span>
              </span>
              <span className="ml-3 flex shrink-0 flex-col items-center">
                <span className="text-2xl font-bold leading-none">{minutes}</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase">min walk</span>
              </span>
            </a>

            {/* eslint-disable-next-line @next/next/no-img-element -- per-hotel asset path, not a static import */}
            <img
              src={rec.photoUrl}
              alt={rec.name}
              className="h-48 w-full rounded-xl bg-zinc-200 object-cover dark:bg-zinc-800"
            />

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Overview
              </h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{rec.shortDescription}</p>
            </div>

            {rec.staffNote && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-[var(--brand-secondary)]">
                  {(rec.staffName ?? "T").charAt(0)}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold">{rec.staffName ?? "Hotel staff"}:</span>{" "}
                  &ldquo;{rec.staffNote}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
