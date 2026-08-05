"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics-client";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function DirectionsLink({
  address,
  mode = "walk",
  className,
  children,
  hotelSlug,
  recId,
}: {
  /** Full street address — handed to the native maps app to geocode, not our own coordinates. */
  address: string;
  mode?: "walk" | "drive";
  className?: string;
  children: ReactNode;
  /** When provided, clicks are tracked as "directions_clicked" (tasks.md's dwell/click-tracking ask). Optional so this component stays usable anywhere. */
  hotelSlug?: string;
  recId?: string;
}) {
  const encoded = encodeURIComponent(address);
  const googleTravelMode = mode === "drive" ? "driving" : "walking";
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=${googleTravelMode}`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (hotelSlug && recId) track("directions_clicked", hotelSlug, { recId, mode });

    if (isIOS()) {
      e.preventDefault();
      const dirflg = mode === "drive" ? "d" : "w";
      window.location.href = `https://maps.apple.com/?daddr=${encoded}&dirflg=${dirflg}`;
    }
    // Everyone else (Android, desktop) follows the href to Google Maps normally.
  }

  return (
    <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
