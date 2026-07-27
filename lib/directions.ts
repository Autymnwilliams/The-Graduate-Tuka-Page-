import type { Coordinates } from "./types";
import { walkMinutes as straightLineWalkMinutes } from "./distance";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapboxDirectionsResponse {
  code?: string;
  routes?: { duration: number }[];
}

/**
 * Real walking-route time in whole minutes via Mapbox Directions (accounts
 * for actual streets, not just straight-line distance). Falls back to the
 * straight-line estimate if the token is missing, the request fails, or the
 * API returns no route — never throws, since this is a nice-to-have on top
 * of an already-reasonable estimate.
 */
export async function walkingRouteMinutes(a: Coordinates, b: Coordinates): Promise<number> {
  const fallback = straightLineWalkMinutes(a, b);
  if (!MAPBOX_TOKEN) return fallback;

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}` +
      `?overview=false&access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return fallback;

    const data = (await res.json()) as MapboxDirectionsResponse;
    const durationSeconds = data.routes?.[0]?.duration;
    if (data.code !== "Ok" || typeof durationSeconds !== "number") return fallback;

    return Math.max(1, Math.round(durationSeconds / 60));
  } catch {
    return fallback;
  }
}
