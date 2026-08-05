import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getHotelBySlug } from "@/lib/hotels";
import { getHotelEvents } from "@/lib/analytics";
import { getRecStats } from "@/lib/recStats";
import { staffCookieName, STAFF_COOKIE_VALUE } from "@/lib/staffAuth";
import { StaffTabs } from "@/components/hotel/StaffTabs";
import { addRec, deleteRec, updateRec, uploadRecPhotos, deleteRecPhoto } from "./actions";

export default async function StaffPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  const cookieStore = await cookies();
  if (cookieStore.get(staffCookieName(hotelSlug))?.value !== STAFF_COOKIE_VALUE) {
    redirect(`/${hotelSlug}/staff/login`);
  }

  const [events, recStats] = await Promise.all([
    getHotelEvents(hotelSlug),
    Promise.all(hotel.recs.map(async (rec) => ({ recId: rec.id, name: rec.name, stats: await getRecStats(hotelSlug, rec.id) }))),
  ]);

  const pageViews = events.filter((e) => e.type === "page_view").length;
  const signups = events.filter((e) => e.type === "signup_completed").length;
  const reservationClicksByRec = new Map<string, number>();
  const uberClicksByRec = new Map<string, number>();
  const directionsClicksByRec = new Map<string, number>();
  const dwellSecondsByRec = new Map<string, number[]>();
  for (const e of events) {
    const recId = (e.data as { recId?: string } | undefined)?.recId;
    if (!recId) continue;
    if (e.type === "reservation_link_clicked") reservationClicksByRec.set(recId, (reservationClicksByRec.get(recId) ?? 0) + 1);
    if (e.type === "uber_requested") uberClicksByRec.set(recId, (uberClicksByRec.get(recId) ?? 0) + 1);
    if (e.type === "directions_clicked") directionsClicksByRec.set(recId, (directionsClicksByRec.get(recId) ?? 0) + 1);
    if (e.type === "rec_time_spent") {
      const seconds = (e.data as { seconds?: number } | undefined)?.seconds;
      if (typeof seconds === "number") {
        const list = dwellSecondsByRec.get(recId) ?? [];
        list.push(seconds);
        dwellSecondsByRec.set(recId, list);
      }
    }
  }

  const performance = recStats
    .map((r) => {
      const dwellSamples = dwellSecondsByRec.get(r.recId) ?? [];
      const avgDwellSeconds = dwellSamples.length
        ? Math.round(dwellSamples.reduce((sum, s) => sum + s, 0) / dwellSamples.length)
        : 0;
      return {
        recId: r.recId,
        name: r.name,
        likeCount: r.stats.likeCount,
        reservationClicks: reservationClicksByRec.get(r.recId) ?? 0,
        uberClicks: uberClicksByRec.get(r.recId) ?? 0,
        directionsClicks: directionsClicksByRec.get(r.recId) ?? 0,
        avgDwellSeconds,
      };
    })
    .sort((a, b) => b.reservationClicks + b.uberClicks - (a.reservationClicks + a.uberClicks));

  const totalLikes = recStats.reduce((sum, r) => sum + r.stats.likeCount, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6">
      <div>
        <Link href={`/${hotelSlug}`} className="mb-2 inline-block text-sm text-zinc-500 hover:underline">
          ‹ Back to {hotel.name}
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{hotel.name} · Staff</h1>
      </div>

      <StaffTabs
        hotelSlug={hotelSlug}
        kpis={{ pageViews, signups, totalLikes, recCount: hotel.recs.length }}
        performance={performance}
        recs={hotel.recs}
        addRecAction={addRec.bind(null, hotelSlug)}
        updateRecAction={updateRec.bind(null, hotelSlug)}
        deleteRecAction={deleteRec.bind(null, hotelSlug)}
        uploadPhotosAction={uploadRecPhotos.bind(null, hotelSlug)}
        deletePhotoAction={deleteRecPhoto.bind(null, hotelSlug)}
      />
    </div>
  );
}
