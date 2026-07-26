import { getReviews, averageRating } from "./reviews";
import { getLikeCount } from "./likes";
import type { RecStats } from "./types";

export async function getRecStats(hotelSlug: string, recId: string): Promise<RecStats> {
  const [reviews, likeCount] = await Promise.all([
    getReviews(hotelSlug, recId),
    getLikeCount(hotelSlug, recId),
  ]);

  return {
    likeCount,
    reviewCount: reviews.length,
    avgRating: averageRating(reviews),
  };
}
