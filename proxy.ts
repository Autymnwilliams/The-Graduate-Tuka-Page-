import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = "tuka.world";

/**
 * Maps hotel-name.tuka.world to the existing /[hotelSlug] route tree, so
 * every hotel page keeps working exactly as-is at /{hotelSlug} — this only
 * adds a second way in. Bare tuka.world, www.tuka.world, localhost, and
 * Vercel preview URLs are untouched and keep using path-based routing.
 */
export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0];

  const isSubdomain =
    hostname !== ROOT_DOMAIN &&
    hostname !== `www.${ROOT_DOMAIN}` &&
    hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (!isSubdomain) return NextResponse.next();

  const subdomain = hostname.slice(0, -(`.${ROOT_DOMAIN}`.length));
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
