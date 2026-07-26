"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { track } from "@/lib/analytics-client";
import { Stars } from "./Stars";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={`text-2xl leading-none ${n <= value ? "text-[var(--tuka-gold)]" : "text-zinc-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export interface RecEngagementProps {
  hotelSlug: string;
  recId: string;
  isUnlocked: boolean;
  signupHref: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialReviews: Review[];
}

export function RecEngagement({
  hotelSlug,
  recId,
  isUnlocked,
  signupHref,
  initialLiked,
  initialLikeCount,
  initialReviews,
}: RecEngagementProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeBusy, setLikeBusy] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);

  const [guestName, setGuestName] = useState("");
  const [stayLength, setStayLength] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  async function handleLikeClick() {
    if (likeBusy) return;
    setLikeBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => prev + (nextLiked ? 1 : -1));
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelSlug, recId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.count);
        track("rec_liked", hotelSlug, { recId, liked: data.liked });
      } else {
        // revert optimistic update on failure
        setLiked(liked);
        setLikeCount((prev) => prev + (nextLiked ? -1 : 1));
      }
    } catch {
      setLiked(liked);
      setLikeCount((prev) => prev + (nextLiked ? -1 : 1));
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug,
          recId,
          guestName,
          rating,
          text,
          stayLength: stayLength || undefined,
        }),
      });
      if (!res.ok) {
        setError("Couldn't post your review — please try again.");
        return;
      }
      const data = await res.json();
      setReviews((prev) => [data.review as Review, ...prev]);
      track("review_submitted", hotelSlug, { recId, rating });
      setGuestName("");
      setStayLength("");
      setRating(5);
      setText("");
    } catch {
      setError("Couldn't post your review — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={isUnlocked ? handleLikeClick : undefined}
        disabled={!isUnlocked}
        className={`flex w-fit items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm ${
          isUnlocked ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span aria-hidden>{liked ? "❤️" : "🤍"}</span>
        <span className="text-zinc-700">
          {likeCount} guest{likeCount === 1 ? "" : "s"}
          {" "}&amp; locals
        </span>
      </button>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Guest Reviews • {reviews.length}
          </h3>
          {avgRating !== null && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Stars rating={avgRating} /> {avgRating.toFixed(1)}
            </span>
          )}
        </div>

        {isUnlocked ? (
          <form onSubmit={handleSubmitReview} className="mt-3 flex flex-col gap-3 rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-700">Your rating</span>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[var(--tuka-ink)]"
            />
            <input
              value={stayLength}
              onChange={(e) => setStayLength(e.target.value)}
              placeholder="Length of stay (optional), e.g. 2 nights"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[var(--tuka-ink)]"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience..."
              required
              rows={3}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[var(--tuka-ink)]"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-full bg-[var(--tuka-ink)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post review"}
            </button>
          </form>
        ) : (
          <a
            href={signupHref}
            className="mt-3 block rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-600"
          >
            Sign up to leave a review
          </a>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tuka-ink)] text-sm font-semibold text-white">
                  {review.guestName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900">{review.guestName}</span>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {review.stayLength ? `Stayed ${review.stayLength} • ` : ""}
                    {timeAgo(review.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">{review.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
