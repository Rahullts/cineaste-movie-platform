-- ==============================================================================
-- CINEASTE: SUPABASE SCHEMA MIGRATION 01 - TABLES, INDEXES & TRIGGERS
-- ==============================================================================
-- Idempotent, non-destructive migration establishing Cineaste database schema.
-- Includes profiles, preferences, role management, catalog cache, personal vaults,
-- collections, journey timeline, admin infrastructure, and complete existing-table upgrades.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (1:1 with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  member_since TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'FMMonth YYYY'),
  preferred_genres TEXT[] NOT NULL DEFAULT ARRAY['Drama', 'Sci-Fi', 'Thriller']::TEXT[],
  region TEXT NOT NULL DEFAULT 'IN',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing-table upgrade: ensures all columns exist if table predated this migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT 'Cinephile';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'FMMonth YYYY');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_genres TEXT[] NOT NULL DEFAULT ARRAY['Drama', 'Sci-Fi', 'Thriller']::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'IN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES TABLE (1:1 with auth.users)
-- Private configuration row holding user display preferences and privacy settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  accent_color TEXT NOT NULL DEFAULT 'emerald',
  interface_density TEXT NOT NULL DEFAULT 'comfortable',
  autoplay_trailers BOOLEAN NOT NULL DEFAULT true,
  rating_system TEXT NOT NULL DEFAULT 'stars5',
  streaming_region TEXT NOT NULL DEFAULT 'IN',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  profile_visibility TEXT NOT NULL DEFAULT 'friends',
  show_activity BOOLEAN NOT NULL DEFAULT true,
  show_watchlist BOOLEAN NOT NULL DEFAULT true,
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  local_migrated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing-table upgrade columns
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'emerald';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS interface_density TEXT NOT NULL DEFAULT 'comfortable';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS autoplay_trailers BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS rating_system TEXT NOT NULL DEFAULT 'stars5';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS streaming_region TEXT NOT NULL DEFAULT 'IN';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'friends';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS show_activity BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS show_watchlist BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS reduce_motion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS high_contrast BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS local_migrated_at TIMESTAMPTZ;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Safe non-destructive constraint addition (NOT VALID prevents failure on legacy dirty records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_preferences_visibility'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_user_preferences_visibility
      CHECK (profile_visibility IN ('private', 'friends', 'public'))
      NOT VALID;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. USER ROLES TABLE (Server-Controlled Role Enforcement)
-- Separated from profiles to prevent client-side privilege escalation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_roles_role'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT chk_user_roles_role
      CHECK (role IN ('user', 'admin'))
      NOT VALID;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. SHARED MOVIES METADATA CACHE (Keyed by tmdb_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'movie',
  title TEXT NOT NULL,
  original_title TEXT,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  runtime INTEGER,
  vote_average NUMERIC(3, 1),
  vote_count INTEGER,
  genres JSONB,
  metadata_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing-table upgrade columns
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'movie';
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled Film';
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS original_title TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS runtime INTEGER;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS vote_average NUMERIC(3, 1);
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS vote_count INTEGER;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS genres JSONB;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS metadata_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_title ON public.movies(title);

-- ------------------------------------------------------------------------------
-- 5. USER MOVIE LIBRARY (User-specific status, ratings, reviews, favorites)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'want',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  personal_rating NUMERIC(3, 1),
  review TEXT,
  watched_date TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_movie UNIQUE (user_id, tmdb_id)
);

-- Existing-table upgrade columns
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'want';
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS personal_rating NUMERIC(3, 1);
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS watched_date TEXT;
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.user_movies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_movies_status'
  ) THEN
    ALTER TABLE public.user_movies
      ADD CONSTRAINT chk_user_movies_status
      CHECK (status IN ('want', 'watching', 'watched', 'dropped'))
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON public.user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON public.user_movies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_movies_favorite ON public.user_movies(user_id, is_favorite);

-- ------------------------------------------------------------------------------
-- 6. COLLECTIONS & COLLECTION MEMBERSHIP
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#00D664',
  is_public BOOLEAN NOT NULL DEFAULT true,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled Collection';
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#00D664';
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);

CREATE TABLE IF NOT EXISTS public.collection_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_collection_movie UNIQUE (collection_id, movie_id)
);

ALTER TABLE public.collection_movies ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.collection_movies ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_col_movies_collection ON public.collection_movies(collection_id);
CREATE INDEX IF NOT EXISTS idx_col_movies_position ON public.collection_movies(collection_id, position);

