"use client";

import { track } from "@/lib/analytics-client";

export interface ReservationLinkProps {
  hotelSlug: string;
  recId: string;
  bookingLink?: string;
  className?: string;
}

/**
 * Opens the restaurant/venue's own booking page. Tuka never places a
 * reservation itself — see hotel-pivot-plan.md §4 (same decision applies
 * here). Renders nothing if the rec has no booking link on file.
 */
export function ReservationLink({ hotelSlug, recId, bookingLink, className }: ReservationLinkProps) {
  if (!bookingLink) return null;

  return (
    <a
      href={bookingLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("reservation_link_clicked", hotelSlug, { recId })}
      className={
        className ??
        "flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800"
      }
    >
      📅 Reserve a table
    </a>
  );
}
