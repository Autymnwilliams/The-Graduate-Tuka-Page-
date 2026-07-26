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
  photoUrl: string;
  shortDescription: string;
  staffNote?: string;
  staffName?: string;
  priceLevel: string;
  tags: string[];
  isFeatured?: boolean;
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
  welcomeMessage: string;
  freeRecLimit: number;
  categories: string[];
  recs: Rec[];
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
  welcomeMessage: string;
  categories: string[];
  visibleRecs: Rec[];
  lockedCount: number;
  isUnlocked: boolean;
}

export type AnalyticsEventType =
  | "page_view"
  | "rec_click"
  | "pin_click"
  | "search_used"
  | "gate_hit"
  | "signup_started"
  | "signup_completed";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  hotelSlug: string;
  timestamp: string;
  data?: Record<string, unknown>;
}
