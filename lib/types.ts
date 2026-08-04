export type RecCategory =
  | "dining"
  | "coffee"
  | "nightlife"
  | "hidden-gems"
  | "family-friendly"
  | "shopping"
  | string;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Rec {
  id: string;
  name: string;
  category: RecCategory;
  coordinates: Coordinates;
  address: string;
  photoUrls: string[];
  shortDescription: string;
  staffNote?: string;
  staffName?: string;
  priceLevel: string;
  tags: string[];
  isFeatured?: boolean;
  /** Link to the restaurant/venue's own booking page. Tuka never books reservations itself. */
  bookingLink?: string;
}

/** Full hotel record as stored on disk. Never send this whole object to the client. */
export interface Hotel {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  logoUrl: string;
  heroImageUrl: string;
  coordinates: Coordinates;
  freeRecLimit: number;
  categories: string[];
  recs: Rec[];
}

export interface RecStats {
  likeCount: number;
  reviewCount: number;
  avgRating: number | null;
}

export interface RecWithStats extends Rec {
  stats: RecStats;
}

/** Client-safe hotel payload — recs beyond the free tier are stripped, not just hidden. */
export interface PublicHotel {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  logoUrl: string;
  heroImageUrl: string;
  coordinates: Coordinates;
  categories: string[];
  visibleRecs: RecWithStats[];
  lockedCount: number;
  isUnlocked: boolean;
}

export interface Review {
  id: string;
  hotelSlug: string;
  recId: string;
  guestName: string;
  rating: number;
  text: string;
  stayLength?: string;
  createdAt: string;
}

export type AnalyticsEventType =
  | "page_view"
  | "rec_click"
  | "pin_click"
  | "search_used"
  | "gate_hit"
  | "signup_started"
  | "signup_completed"
  | "review_submitted"
  | "rec_liked"
  | "uber_requested"
  | "reservation_link_clicked"
  | "chat_message";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  hotelSlug: string;
  timestamp: string;
  data?: Record<string, unknown>;
}
