import type { Coordinates } from "./types";

const EARTH_RADIUS_MILES = 3958.8;
const AVERAGE_WALK_MPH = 3;
const AVERAGE_DRIVE_MPH = 25;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Straight-line (haversine) distance in miles between two coordinates. */
export function milesBetween(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(h));
}

/** Rough walking time in whole minutes (rounded up), minimum 1. */
export function walkMinutes(a: Coordinates, b: Coordinates): number {
  const miles = milesBetween(a, b);
  return Math.max(1, Math.round((miles / AVERAGE_WALK_MPH) * 60));
}

/** Rough driving time in whole minutes (rounded up), minimum 1. */
export function driveMinutes(a: Coordinates, b: Coordinates): number {
  const miles = milesBetween(a, b);
  return Math.max(1, Math.round((miles / AVERAGE_DRIVE_MPH) * 60));
}
