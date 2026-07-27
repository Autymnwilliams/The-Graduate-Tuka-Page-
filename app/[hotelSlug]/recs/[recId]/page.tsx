import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getHotelBySlug, isRecVisible } from "@/lib/hotels";
import { unlockCookieName } from "@/lib/unlock";
import { GUEST_ID_COOKIE } from "@/lib/guest";
import { getReviews } from "@/lib/reviews";
import { getLikeCount, isLikedByGuest } from "@/lib/likes";
import { walkingRouteMinutes } from "@/lib/directions";
import { categoryLabel } from "@/lib/categoryIcon";
import { RecEngagement } from "@/components/hotel/RecEngagement";
import { DirectionsLink } from "@/components/hotel/DirectionsLink";
import { RecPhoto } from "@/components/hotel/RecPhoto";

export default async function RecPage({
  params,
}: {
  params: Promise<{ hotelSlug: string; recId: string }>;
}) {
  const { hotelSlug, recId } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  const rec = hotel.recs.find((r) => r.id === recId);
  if (!rec) notFound();

  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get(unlockCookieName(hotelSlug))?.value === "1";

  if (!isRecVisible(hotel, recId, isUnlocked)) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl text-zinc-900">This pick is part of the full list</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Sign up for Tuka to unlock every recommendation {hotel.name} has curated for you.
        </p>
        <a
          href={`/${hotelSlug}/signup`}
          className="mt-2 rounded-full bg-[var(--tuka-ink)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Sign up to see it
        </a>
        <a href={`/${hotelSlug}`} className="text-sm text-zinc-500 hover:underline">
          ‹ Back to {hotel.name}
        </a>
      </main>
    );
  }

  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
  const [reviews, likeCount, initialLiked, minutes] = await Promise.all([
    getReviews(hotelSlug, recId),
    getLikeCount(hotelSlug, recId),
    guestId ? isLikedByGuest(hotelSlug, recId, guestId) : Promise.resolve(false),
    walkingRouteMinutes(hotel.coordinates, rec.coordinates),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-4">
      <a href={`/${hotelSlug}`} className="mb-4 inline-block w-fit text-sm text-zinc-500 hover:underline">
        ‹ Back to {hotel.name}
      </a>

      <span className="w-fit rounded-full bg-[var(--tuka-gold)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--tuka-ink)] uppercase">
        {categoryLabel(rec.category)}
      </span>

      <h1 className="mt-2 text-3xl text-zinc-900">{rec.name}</h1>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
        <span aria-hidden>📍</span>
        <span>
          {minutes} min walk from {hotel.name}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
          {rec.priceLevel}
        </span>
        {rec.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900">
            {tag}
          </span>
        ))}
      </div>

      <DirectionsLink
        address={rec.address}
        className="mt-4 flex items-center justify-between rounded-xl bg-[var(--tuka-ink)] px-4 py-3 text-white"
      >
        <span>
          <span className="block text-xs font-semibold tracking-wide text-[var(--tuka-gold)] uppercase">
            From {hotel.name}
          </span>
          <span className="block text-sm">
            {rec.address} <span className="underline">click for directions</span>
          </span>
        </span>
        <span className="ml-3 flex shrink-0 flex-col items-center">
          <span className="text-2xl font-bold leading-none">{minutes}</span>
          <span className="text-[10px] font-semibold tracking-wide uppercase">min walk</span>
        </span>
      </DirectionsLink>

      <RecPhoto
        src={rec.photoUrl}
        alt={rec.name}
        category={rec.category}
        className="mt-4 h-56 w-full rounded-xl bg-zinc-200 object-cover"
      />

      <div className="mt-4">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Overview</h2>
        <p className="mt-1 text-sm text-zinc-700">{rec.shortDescription}</p>
      </div>

      {rec.staffNote && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tuka-ink)] text-sm font-semibold text-white">
            {(rec.staffName ?? "T").charAt(0)}
          </div>
          <p className="text-sm text-zinc-700">
            <span className="font-semibold">{rec.staffName ?? "Hotel staff"}:</span>{" "}
            &ldquo;{rec.staffNote}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-6">
        <RecEngagement
          hotelSlug={hotelSlug}
          recId={recId}
          isUnlocked={isUnlocked}
          signupHref={`/${hotelSlug}/signup`}
          initialLiked={initialLiked}
          initialLikeCount={likeCount}
          initialReviews={reviews}
        />
      </div>
    </main>
  );
}
