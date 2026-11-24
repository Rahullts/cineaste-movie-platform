export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MovieStatus = "want" | "watching" | "watched" | "dropped";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          member_since: string;
          preferred_genres: string[];
          region: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          member_since?: string;
          preferred_genres?: string[];
          region?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          member_since?: string;
          preferred_genres?: string[];
          region?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: string;
          accent_color: string;
          interface_density: string;
          autoplay_trailers: boolean;
          rating_system: string;
          streaming_region: string;
          email_notifications: boolean;
          push_notifications: boolean;
          profile_visibility: string;
          show_activity: boolean;
          show_watchlist: boolean;
          reduce_motion: boolean;
          high_contrast: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          accent_color?: string;
          interface_density?: string;
          autoplay_trailers?: boolean;
          rating_system?: string;
          streaming_region?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          profile_visibility?: string;
          show_activity?: boolean;
          show_watchlist?: boolean;
          reduce_motion?: boolean;
          high_contrast?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          accent_color?: string;
          interface_density?: string;
          autoplay_trailers?: boolean;
          rating_system?: string;
          streaming_region?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          profile_visibility?: string;
          show_activity?: boolean;
          show_watchlist?: boolean;
          reduce_motion?: boolean;
          high_contrast?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: "admin" | "user";
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Relationships: [];
      };
      movies: {
        Row: {
          id: string;
          tmdb_id: number;
          media_type: string;
          title: string;
          original_title: string | null;
          overview: string | null;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string | null;
          runtime: number | null;
          vote_average: number | null;
          vote_count: number | null;
          genres: Json | null;
          metadata_updated_at: string;
        };
        Insert: {
          id?: string;
          tmdb_id: number;
          media_type?: string;
          title: string;
          original_title?: string | null;
          overview?: string | null;
          poster_path?: string | null;
          backdrop_path?: string | null;
          release_date?: string | null;
          runtime?: number | null;
          vote_average?: number | null;
          vote_count?: number | null;
          genres?: Json | null;
          metadata_updated_at?: string;
        };
        Update: {
          id?: string;
          tmdb_id?: number;
          media_type?: string;
          title?: string;
          original_title?: string | null;
          overview?: string | null;
          poster_path?: string | null;
          backdrop_path?: string | null;
          release_date?: string | null;
          runtime?: number | null;
          vote_average?: number | null;
          vote_count?: number | null;
          genres?: Json | null;
          metadata_updated_at?: string;
        };
        Relationships: [];
      };
      user_movies: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string;
          tmdb_id: number;
          status: MovieStatus;
          is_favorite: boolean;
          personal_rating: number | null;
          review: string | null;
          watched_date: string | null;
          added_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: string;
          tmdb_id: number;
          status?: MovieStatus;
          is_favorite?: boolean;
          personal_rating?: number | null;
          review?: string | null;
          watched_date?: string | null;
          added_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          movie_id?: string;
          tmdb_id?: number;
          status?: MovieStatus;
          is_favorite?: boolean;
          personal_rating?: number | null;
          review?: string | null;
          watched_date?: string | null;
          added_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          is_public: boolean;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          is_public?: boolean;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          is_public?: boolean;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_movies: {
        Row: {
          id: string;
          collection_id: string;
          movie_id: string;
          tmdb_id: number;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          movie_id: string;
          tmdb_id: number;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          movie_id?: string;
          tmdb_id?: number;
          position?: number;
          added_at?: string;
        };
        Relationships: [];
      };
      movie_activities: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string | null;
          tmdb_id: number | null;
          activity_type: "viewed" | "added" | "watched";
          occurred_at: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id?: string | null;
          tmdb_id?: number | null;
          activity_type: "viewed" | "added" | "watched";
          occurred_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          movie_id?: string | null;
          tmdb_id?: number | null;
          activity_type?: "viewed" | "added" | "watched";
          occurred_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          plan: "free" | "pro" | "premium";
          status: "active" | "canceled" | "past_due" | "trialing";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          plan?: "free" | "pro" | "premium";
          status?: "active" | "canceled" | "past_due" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          plan?: "free" | "pro" | "premium";
          status?: "active" | "canceled" | "past_due" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_featured_spotlight: {
        Row: {
          id: string;
          tmdb_id: number;
          title: string;
          poster_path: string | null;
          backdrop_path: string | null;
          priority: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tmdb_id: number;
          title: string;
          poster_path?: string | null;
          backdrop_path?: string | null;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tmdb_id?: number;
          title?: string;
          poster_path?: string | null;
          backdrop_path?: string | null;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: "info" | "warning" | "success";
          target: "all" | "pro" | "premium";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          type?: "info" | "warning" | "success";
          target?: "all" | "pro" | "premium";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          type?: "info" | "warning" | "success";
          target?: "all" | "pro" | "premium";
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_feature_flags: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          description?: string | null;
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_moderation_records: {
        Row: {
          id: string;
          author: string;
          body: string;
          target_title: string;
          flag_reason: string | null;
          status: "pending" | "dismissed" | "removed";
          created_at: string;
        };
        Insert: {
          id?: string;
          author: string;
          body: string;
          target_title: string;
          flag_reason?: string | null;
          status?: "pending" | "dismissed" | "removed";
          created_at?: string;
        };
        Update: {
          id?: string;
          author?: string;
          body?: string;
          target_title?: string;
          flag_reason?: string | null;
          status?: "pending" | "dismissed" | "removed";
          created_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { user_uid?: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
