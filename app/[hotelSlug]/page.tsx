import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getHotelBySlug, toPublicHotel } from "@/lib/hotels";
import { unlockCookieName, GATE_DISABLED } from "@/lib/unlock";
import { recordEvent } from "@/lib/analytics";
import { HotelExperience } from "@/components/hotel/HotelExperience";

export default async function HotelPage({
  params,
}: {
  params: Promise<{ hotelSlug: string }>;
}) {
  const { hotelSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  const cookieStore = await cookies();
  const isUnlocked = GATE_DISABLED || cookieStore.get(unlockCookieName(hotelSlug))?.value === "1";
  const publicHotel = await toPublicHotel(hotel, isUnlocked);

  await recordEvent({
    type: "page_view",
    hotelSlug,
    timestamp: new Date().toISOString(),
    data: { isUnlocked },
  });

  return (
    <div className="flex flex-1 flex-col">
      <HotelExperience hotel={publicHotel} />
    </div>
  );
}
