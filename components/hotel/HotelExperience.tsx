"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicHotel, Rec } from "@/lib/types";
import { track } from "@/lib/analytics-client";
import { SearchBar } from "./SearchBar";
import { MapSection } from "./MapSection";
import { HotelHeader } from "./HotelHeader";
import { RecCard } from "./RecCard";
import { RecDetailSheet } from "./RecDetailSheet";
import { GateBanner } from "./GateBanner";
import { TukaIntro } from "./TukaIntro";

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
  const [expanded, setExpanded] = useState(false);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  const filteredRecs = useMemo(
    () => hotel.visibleRecs.filter((rec) => matchesQuery(rec, query)),
    [hotel.visibleRecs, query],
  );

  const selectedRec = selectedRecId
    ? hotel.visibleRecs.find((rec) => rec.id === selectedRecId) ?? null
    : null;

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

  function selectRec(id: string, scrollCardIntoView: boolean) {
    setSelectedRecId(id);
    setExpanded(false);
    if (scrollCardIntoView) {
      cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleCardSelect(id: string) {
    track("rec_click", hotel.slug, { recId: id });
    selectRec(id, false);
  }

  function handlePinSelect(id: string) {
    track("pin_click", hotel.slug, { recId: id });
    selectRec(id, true);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[70svh] min-h-[420px] w-full shrink-0">
        <MapSection
          recs={filteredRecs}
          center={hotel.coordinates}
          hotelName={hotel.name}
          hotelLogoUrl={hotel.logoUrl}
          selectedRecId={selectedRecId}
          onSelectRec={handlePinSelect}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-4">
          <div className="pointer-events-auto">
            <HotelHeader hotel={hotel} />
          </div>
          <div className="pointer-events-auto">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
        {selectedRec && (
          <RecDetailSheet
            rec={selectedRec}
            hotel={hotel}
            expanded={expanded}
            onClose={() => {
              setSelectedRecId(null);
              setExpanded(false);
            }}
            onToggleExpand={() => setExpanded((prev) => !prev)}
          />
        )}
      </div>

      <TukaIntro welcomeMessage={hotel.welcomeMessage} />

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
