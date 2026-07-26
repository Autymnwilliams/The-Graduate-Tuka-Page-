import type { PublicHotel } from "@/lib/types";

export function HotelHeader({ hotel }: { hotel: PublicHotel }) {
  return (
    <div className="flex items-center justify-center rounded-full bg-white/90 px-5 py-3 shadow-lg backdrop-blur-sm">
      <h1 className="truncate text-lg text-zinc-900">{hotel.name}</h1>
    </div>
  );
}
