"use client";

import type { ReactNode } from "react";
import type { Coordinates } from "@/lib/types";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function DirectionsLink({
  coordinates,
  className,
  children,
}: {
  coordinates: Coordinates;
  className?: string;
  children: ReactNode;
}) {
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=walking`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isIOS()) {
      e.preventDefault();
      window.location.href = `https://maps.apple.com/?daddr=${coordinates.lat},${coordinates.lng}&dirflg=w`;
    }
    // Everyone else (Android, desktop) follows the href to Google Maps normally.
  }

  return (
    <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
