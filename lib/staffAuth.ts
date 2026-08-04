export const UNLOCK_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function staffCookieName(hotelSlug: string): string {
  return `tuka_staff_${hotelSlug}`;
}

/**
 * Single shared passcode via STAFF_PASSCODE env var — this app has no user
 * accounts or sessions anywhere (the guest "gate" is just a cookie too), so
 * a per-hotel login system would be a much bigger addition than a pilot
 * needs. Every hotel's staff share one passcode for now.
 */
export function checkStaffPasscode(input: string): boolean {
  const expected = process.env.STAFF_PASSCODE;
  if (!expected) {
    console.warn("[staffAuth] STAFF_PASSCODE not set — staff pages are unreachable until it's configured.");
    return false;
  }
  return input === expected;
}

/** Value stored in the staff cookie once the passcode is verified — not the passcode itself. */
export const STAFF_COOKIE_VALUE = "1";
