import { notFound } from "next/navigation";
import Link from "next/link";
import { getHotelBySlug } from "@/lib/hotels";
import { recordEvent } from "@/lib/analytics";
import { completeSignup } from "./actions";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ hotelSlug: string }>;
}) {
  const { hotelSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  await recordEvent({
    type: "signup_started",
    hotelSlug,
    timestamp: new Date().toISOString(),
  });

  const boundCompleteSignup = completeSignup.bind(null, hotelSlug);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href={`/${hotelSlug}`} className="mb-6 inline-block text-sm text-zinc-500 hover:underline">
          ‹ Back to {hotel.name}
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Unlock the full list</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sign up for Tuka to see every pick {hotel.name} has curated for you — free.
        </p>

        <form action={boundCompleteSignup} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
              What do we call you?
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--tuka-ink)] focus:ring-2 focus:ring-[var(--tuka-ink)]/30"
            />
          </div>
          <div>
            <label htmlFor="stayLength" className="mb-1 block text-sm font-medium text-zinc-700">
              How long is your stay?
            </label>
            <input
              id="stayLength"
              name="stayLength"
              type="text"
              placeholder="e.g. 3 nights"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--tuka-ink)] focus:ring-2 focus:ring-[var(--tuka-ink)]/30"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--tuka-ink)] focus:ring-2 focus:ring-[var(--tuka-ink)]/30"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="For your digital concierge to text you"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--tuka-ink)] focus:ring-2 focus:ring-[var(--tuka-ink)]/30"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-[var(--tuka-ink)] px-6 py-3 text-sm font-semibold text-white"
          >
            Unlock my recs
          </button>
        </form>
      </div>
    </div>
  );
}
