import type { PublicHotel } from "@/lib/types";

export function HotelHeader({ hotel }: { hotel: PublicHotel }) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-4 text-[var(--brand-secondary)] sm:px-6"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- per-hotel asset path, not a static import */}
      <img
        src={hotel.logoUrl}
        alt={`${hotel.name} logo`}
        className="h-10 w-10 shrink-0 rounded-full bg-white/10 object-contain"
      />
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold leading-tight">{hotel.name}</h1>
        <p className="truncate text-sm opacity-80">{hotel.neighborhood}</p>
      </div>
    </header>
  );
}
