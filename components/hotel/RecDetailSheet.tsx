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
      className={`absolute inset-x-0 bottom-0 z-30 max-h-[85%] overflow-y-auto rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)] ${
        expanded ? "" : "cursor-pointer"
      }`}
      onClick={expanded ? undefined : onToggleExpand}
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
          <span>{minutes} min walk from {hotel.name}</span>
        </div>

        {!expanded && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{rec.shortDescription}</p>
        )}

        {expanded && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
                {rec.priceLevel}
              </span>
              {rec.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900"
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
              className="flex items-center justify-between rounded-xl bg-[var(--tuka-ink)] px-4 py-3 text-white"
            >
              <span>
                <span className="block text-xs font-semibold tracking-wide text-[var(--tuka-gold)] uppercase">
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
              className="h-48 w-full rounded-xl bg-zinc-200 object-cover"
            />

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Overview
              </h3>
              <p className="mt-1 text-sm text-zinc-700">{rec.shortDescription}</p>
            </div>

            {rec.staffNote && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tuka-ink)] text-sm font-semibold text-white">
                  {(rec.staffName ?? "T").charAt(0)}
                </div>
                <p className="text-sm text-zinc-700">
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
