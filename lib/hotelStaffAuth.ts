import { auth, clerkClient } from "@clerk/nextjs/server";

export interface StaffAuthResult {
  userId: string;
  email?: string;
  hotelRole: "manager" | "staff";
}

/**
 * Checks the current request's Clerk session for staff access scoped to
 * one hotel. Mirrors backend_main's middleware/hotelStaffAuth.js exactly
 * in spirit (getAuth + clerkClient.users.getUser + publicMetadata.hotelRole
 * check) -- with one adaptation: publicMetadata.hotelId here is compared
 * against this app's hotel SLUG (e.g. "hotelzachary"), not a Mongo
 * ObjectId. backend_main's own "hotelId" refers to its separate, internal
 * hotel-discovery Hotel model -- a different concept from this app's pilot
 * hotels -- so the same metadata field name isn't guaranteed to carry a
 * cross-compatible value for a given staff member across both systems.
 */
export async function checkHotelStaffAuth(hotelSlug: string): Promise<StaffAuthResult | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const { hotelId, hotelRole } = (user.publicMetadata ?? {}) as { hotelId?: string; hotelRole?: string };

  if (hotelRole !== "manager" && hotelRole !== "staff") return null;
  if (hotelId !== hotelSlug) return null;

  return { userId, email: user.emailAddresses[0]?.emailAddress, hotelRole };
}
