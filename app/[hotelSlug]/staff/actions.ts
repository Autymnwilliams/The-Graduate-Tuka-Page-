"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHotelStore, type NewRecInput, type RecPatch } from "@/lib/hotelStore";
import { checkStaffPasscode, staffCookieName, STAFF_COOKIE_VALUE, UNLOCK_COOKIE_MAX_AGE_SECONDS } from "@/lib/staffAuth";

export async function staffLogin(hotelSlug: string, formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");

  if (!checkStaffPasscode(passcode)) {
    redirect(`/${hotelSlug}/staff/login?error=1`);
  }

  const cookieStore = await cookies();
  cookieStore.set(staffCookieName(hotelSlug), STAFF_COOKIE_VALUE, {
    maxAge: UNLOCK_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  redirect(`/${hotelSlug}/staff`);
}

function recInputFromForm(formData: FormData): NewRecInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    lat: parseFloat(String(formData.get("lat") ?? "0")),
    lng: parseFloat(String(formData.get("lng") ?? "0")),
    shortDescription: String(formData.get("shortDescription") ?? "").trim(),
    priceLevel: String(formData.get("priceLevel") ?? "").trim(),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    bookingLink: String(formData.get("bookingLink") ?? "").trim() || undefined,
    staffNote: String(formData.get("staffNote") ?? "").trim() || undefined,
    staffName: String(formData.get("staffName") ?? "").trim() || undefined,
  };
}

export async function addRec(hotelSlug: string, formData: FormData) {
  const input = recInputFromForm(formData);
  if (!input.name || !input.category || !input.address || Number.isNaN(input.lat) || Number.isNaN(input.lng)) {
    redirect(`/${hotelSlug}/staff?error=missing-fields`);
  }
  await getHotelStore().addRec(hotelSlug, input);
  redirect(`/${hotelSlug}/staff`);
}

export async function updateRec(hotelSlug: string, recId: string, formData: FormData) {
  const patch: RecPatch = recInputFromForm(formData);
  await getHotelStore().updateRec(hotelSlug, recId, patch);
  redirect(`/${hotelSlug}/staff`);
}

export async function deleteRec(hotelSlug: string, recId: string) {
  await getHotelStore().deleteRec(hotelSlug, recId);
  redirect(`/${hotelSlug}/staff`);
}
