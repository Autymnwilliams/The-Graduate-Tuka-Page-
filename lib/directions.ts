import type { Coordinates } from "./types";
import {
  milesBetween,
  walkMinutes as straightLineWalkMinutes,
  driveMinutes as straightLineDriveMinutes,
} from "./distance";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Above this, a "min walk" reads as impractical — show driving time instead. */
const WALK_DRIVE_THRESHOLD_MINUTES = 25;

/** Recs at (or effectively at) the hotel's own coordinates — e.g. an in-house restaurant — read as 0 min, not a floored 1. */
const SAME_LOCATION_THRESHOLD_MILES = 0.02;

interface MapboxDirectionsResponse {
  code?: string;
  routes?: { duration: number }[];
}

async function routeMinutes(
  profile: "walking" | "driving",
  a: Coordinates,
  b: Coordinates,
  fallback: number,
): Promise<number> {
  if (!MAPBOX_TOKEN) return fallback;

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
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

/**
 * Real walking-route time in whole minutes via Mapbox Directions (accounts
 * for actual streets, not just straight-line distance). Falls back to the
 * straight-line estimate if the token is missing, the request fails, or the
 * API returns no route — never throws, since this is a nice-to-have on top
 * of an already-reasonable estimate.
 */
export async function walkingRouteMinutes(a: Coordinates, b: Coordinates): Promise<number> {
  return routeMinutes("walking", a, b, straightLineWalkMinutes(a, b));
}

/** Real driving-route time in whole minutes via Mapbox Directions, same fallback behavior as walkingRouteMinutes. */
export async function drivingRouteMinutes(a: Coordinates, b: Coordinates): Promise<number> {
  return routeMinutes("driving", a, b, straightLineDriveMinutes(a, b));
}

export interface TravelTime {
  minutes: number;
  mode: "walk" | "drive";
}

/**
 * Walking time, unless that's over WALK_DRIVE_THRESHOLD_MINUTES — a rec that
 * far away reads better as a drive time than an implausible-looking walk.
 */
export async function travelTime(a: Coordinates, b: Coordinates): Promise<TravelTime> {
  if (milesBetween(a, b) < SAME_LOCATION_THRESHOLD_MILES) return { minutes: 0, mode: "walk" };

  const walk = await walkingRouteMinutes(a, b);
  if (walk <= WALK_DRIVE_THRESHOLD_MINUTES) return { minutes: walk, mode: "walk" };

  const drive = await drivingRouteMinutes(a, b);
  return { minutes: drive, mode: "drive" };
}