-- ------------------------------------------------------------------------------
-- 7. MOVIE ACTIVITIES / JOURNEY TIMELINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movie_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE SET NULL,
  tmdb_id INTEGER,
  activity_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.movie_activities ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'viewed';
ALTER TABLE public.movie_activities ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.movie_activities ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.movie_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_movie_activities_type'
  ) THEN
    ALTER TABLE public.movie_activities
      ADD CONSTRAINT chk_movie_activities_type
      CHECK (activity_type IN ('viewed', 'added', 'watched'))
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_user_timeline ON public.movie_activities(user_id, occurred_at DESC);

-- ------------------------------------------------------------------------------
-- 8. ADMIN PLATFORM TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_featured_spotlight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_featured_spotlight ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.admin_featured_spotlight ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.admin_featured_spotlight ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE public.admin_featured_spotlight ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE public.admin_featured_spotlight ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_announcements ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';
ALTER TABLE public.admin_announcements ADD COLUMN IF NOT EXISTS target TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.admin_announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.admin_announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_admin_announcements_type'
  ) THEN
    ALTER TABLE public.admin_announcements
      ADD CONSTRAINT chk_admin_announcements_type
      CHECK (type IN ('info', 'warning', 'success'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_admin_announcements_target'
  ) THEN
    ALTER TABLE public.admin_announcements
      ADD CONSTRAINT chk_admin_announcements_target
      CHECK (target IN ('all', 'pro', 'premium'))
      NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.admin_feature_flags ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admin_feature_flags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.admin_moderation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  target_title TEXT NOT NULL,
  flag_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_moderation_records ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE public.admin_moderation_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.admin_moderation_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_admin_moderation_status'
  ) THEN
    ALTER TABLE public.admin_moderation_records
      ADD CONSTRAINT chk_admin_moderation_status
      CHECK (status IN ('pending', 'dismissed', 'removed'))
      NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'system';
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.admin_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 9. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGERS
-- Ensures updated_at columns are reliably refreshed at the database layer
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trigger_set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_user_preferences ON public.user_preferences;
CREATE TRIGGER trigger_set_updated_at_user_preferences
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_user_movies ON public.user_movies;
CREATE TRIGGER trigger_set_updated_at_user_movies
  BEFORE UPDATE ON public.user_movies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_collections ON public.collections;
CREATE TRIGGER trigger_set_updated_at_collections
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_admin_feature_flags ON public.admin_feature_flags;
CREATE TRIGGER trigger_set_updated_at_admin_feature_flags
  BEFORE UPDATE ON public.admin_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_movies_metadata_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.metadata_updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_movies_metadata_updated_at ON public.movies;
CREATE TRIGGER trigger_set_movies_metadata_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW EXECUTE FUNCTION public.set_movies_metadata_updated_at();

-- ------------------------------------------------------------------------------
-- 10. USER SIGNUP AUTOMATION TRIGGER
-- Automatically provisions profiles, preferences, and default user role
-- Fixed duplicate LANGUAGE/SECURITY DEFINER declaration and secured search_path
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_username TEXT;
  clean_username TEXT;
BEGIN
  -- Extract initial handle from user email or metadata
  base_username := COALESCE(
    split_part(NEW.email, '@', 1),
    'cinephile_' || substring(replace(NEW.id::text, '-', '') from 1 for 6)
  );
  clean_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  IF clean_username = '' THEN
    clean_username := 'user_' || substring(replace(NEW.id::text, '-', '') from 1 for 6);
  END IF;

  -- Ensure username uniqueness with collision fallbacks
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
    clean_username := clean_username || '_' || substring(replace(NEW.id::text, '-', '') from 1 for 4);
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
    clean_username := 'cinephile_' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
  END IF;

  -- 1. Insert Profile
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    member_since,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    clean_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', clean_username),
    NEW.raw_user_meta_data->>'avatar_url',
    to_char(CURRENT_DATE, 'FMMonth YYYY'),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Preferences (Private by default)
  INSERT INTO public.user_preferences (
    user_id,
    theme,
    accent_color,
    interface_density,
    profile_visibility
  ) VALUES (
    NEW.id,
    'dark',
    'emerald',
    'comfortable',
    'friends'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert Default User Role ('user')
  INSERT INTO public.user_roles (
    user_id,
    role
  ) VALUES (
    NEW.id,
    'user'
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Restrict execution: trigger functions should not be callable by arbitrary users
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
