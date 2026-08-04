import type { CSSProperties, ReactNode } from "react";
import { getHotelBySlug } from "@/lib/hotels";
import { DEFAULT_THEME } from "@/lib/theme";

/**
 * Sets --tuka-ink/--tuka-gold once per hotel, scoped to this subtree, so
 * every nested route (list, rec detail, signup, staff) picks up the same
 * theme without each page wiring it up itself. Hotels without their own
 * "theme" field fall back to the shared Tuka brand palette.
 */
export default async function HotelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ hotelSlug: string }>;
}) {
  const { hotelSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  const theme = hotel?.theme ?? DEFAULT_THEME;

  const themeStyle = {
    "--tuka-ink": theme.ink,
    "--tuka-gold": theme.gold,
  } as CSSProperties;

  return (
    <div className="flex flex-1 flex-col" style={themeStyle}>
      {children}
    </div>
  );
}
