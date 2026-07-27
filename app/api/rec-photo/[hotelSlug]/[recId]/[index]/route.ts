import { getHotelBySlug } from "@/lib/hotels";
import { fetchGooglePhoto } from "@/lib/googlePlaces";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hotelSlug: string; recId: string; index: string }> },
) {
  const { hotelSlug, recId, index } = await params;

  const hotel = await getHotelBySlug(hotelSlug);
  const rec = hotel?.recs.find((r) => r.id === recId);
  if (!rec) return new Response(null, { status: 404 });

  const photo = await fetchGooglePhoto(rec.name, rec.address, Number(index));
  if (!photo) return new Response(null, { status: 404 });

  return new Response(photo.body, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
