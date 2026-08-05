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

  const { pathname } = request.nextUrl;

  // Static files (favicon aside, already excluded below) live at the public/
  // root -- /tuka-logo.png, /file.svg, etc. -- and have no [hotelSlug] route
  // to rewrite into. Any request whose last path segment has a file
  // extension is a static asset, not a page; serve it as-is instead of
  // prefixing it into a 404. (Confirmed via production logs: /tuka-logo.png
  // was 404ing on every *.tuka.world subdomain because it was being rewritten
  // to /{subdomain}/tuka-logo.png.)
  const isStaticAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (isStaticAsset) return NextResponse.next();

  const subdomain = hostname.slice(0, -(`.${ROOT_DOMAIN}`.length));

  // Every internal link (rec cards, back links, signup) is an absolute href
  // like /{hotelSlug}/recs/{recId} — the same ones used for path-based
  // routing on the bare domain. On a subdomain those already resolve
  // correctly once rewritten once; prefixing again on click would produce
  // /{subdomain}/{subdomain}/recs/{recId} and 404.
  const alreadyPrefixed = pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`);
  if (alreadyPrefixed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
