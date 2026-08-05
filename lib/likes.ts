import { getKv } from "./kv";

function likesKey(hotelSlug: string, recId: string): string {
  return `likes:${hotelSlug}:${recId}:guests`;
}

/** Reverse index (guest -> liked recIds), written alongside the per-rec set below so "what has this guest liked" doesn't require scanning every rec. */
function guestLikesKey(hotelSlug: string, guestId: string): string {
  return `likes:${hotelSlug}:guest:${guestId}`;
}

export async function getLikedRecIdsByGuest(hotelSlug: string, guestId: string): Promise<string[]> {
  return getKv().smembers(guestLikesKey(hotelSlug, guestId));
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
  const guestKey = guestLikesKey(hotelSlug, guestId);
  const alreadyLiked = await getKv().sismember(key, guestId);

  if (alreadyLiked) {
    await getKv().srem(key, guestId);
    await getKv().srem(guestKey, recId);
  } else {
    await getKv().sadd(key, guestId);
    await getKv().sadd(guestKey, recId);
  }

  const count = await getKv().scard(key);
  return { liked: !alreadyLiked, count };
}
