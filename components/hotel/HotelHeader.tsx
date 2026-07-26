import type { PublicHotel } from "@/lib/types";

export function HotelHeader({ hotel }: { hotel: PublicHotel }) {
  return (
    <div className="flex items-center justify-center rounded-full bg-white/90 px-5 py-3 shadow-lg backdrop-blur-sm dark:bg-zinc-950/90">
      <h1 className="font-display truncate text-lg text-zinc-900 dark:text-zinc-50">
        {hotel.name}
      </h1>
    </div>
  );
}
