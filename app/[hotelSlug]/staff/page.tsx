import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getHotelBySlug } from "@/lib/hotels";
import { getHotelEvents } from "@/lib/analytics";
import { getRecStats } from "@/lib/recStats";
import { staffCookieName, STAFF_COOKIE_VALUE } from "@/lib/staffAuth";
import { addRec, deleteRec, updateRec } from "./actions";

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
  for (const e of events) {
    const recId = (e.data as { recId?: string } | undefined)?.recId;
    if (!recId) continue;
    if (e.type === "reservation_link_clicked") reservationClicksByRec.set(recId, (reservationClicksByRec.get(recId) ?? 0) + 1);
    if (e.type === "uber_requested") uberClicksByRec.set(recId, (uberClicksByRec.get(recId) ?? 0) + 1);
  }

  const boundAddRec = addRec.bind(null, hotelSlug);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-6">
      <div>
        <a href={`/${hotelSlug}`} className="mb-2 inline-block text-sm text-zinc-500 hover:underline">
          ‹ Back to {hotel.name}
        </a>
        <h1 className="text-2xl font-semibold text-zinc-900">{hotel.name} · Staff</h1>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Guest engagement</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-2xl font-bold text-[var(--tuka-ink)]">{pageViews}</div>
            <div className="text-xs text-zinc-500">Page views</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-2xl font-bold text-[var(--tuka-ink)]">{signups}</div>
            <div className="text-xs text-zinc-500">Sign-ups</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-2xl font-bold text-[var(--tuka-ink)]">{recStats.reduce((sum, r) => sum + r.stats.likeCount, 0)}</div>
            <div className="text-xs text-zinc-500">Total likes</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-2xl font-bold text-[var(--tuka-ink)]">{hotel.recs.length}</div>
            <div className="text-xs text-zinc-500">Recommendations</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Recommendation performance</h2>
        <div className="flex flex-col gap-2">
          {recStats
            .map((r) => ({
              ...r,
              reservationClicks: reservationClicksByRec.get(r.recId) ?? 0,
              uberClicks: uberClicksByRec.get(r.recId) ?? 0,
            }))
            .sort((a, b) => b.reservationClicks + b.uberClicks - (a.reservationClicks + a.uberClicks))
            .map((r) => (
              <div key={r.recId} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-medium text-zinc-800">{r.name}</span>
                <span className="text-zinc-500">
                  {r.stats.likeCount} likes · {r.reservationClicks} reservation clicks · {r.uberClicks} Uber clicks
                </span>
              </div>
            ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Add a recommendation</h2>
        <form action={boundAddRec} className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
          <input name="name" placeholder="Name" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="category" placeholder="Category (e.g. dining)" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="address" placeholder="Address" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="lat" type="number" step="any" placeholder="Latitude" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="lng" type="number" step="any" placeholder="Longitude" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="shortDescription" placeholder="Short description" required rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="priceLevel" placeholder="Price level (e.g. $$)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="tags" placeholder="Tags, comma separated" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="bookingLink" placeholder="Booking link (optional)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="w-fit rounded-full bg-[var(--tuka-ink)] px-6 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Add recommendation
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">All recommendations</h2>
        <div className="flex flex-col gap-3">
          {hotel.recs.map((rec) => {
            const boundUpdateRec = updateRec.bind(null, hotelSlug, rec.id);
            const boundDeleteRec = deleteRec.bind(null, hotelSlug, rec.id);
            return (
              <details key={rec.id} className="rounded-xl border border-zinc-200 p-3">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-zinc-800">
                  <span>{rec.name} <span className="text-zinc-400">({rec.category})</span></span>
                  <form action={boundDeleteRec}>
                    <button type="submit" className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                      Delete
                    </button>
                  </form>
                </summary>
                <form action={boundUpdateRec} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input name="name" defaultValue={rec.name} placeholder="Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <input name="category" defaultValue={rec.category} placeholder="Category" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <input name="address" defaultValue={rec.address} placeholder="Address" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                  <input name="lat" type="number" step="any" defaultValue={rec.coordinates.lat} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <input name="lng" type="number" step="any" defaultValue={rec.coordinates.lng} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <textarea name="shortDescription" defaultValue={rec.shortDescription} rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                  <input name="priceLevel" defaultValue={rec.priceLevel} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <input name="tags" defaultValue={rec.tags.join(", ")} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  <input name="bookingLink" defaultValue={rec.bookingLink ?? ""} placeholder="Booking link" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                  <button type="submit" className="w-fit rounded-full bg-[var(--tuka-ink)] px-5 py-2 text-sm font-semibold text-white sm:col-span-2">
                    Save changes
                  </button>
                </form>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
