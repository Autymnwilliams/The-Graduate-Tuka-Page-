import type { PublicHotel } from "@/lib/types";

export function HotelHeader({ hotel }: { hotel: PublicHotel }) {
  const initial = hotel.name.trim().charAt(0).toUpperCase() || "T";

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--tuka-gold)]/50 bg-[var(--tuka-ink)] px-5 py-2.5 shadow-lg">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--tuka-gold)] text-sm font-semibold text-[var(--tuka-gold)]">
        {initial}
      </span>
      <h1 className="truncate text-base font-semibold tracking-[0.06em] text-white uppercase">
        {hotel.name}
      </h1>
    </div>
  );
}
