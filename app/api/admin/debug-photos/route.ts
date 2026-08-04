/**
 * One-time diagnostic endpoint: calls the Places API (New) Text Search
 * directly and returns the raw status/body, instead of the silent []
 * fallback lib/googlePlaces.ts uses in normal operation. Use this to see
 * *why* photos aren't resolving — expired/revoked key, quota exceeded,
 * billing disabled, API not enabled, etc. — rather than guessing from a
 * blank result. Delete this route once it's served its purpose.
 */
const DEBUG_TOKEN = "79c0b3b61c1a3b364f75bee43a980471";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== DEBUG_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GOOGLE_PLACES_API_KEY is not set in this environment" }, { status: 200 });
  }

  const query = searchParams.get("query") ?? "Alma, 3630 N Clark St, Chicago, IL 60613";

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.photos,places.displayName",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  const bodyText = await res.text();

  return Response.json({
    query,
    apiKeyPresent: true,
    apiKeyLength: apiKey.length,
    status: res.status,
    ok: res.ok,
    body: (() => {
      try {
        return JSON.parse(bodyText);
      } catch {
        return bodyText;
      }
    })(),
  });
}
