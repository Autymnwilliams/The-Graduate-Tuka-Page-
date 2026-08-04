"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { recordEvent } from "@/lib/analytics";
import { getLeadStore } from "@/lib/leads";
import { unlockCookieName, UNLOCK_COOKIE_MAX_AGE_SECONDS } from "@/lib/unlock";
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE_SECONDS } from "@/lib/guest";

export async function completeSignup(hotelSlug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const stayLength = String(formData.get("stayLength") ?? "").trim();

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
  if (!guestId) {
    guestId = randomUUID();
    cookieStore.set(GUEST_ID_COOKIE, guestId, {
      maxAge: GUEST_ID_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  let isReturning = false;
  if (email.includes("@")) {
    ({ isReturning } = await getLeadStore().upsertLead({
      email,
      name,
      phone: phone || undefined,
      stayLength: stayLength || undefined,
      guestId,
      hotelSlug,
    }));
  }

  await recordEvent({
    type: "signup_completed",
    hotelSlug,
    timestamp: new Date().toISOString(),
    data: { hasName: name.length > 0, hasEmail: email.length > 0, isReturning },
  });

  cookieStore.set(unlockCookieName(hotelSlug), "1", {
    maxAge: UNLOCK_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  redirect(`/${hotelSlug}`);
}
