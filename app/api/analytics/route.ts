import { recordEvent } from "@/lib/analytics";
import type { AnalyticsEvent, AnalyticsEventType } from "@/lib/types";

const VALID_TYPES: AnalyticsEventType[] = [
  "page_view",
  "rec_click",
  "pin_click",
  "search_used",
  "gate_hit",
  "signup_started",
  "signup_completed",
  "review_submitted",
  "rec_liked",
  "uber_requested",
  "reservation_link_clicked",
  "chat_message",
  "directions_clicked",
  "rec_time_spent",
];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("type" in body) ||
    !("hotelSlug" in body) ||
    typeof (body as Record<string, unknown>).type !== "string" ||
    typeof (body as Record<string, unknown>).hotelSlug !== "string" ||
    !VALID_TYPES.includes((body as Record<string, unknown>).type as AnalyticsEventType)
  ) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const { type, hotelSlug, data } = body as {
    type: AnalyticsEventType;
    hotelSlug: string;
    data?: Record<string, unknown>;
  };

  const event: AnalyticsEvent = {
    type,
    hotelSlug,
    timestamp: new Date().toISOString(),
    data,
  };

  await recordEvent(event);
  return Response.json({ ok: true });
}
