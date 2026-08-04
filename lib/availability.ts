import { isRealAvailabilityEnabled, searchResyVenue, getResySlots } from "./resy";
import type { Coordinates } from "./types";

/**
 * Availability calendar for a rec's detail page. Real data (Resy, see
 * lib/resy.ts) is used per-day when ENABLE_REAL_AVAILABILITY is on and a
 * confident venue match resolves; every other case (flag off, no match,
 * request failure/timeout for a given day) falls back to a stable,
 * deterministic-per-day SIMULATED calendar — never a hard dependency on the
 * real integration. `source` on each day tells the caller which it got.
 */

export interface TimeSlot {
  time: string; // "5:00 PM"
  available: boolean;
}

export interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  label: string; // "Mon, Aug 3"
  slots: TimeSlot[];
  source: "real" | "simulated";
}

const DAYS_AHEAD = 14;

/** Category-appropriate visit/reservation windows for the SIMULATED fallback. */
function slotTimesFor(category: string): string[] {
  const c = category.toLowerCase();
  if (c.includes("dining") || c === "dining") {
    return ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"];
  }
  if (c.includes("coffee")) {
    return ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  }
  if (c.includes("nightlife")) {
    return ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "10:30 PM"];
  }
  return ["10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
}

/** Small deterministic hash → [0, 1), so the same rec+date+time always produces the same result. */
function seededFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 4294967296;
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function simulatedDay(recId: string, category: string, date: Date, dateStr: string): DayAvailability {
  const times = slotTimesFor(category);
  const slots: TimeSlot[] = times.map((time) => {
    const seed = `${recId}:${dateStr}:${time}`;
    const weekendBoost = [0, 6].includes(date.getDay()) ? 0.1 : 0;
    return { time, available: seededFraction(seed) > 0.35 - weekendBoost };
  });
  return { date: dateStr, label: formatLabel(date), slots, source: "simulated" };
}

/**
 * Next DAYS_AHEAD days of availability for one rec, starting today. Stable
 * across repeated calls for the same (recId, category) on the same
 * calendar day for the simulated fallback — refreshing the page doesn't
 * reshuffle which slots are open.
 */
export async function getAvailability(
  recId: string,
  name: string,
  category: string,
  coordinates: Coordinates,
): Promise<DayAvailability[]> {
  const venueId = isRealAvailabilityEnabled()
    ? await searchResyVenue(recId, name, coordinates.lat, coordinates.lng)
    : null;

  const days: DayAvailability[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    if (venueId) {
      const realTimes = await getResySlots(venueId, coordinates.lat, coordinates.lng, dateStr);
      if (realTimes !== null) {
        days.push({
          date: dateStr,
          label: formatLabel(date),
          slots: realTimes.map((time) => ({ time, available: true })),
          source: "real",
        });
        continue;
      }
    }

    days.push(simulatedDay(recId, category, date, dateStr));
  }

  return days;
}
