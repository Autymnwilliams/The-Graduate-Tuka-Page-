export const UNLOCK_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function unlockCookieName(hotelSlug: string): string {
  return `tuka_unlocked_${hotelSlug}`;
}
