import { notFound } from "next/navigation";
import { getHotelBySlug } from "@/lib/hotels";
import { staffLogin } from "../actions";

export default async function StaffLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { hotelSlug } = await params;
  const { error } = await searchParams;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  const boundStaffLogin = staffLogin.bind(null, hotelSlug);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{hotel.name} staff</h1>
        <p className="mt-1 text-sm text-zinc-600">Enter the staff passcode to manage recommendations.</p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Incorrect passcode.</p>
        )}

        <form action={boundStaffLogin} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="passcode" className="mb-1 block text-sm font-medium text-zinc-700">
              Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[var(--tuka-ink)] focus:ring-2 focus:ring-[var(--tuka-ink)]/30"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-[var(--tuka-ink)] px-6 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
