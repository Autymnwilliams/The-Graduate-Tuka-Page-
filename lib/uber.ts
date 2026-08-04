import type { Coordinates } from "./types";

/**
 * Uber universal deep link, pre-filled with a dropoff destination — opens
 * the Uber app (falls back to app/play store, then Uber's mobile web) with
 * the ride ready to request. Tuka never touches ride booking or payment;
 * the guest confirms and pays inside the Uber app.
 * https://developer.uber.com/docs/deeplinks
 */
export function uberDeepLink(dropoff: Coordinates, nickname: string): string | null {
  const clientId = process.env.UBER_CLIENT_ID;
  if (!clientId) return null;

  const params = new URLSearchParams({
    action: "setPickup",
    client_id: clientId,
    "dropoff[latitude]": String(dropoff.lat),
    "dropoff[longitude]": String(dropoff.lng),
    "dropoff[nickname]": nickname,
  });

  return `https://m.uber.com/ul/?${params.toString()}`;
}
