"use client";

import type { ReactNode } from "react";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function DirectionsLink({
  address,
  mode = "walk",
  className,
  children,
}: {
  /** Full street address — handed to the native maps app to geocode, not our own coordinates. */
  address: string;
  mode?: "walk" | "drive";
  className?: string;
  children: ReactNode;
}) {
  const encoded = encodeURIComponent(address);
  const googleTravelMode = mode === "drive" ? "driving" : "walking";
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=${googleTravelMode}`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
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
