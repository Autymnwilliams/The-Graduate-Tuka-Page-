import { cookies } from "next/headers";
import { getHotelBySlug } from "@/lib/hotels";
import { getLeadStore } from "@/lib/leads";
import { getLikedRecIdsByGuest } from "@/lib/likes";
import { GUEST_ID_COOKIE } from "@/lib/guest";

/**
 * Lets the (client) ChatWidget personalize its opening greeting without
 * being able to read the httpOnly guest cookie itself. Returns the
 * strongest available signal: liked recs first (most specific), then
 * "returning guest" (a lead exists from an earlier chat), then nothing.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelSlug = searchParams.get("hotelSlug");
  if (!hotelSlug) {
    return Response.json({ error: "hotelSlug is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
  if (!guestId) {
    return Response.json({ kind: "none" });
  }

  const likedRecIds = await getLikedRecIdsByGuest(hotelSlug, guestId);
  if (likedRecIds.length > 0) {
    const hotel = await getHotelBySlug(hotelSlug);
    const recNames = likedRecIds
      .map((id) => hotel?.recs.find((r) => r.id === id)?.name)
      .filter((name): name is string => !!name);
    if (recNames.length > 0) {
      return Response.json({ kind: "liked", recNames });
    }
  }

  const lead = await getLeadStore().getLeadByGuestIdAny(guestId);
  if (lead?.name) {
    return Response.json({ kind: "returning", name: lead.name });
  }
  if (lead) {
    return Response.json({ kind: "returning", name: null });
  }

  return Response.json({ kind: "none" });
}
