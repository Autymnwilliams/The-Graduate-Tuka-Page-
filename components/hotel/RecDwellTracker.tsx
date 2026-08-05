"use client";

import { useEffect, useRef } from "react";

/**
 * Invisible tracker for "how long a user sat on a rec" (tasks.md ask).
 * Fires a rec_time_spent event with elapsed seconds on tab-hide or
 * unmount -- uses sendBeacon when available so it still fires on tab
 * close, which a normal fetch() often can't guarantee.
 */
export function RecDwellTracker({ hotelSlug, recId }: { hotelSlug: string; recId: string }) {
  const startRef = useRef<number>(Date.now());
  const sentRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    sentRef.current = false;

    function send() {
      if (sentRef.current) return;
      sentRef.current = true;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds < 1) return;

      const payload = JSON.stringify({
        type: "rec_time_spent",
        hotelSlug,
        data: { recId, seconds },
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") send();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", send);

    return () => {
      send();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", send);
    };
  }, [hotelSlug, recId]);

  return null;
}
