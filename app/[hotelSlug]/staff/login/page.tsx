import { notFound } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { getHotelBySlug } from "@/lib/hotels";

export default async function StaffLoginPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-xl font-semibold text-zinc-900">{hotel.name} staff</h1>
        <p className="mb-6 text-center text-sm text-zinc-600">Sign in to manage recommendations.</p>

        {/* routing="hash" avoids needing a dedicated catch-all route just for this embedded sign-in -- fine for a single, non-multi-step auth entry point like this. */}
        <SignIn routing="hash" forceRedirectUrl={`/${hotelSlug}/staff`} />
      </div>
    </div>
  );
}
