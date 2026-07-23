"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicHotel, Rec } from "@/lib/types";
import { track } from "@/lib/analytics-client";
import { SearchBar } from "./SearchBar";
import { MapSection } from "./MapSection";
import { RecCard } from "./RecCard";
import { GateBanner } from "./GateBanner";

function matchesQuery(rec: Rec, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    rec.name.toLowerCase().includes(q) ||
    rec.category.toLowerCase().includes(q) ||
    rec.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

export function HotelExperience({ hotel }: { hotel: PublicHotel }) {
  const [query, setQuery] = useState("");
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  const filteredRecs = useMemo(
    () => hotel.visibleRecs.filter((rec) => matchesQuery(rec, query)),
    [hotel.visibleRecs, query],
  );

  useEffect(() => {
    if (hotel.lockedCount > 0) {
      track("gate_hit", hotel.slug, { lockedCount: hotel.lockedCount });
    }
    // Fire once per page load, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      track("search_used", hotel.slug, { query, resultCount: filteredRecs.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [query, filteredRecs.length, hotel.slug]);

  function selectRec(id: string) {
    setSelectedRecId(id);
    cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleCardSelect(id: string) {
    track("rec_click", hotel.slug, { recId: id });
    selectRec(id);
  }

  function handlePinSelect(id: string) {
    track("pin_click", hotel.slug, { recId: id });
    selectRec(id);
  }

  return (
    <div className="flex flex-1 flex-col">
      <SearchBar value={query} onChange={setQuery} />
      <MapSection
        recs={filteredRecs}
        center={hotel.coordinates}
        selectedRecId={selectedRecId}
        onSelectRec={handlePinSelect}
      />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        {filteredRecs.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No recs match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          filteredRecs.map((rec) => (
            <RecCard
              key={rec.id}
              rec={rec}
              isSelected={selectedRecId === rec.id}
              onSelect={handleCardSelect}
              cardRef={(el) => {
                if (el) cardRefs.current.set(rec.id, el);
                else cardRefs.current.delete(rec.id);
              }}
            />
          ))
        )}
        <GateBanner lockedCount={hotel.lockedCount} href={`/${hotel.slug}/signup`} />
      </div>
    </div>
  );
}
