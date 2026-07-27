"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { recordEvent } from "@/lib/analytics";
import { getLeadStore } from "@/lib/leads";
import { unlockCookieName, UNLOCK_COOKIE_MAX_AGE_SECONDS } from "@/lib/unlock";

export async function completeSignup(hotelSlug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  let isReturning = false;
  if (email.includes("@")) {
    ({ isReturning } = await getLeadStore().upsertLead({ email, name, hotelSlug }));
  }

  await recordEvent({
    type: "signup_completed",
    hotelSlug,
    timestamp: new Date().toISOString(),
    data: { hasName: name.length > 0, hasEmail: email.length > 0, isReturning },
  });

  const cookieStore = await cookies();
  cookieStore.set(unlockCookieName(hotelSlug), "1", {
    maxAge: UNLOCK_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  redirect(`/${hotelSlug}`);
}
