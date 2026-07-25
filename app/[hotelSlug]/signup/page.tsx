import { notFound } from "next/navigation";
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

  const brandStyle = {
    "--brand-primary": hotel.brandColors.primary,
    "--brand-secondary": hotel.brandColors.secondary,
  } as React.CSSProperties;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12" style={brandStyle}>
      <div className="w-full max-w-sm">
        <a
          href={`/${hotelSlug}`}
          className="mb-6 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ‹ Back to {hotel.name}
        </a>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Unlock the full list
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign up for Tuka to see every pick {hotel.name} has curated for you — free.
        </p>

        <form action={boundCompleteSignup} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-secondary)]"
          >
            Unlock my recs
          </button>
        </form>
      </div>
    </div>
  );
}
