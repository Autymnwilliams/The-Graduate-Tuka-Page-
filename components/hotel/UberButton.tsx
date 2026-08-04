"use client";

import type { Coordinates } from "@/lib/types";
import { track } from "@/lib/analytics-client";

export interface UberButtonProps {
  hotelSlug: string;
  recId: string;
  dropoff: Coordinates;
  nickname: string;
  uberLink: string | null;
  className?: string;
}

/**
 * Opens Uber with the rec pre-filled as the dropoff. null uberLink means
 * UBER_CLIENT_ID isn't configured server-side — render nothing rather than
 * a dead button.
 */
export function UberButton({ hotelSlug, recId, uberLink, className }: UberButtonProps) {
  if (!uberLink) return null;

  return (
    <a
      href={uberLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("uber_requested", hotelSlug, { recId })}
      className={
        className ??
        "flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800"
      }
    >
      🚗 Get an Uber there
    </a>
  );
}
