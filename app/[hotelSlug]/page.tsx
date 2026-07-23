import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getHotelBySlug, toPublicHotel } from "@/lib/hotels";
import { unlockCookieName } from "@/lib/unlock";
import { HotelHeader } from "@/components/hotel/HotelHeader";
import { TukaIntro } from "@/components/hotel/TukaIntro";
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
  const isUnlocked = cookieStore.get(unlockCookieName(hotelSlug))?.value === "1";
  const publicHotel = toPublicHotel(hotel, isUnlocked);

  const brandStyle = {
    "--brand-primary": publicHotel.brandColors.primary,
    "--brand-secondary": publicHotel.brandColors.secondary,
  } as React.CSSProperties;

  return (
    <div className="flex flex-1 flex-col" style={brandStyle}>
      <HotelHeader hotel={publicHotel} />
      <TukaIntro welcomeMessage={publicHotel.welcomeMessage} />
      <HotelExperience hotel={publicHotel} />
    </div>
  );
}
