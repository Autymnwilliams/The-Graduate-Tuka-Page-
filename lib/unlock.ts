export const UNLOCK_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function unlockCookieName(hotelSlug: string): string {
  return `tuka_unlocked_${hotelSlug}`;
}

/**
 * TEMP: forces every rec to render as unlocked, bypassing the signup gate.
 * Flip back to false to re-enable the gate.
 */
export const GATE_DISABLED = true;
