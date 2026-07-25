"use client";

import type { AnalyticsEventType } from "./types";

/** Fire-and-forget client-side event tracking; never blocks or throws on the caller. */
export function track(
  type: AnalyticsEventType,
  hotelSlug: string,
  data?: Record<string, unknown>,
) {
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, hotelSlug, data }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore — analytics should never break the page
  }
}
