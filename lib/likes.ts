import { getKv } from "./kv";

function likesKey(hotelSlug: string, recId: string): string {
  return `likes:${hotelSlug}:${recId}:guests`;
}

export async function getLikeCount(hotelSlug: string, recId: string): Promise<number> {
  return getKv().scard(likesKey(hotelSlug, recId));
}

export async function isLikedByGuest(
  hotelSlug: string,
  recId: string,
  guestId: string,
): Promise<boolean> {
  return getKv().sismember(likesKey(hotelSlug, recId), guestId);
}

/** Toggles the guest's like on a rec; returns the new state and total count. */
export async function toggleLike(
  hotelSlug: string,
  recId: string,
  guestId: string,
): Promise<{ liked: boolean; count: number }> {
  const key = likesKey(hotelSlug, recId);
  const alreadyLiked = await getKv().sismember(key, guestId);

  if (alreadyLiked) {
    await getKv().srem(key, guestId);
  } else {
    await getKv().sadd(key, guestId);
  }

  const count = await getKv().scard(key);
  return { liked: !alreadyLiked, count };
}
