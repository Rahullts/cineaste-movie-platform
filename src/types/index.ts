export type MovieStatus = "want" | "watched" | "watching" | "dropped";

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  tmdb_id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  director?: string;
  genres?: Genre[];
  genre_ids?: number[];
  status?: MovieStatus;
  is_favorite?: boolean;
  rating?: number;
  review?: string;
  watched_date?: string;
  watched_at?: string;
  updated_date?: string;
  created_date?: string;
  sort_order?: number;
  remind_on?: string;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  color?: string;
  is_public: boolean;
  movie_count?: number;
  created_at: string;
  updated_at?: string;
  movie_ids?: number[];
  movies?: Movie[];
}

export type TimelineActivityType =
  | "added"
  | "watched"
  | "viewed"
  | "favorited"
  | "rated"
  | "reviewed"
  | "created_collection"
  | "collection_created"
  | "collected"
  | "imported";

export interface TimelineActivity {
  id: string;
  type: TimelineActivityType;
  tmdb_id?: number;
  title: string;
  poster_path?: string;
  rating?: number;
  review?: string;
  metadata?: Record<string, any>;
  occurred_at: string;
}

export interface UserStats {
  totalWatched: number;
  inWatchlist: number;
  totalCollections: number;
  hoursWatched: number;
}

export type SubscriptionPlanId = "free" | "pro" | "premium";

export interface UserSubscription {
  plan: SubscriptionPlanId;
  status: "active" | "canceled" | "past_due";
  current_period_end?: string;
  canceled_at?: string;
  stripe_customer_id?: string;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  accent: string;
  density: "comfortable" | "compact";
  autoplay_trailers: boolean;
  rating_system: "stars5" | "ten" | "thumbs";
  region: string;
  email_notifications: boolean;
  push_notifications: boolean;
  profile_visibility: "public" | "friends" | "private";
  show_activity: boolean;
  show_watchlist: boolean;
  language: string;
  reduce_motion: boolean;
  high_contrast: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  handle: string;
  role: "admin" | "user";
  avatar_url?: string;
  bio?: string;
  favorite_genres?: string[];
  favorite_languages?: string[];
  member_since?: string;
  subscription: UserSubscription;
  settings: UserSettings;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  target: "all" | "pro" | "premium";
  created_at: string;
  is_active: boolean;
}

export interface AdminFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  updated_at: string;
}

export interface AdminModerationComment {
  id: string;
  author_name: string;
  author_handle: string;
  movie_title?: string;
  body: string;
  created_at: string;
  flagged_reason?: string;
}
