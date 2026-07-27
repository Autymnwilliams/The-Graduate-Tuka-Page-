"use client";

import type { ReactNode } from "react";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function DirectionsLink({
  address,
  className,
  children,
}: {
  /** Full street address — handed to the native maps app to geocode, not our own coordinates. */
  address: string;
  className?: string;
  children: ReactNode;
}) {
  const encoded = encodeURIComponent(address);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=walking`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isIOS()) {
      e.preventDefault();
      window.location.href = `https://maps.apple.com/?daddr=${encoded}&dirflg=w`;
    }
    // Everyone else (Android, desktop) follows the href to Google Maps normally.
  }

  return (
    <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
