"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { getHotelStore, type NewRecInput, type RecPatch } from "@/lib/hotelStore";
import { checkStaffPasscode, staffCookieName, STAFF_COOKIE_VALUE, UNLOCK_COOKIE_MAX_AGE_SECONDS } from "@/lib/staffAuth";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

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

/** Uploads staff-supplied photos to durable blob storage and appends them to the rec's photoUrls (which already take priority over Google Places photos in lib/hotels.ts's resolveRecPhotoUrls). */
export async function uploadRecPhotos(hotelSlug: string, recId: string, formData: FormData) {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) redirect(`/${hotelSlug}/staff?error=no-photos`);

  for (const file of files) {
    if (!file.type.startsWith("image/")) redirect(`/${hotelSlug}/staff?error=not-an-image`);
    if (file.size > MAX_PHOTO_BYTES) redirect(`/${hotelSlug}/staff?error=photo-too-large`);
  }

  const hotel = await getHotelStore().getHotel(hotelSlug);
  const rec = hotel?.recs.find((r) => r.id === recId);
  if (!rec) redirect(`/${hotelSlug}/staff?error=rec-not-found`);

  const uploaded = await Promise.all(
    files.map((file) => {
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      return put(`hotels/${hotelSlug}/recs/${recId}/${randomUUID()}${ext}`, file, { access: "public" });
    }),
  );

  const photoUrls = [...rec.photoUrls, ...uploaded.map((b) => b.url)];
  await getHotelStore().updateRec(hotelSlug, recId, { photoUrls });
  redirect(`/${hotelSlug}/staff`);
}

export async function deleteRecPhoto(hotelSlug: string, recId: string, photoUrl: string) {
  const hotel = await getHotelStore().getHotel(hotelSlug);
  const rec = hotel?.recs.find((r) => r.id === recId);
  if (!rec) redirect(`/${hotelSlug}/staff?error=rec-not-found`);

  const photoUrls = rec.photoUrls.filter((u) => u !== photoUrl);
  await getHotelStore().updateRec(hotelSlug, recId, { photoUrls });
  await del(photoUrl).catch(() => {});
  redirect(`/${hotelSlug}/staff`);
}
