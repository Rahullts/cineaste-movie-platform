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
-- ==============================================================================
-- CINEASTE: SUPABASE SCHEMA MIGRATION 02 - ROW LEVEL SECURITY POLICIES
-- ==============================================================================
-- Idempotent, non-destructive migration establishing strict RLS enforcement.
-- Guarantees user vault isolation, protects user preferences from public exposure,
-- hardens admin verification without parameter leakage, protects feature flags,
-- and restricts shared movie catalog writes to trusted server-side operations.
--
-- DEPENDENCY ORDERING GUARANTEE:
-- All policies that potentially reference public.is_admin(UUID) are dropped FIRST
-- before public.is_admin(UUID) is dropped, ensuring clean execution without CASCADE.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: DROP ALL DEPENDENT POLICIES FIRST
-- Ensures public.is_admin(UUID) can be safely dropped without CASCADE errors
-- ------------------------------------------------------------------------------

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable based on visibility preference" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;

-- User Preferences Policies
DROP POLICY IF EXISTS "Users have full control over own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Admins can view preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Public profile visibility preferences are readable" ON public.user_preferences;

-- User Roles Policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Movies (Catalog Cache) Policies
DROP POLICY IF EXISTS "Movies metadata is viewable by all users" ON public.movies;
DROP POLICY IF EXISTS "Authenticated users can insert movies metadata" ON public.movies;
DROP POLICY IF EXISTS "Authenticated users can update movies metadata" ON public.movies;
DROP POLICY IF EXISTS "Only admins or service role can insert movies" ON public.movies;
DROP POLICY IF EXISTS "Only admins or service role can update movies" ON public.movies;
DROP POLICY IF EXISTS "Only admins can delete movies metadata" ON public.movies;

-- User Movies (Library Vault) Policies
DROP POLICY IF EXISTS "Users can view own library or public friends if allowed" ON public.user_movies;
DROP POLICY IF EXISTS "Users can insert into their own library" ON public.user_movies;
DROP POLICY IF EXISTS "Users can update only their own library items" ON public.user_movies;
DROP POLICY IF EXISTS "Users can delete only their own library items" ON public.user_movies;

-- Collections & Collection Movies Policies
DROP POLICY IF EXISTS "Users can view own collections or public collections" ON public.collections;
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
DROP POLICY IF EXISTS "Collection movies are viewable if collection is viewable" ON public.collection_movies;
DROP POLICY IF EXISTS "Users can insert movies into their own collections" ON public.collection_movies;
DROP POLICY IF EXISTS "Users can update movies in their own collections" ON public.collection_movies;
DROP POLICY IF EXISTS "Users can remove movies from their own collections" ON public.collection_movies;

-- Movie Activities (Timeline) Policies
DROP POLICY IF EXISTS "Users can view own timeline or public activities" ON public.movie_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.movie_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.movie_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.movie_activities;

-- Admin Platform Tables Policies
DROP POLICY IF EXISTS "Public can view active spotlight" ON public.admin_featured_spotlight;
DROP POLICY IF EXISTS "Admins have full control over spotlight" ON public.admin_featured_spotlight;
DROP POLICY IF EXISTS "Public can view active announcements" ON public.admin_announcements;
DROP POLICY IF EXISTS "Announcements viewable by target plan" ON public.admin_announcements;
DROP POLICY IF EXISTS "Admins have full control over announcements" ON public.admin_announcements;
DROP POLICY IF EXISTS "Public can view enabled feature flags" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Feature flags are viewable by status or admin" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Admins have full control over feature flags" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Only admins can view moderation queue" ON public.admin_moderation_records;
DROP POLICY IF EXISTS "Only admins can view or create audit logs" ON public.admin_audit_logs;

-- User Subscriptions Policies (if table exists from previous migration 04 run)
DO $$
BEGIN
  IF to_regclass('public.user_subscriptions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
    DROP POLICY IF EXISTS "Only service role or admin can manage subscriptions" ON public.user_subscriptions;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 2: DROP THE LEGACY PARAMETERIZED FUNCTION (NO CASCADE USED)
-- Safe to execute now because all dependent policies were explicitly removed above.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- ------------------------------------------------------------------------------
-- STEP 3: CREATE HARDENED SECURITY DEFINER HELPERS
-- Execute with fixed search_path to prevent search-path hijacking.
-- ------------------------------------------------------------------------------

-- Helper A: Hardened Admin Verification (Zero Parameters)
-- Evaluates only the currently authenticated caller (auth.uid()).
-- Prevents callers from probing arbitrary users' admin status.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Helper B: Checks whether a user's profile is configured as public.
-- NOTE ON VISIBILITY: 'friends' is safely treated as private because no social
-- friendship/follows table currently exists in Cineaste. Only 'public' exposes data.
CREATE OR REPLACE FUNCTION public.is_profile_public(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id
      AND profile_visibility = 'public'
  );
$$;

-- Helper C: Checks whether a user has explicitly exposed their watchlist
CREATE OR REPLACE FUNCTION public.is_watchlist_public(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id
      AND profile_visibility = 'public'
      AND show_watchlist = true
  );
$$;

-- Helper D: Checks whether a user has explicitly exposed their cinema timeline
CREATE OR REPLACE FUNCTION public.is_activity_public(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id
      AND profile_visibility = 'public'
      AND show_activity = true
  );
$$;

-- Helper E: Resolves the subscription plan of the caller for announcement targeting
-- Evaluates subscription status:
-- - 'active' or 'trialing': grants current paid plan
-- - 'canceled': preserves paid access until current_period_end if still valid
-- - 'past_due' or expired: safely falls back to 'free'
-- Uses dynamic query to tolerate fresh database deployment before Migration 04
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- If user_subscriptions table has not been provisioned yet, default to 'free'
  IF to_regclass('public.user_subscriptions') IS NULL THEN
    RETURN 'free';
  END IF;

  EXECUTE 'SELECT plan, status, current_period_end FROM public.user_subscriptions WHERE user_id = $1'
  INTO v_plan, v_status, v_period_end
  USING auth.uid();

  -- If no subscription row exists, default to 'free'
  IF v_plan IS NULL THEN
    RETURN 'free';
  END IF;

  -- 1. Active or trialing: grant current plan
  IF v_status IN ('active', 'trialing') THEN
    RETURN v_plan;
  END IF;

  -- 2. Canceled but still within paid period: grant current plan until current_period_end
  IF v_status = 'canceled' AND v_period_end IS NOT NULL AND v_period_end > timezone('utc'::text, now()) THEN
    RETURN v_plan;
  END IF;

  -- 3. Any other status ('past_due', expired 'canceled', etc.): revert to 'free'
  RETURN 'free';
END;
$$;

-- Grant execution on helpers to authenticated and anon users for RLS evaluation
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_profile_public(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_watchlist_public(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_activity_public(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan() TO authenticated, anon;

-- ------------------------------------------------------------------------------
-- STEP 4: ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_featured_spotlight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_moderation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- STEP 5: RECREATE RLS POLICIES USING HARDENED HELPERS
-- ------------------------------------------------------------------------------

-- 1. PROFILES POLICIES
CREATE POLICY "Profiles are viewable based on visibility preference"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_profile_public(id)
    OR public.is_admin()
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update only their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. USER PREFERENCES POLICIES
-- STRICT PRIVACY: User preferences rows are NEVER exposed publicly.
-- Only the owning user or platform admins can read or modify preferences.
CREATE POLICY "Users have full control over own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view preferences"
  ON public.user_preferences FOR SELECT
  USING (public.is_admin());

-- 3. USER ROLES POLICIES (Server Guarded - Users cannot elevate own role)
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());

-- 4. MOVIES CATALOG POLICIES (Shared public cache)
-- Public read access preserved. Direct client writes REMOVED.
-- Writes restricted to server-side operations via Supabase service role (which bypasses RLS)
-- or verified platform administrators.
CREATE POLICY "Movies metadata is viewable by all users"
  ON public.movies FOR SELECT
  USING (true);

CREATE POLICY "Only admins or service role can insert movies"
  ON public.movies FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins or service role can update movies"
  ON public.movies FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete movies metadata"
  ON public.movies FOR DELETE
  USING (public.is_admin());

-- 5. USER MOVIES POLICIES (Strict User Vault Isolation)
CREATE POLICY "Users can view own library or public friends if allowed"
  ON public.user_movies FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_watchlist_public(user_id)
    OR public.is_admin()
  );

CREATE POLICY "Users can insert into their own library"
  ON public.user_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own library items"
  ON public.user_movies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own library items"
  ON public.user_movies FOR DELETE
  USING (auth.uid() = user_id);

-- 6. COLLECTIONS & COLLECTION MOVIES POLICIES
CREATE POLICY "Users can view own collections or public collections"
  ON public.collections FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
    OR public.is_admin()
  );

CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Movies membership depends on parent collection ownership/visibility
CREATE POLICY "Collection movies are viewable if collection is viewable"
  ON public.collection_movies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_movies.collection_id
        AND (user_id = auth.uid() OR is_public = true OR public.is_admin())
    )
  );

CREATE POLICY "Users can insert movies into their own collections"
  ON public.collection_movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_movies.collection_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update movies in their own collections"
  ON public.collection_movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_movies.collection_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_movies.collection_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove movies from their own collections"
  ON public.collection_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_movies.collection_id
        AND user_id = auth.uid()
    )
  );

-- 7. MOVIE ACTIVITIES / TIMELINE POLICIES
CREATE POLICY "Users can view own timeline or public activities"
  ON public.movie_activities FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_activity_public(user_id)
    OR public.is_admin()
  );

CREATE POLICY "Users can insert their own activities"
  ON public.movie_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.movie_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.movie_activities FOR DELETE
  USING (auth.uid() = user_id);

-- 8. ADMIN PLATFORM TABLES POLICIES
CREATE POLICY "Public can view active spotlight"
  ON public.admin_featured_spotlight FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins have full control over spotlight"
  ON public.admin_featured_spotlight FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Announcements Policy: Enforces plan targeting ('all', 'pro', 'premium')
CREATE POLICY "Announcements viewable by target plan"
  ON public.admin_announcements FOR SELECT
  USING (
    (is_active = true AND (
      target = 'all'
      OR (auth.uid() IS NOT NULL AND (
        target = public.get_user_plan()
        OR (target = 'pro' AND public.get_user_plan() = 'premium')
      ))
    ))
    OR public.is_admin()
  );

CREATE POLICY "Admins have full control over announcements"
  ON public.admin_announcements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Feature Flags Policy: Ordinary users can ONLY view enabled flags.
-- Admins can view all flags (including disabled flags).
CREATE POLICY "Feature flags are viewable by status or admin"
  ON public.admin_feature_flags FOR SELECT
  USING (enabled = true OR public.is_admin());

CREATE POLICY "Admins have full control over feature flags"
  ON public.admin_feature_flags FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can view moderation queue"
  ON public.admin_moderation_records FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can view or create audit logs"
  ON public.admin_audit_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
-- ==============================================================================
-- CINEASTE: SUPABASE STORAGE MIGRATION 03 - AVATARS BUCKET & POLICIES
-- ==============================================================================
-- Idempotent, non-destructive migration establishing public avatar storage.
-- Isolates uploaded images to per-user subfolders keyed by auth.uid().
-- Enforces ownership on both old and new paths during updates.
-- ==============================================================================

-- 1. Create or update public 'avatars' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for avatars bucket in storage.objects

-- A. Avatar images are publicly viewable by anyone (read-only)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- B. Authenticated users can upload avatars strictly into their own folder: {userId}/*
DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- C. Users can replace or update avatars strictly within their own folder.
--    Validates ownership on both old row (USING) and new row (WITH CHECK).
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- D. Users can delete avatars strictly from their own folder
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
-- ==============================================================================
-- CINEASTE: SUPABASE SUBSCRIPTION MIGRATION 04 - SECURE SUBSCRIPTIONS & STRIPE
-- ==============================================================================
-- Idempotent, non-destructive migration establishing subscription records.
-- Restricts subscription modifications strictly to service-role (Stripe webhooks)
-- and verified admins. Prevents client-side plan escalation.
-- Uses zero-parameter is_admin() and safe existing-table upgrades.
-- ==============================================================================

-- 1. Create Subscriptions Table if not exists
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing-table upgrade: ensures all columns exist if table predated this migration
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Safe non-destructive constraint addition (NOT VALID prevents failure on legacy records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_subscriptions_plan'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT chk_user_subscriptions_plan
      CHECK (plan IN ('free', 'pro', 'premium'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_subscriptions_status'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT chk_user_subscriptions_status
      CHECK (status IN ('active', 'canceled', 'past_due', 'trialing'))
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subs_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_customer_id ON public.user_subscriptions(provider_customer_id);

-- 2. Database Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_set_updated_at_user_subscriptions ON public.user_subscriptions;
CREATE TRIGGER trigger_set_updated_at_user_subscriptions
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Automatic New User Default Free Subscription Trigger
-- Coexists cleanly with handle_new_user() from migration 01
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Restrict execution: trigger functions should not be callable by arbitrary users
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user_subscription() TO postgres, service_role;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- 4. Backfill existing users with free subscriptions if missing
INSERT INTO public.user_subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 5. Optimized Static Subscription Plan Helper
-- Since public.user_subscriptions is now definitively present, update helper with direct query
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT plan, status, current_period_end
  INTO v_plan, v_status, v_period_end
  FROM public.user_subscriptions
  WHERE user_id = auth.uid();

  IF v_plan IS NULL THEN
    RETURN 'free';
  END IF;

  -- 1. Active or trialing: grant current plan
  IF v_status IN ('active', 'trialing') THEN
    RETURN v_plan;
  END IF;

  -- 2. Canceled but still within paid period: grant current plan until current_period_end
  IF v_status = 'canceled' AND v_period_end IS NOT NULL AND v_period_end > timezone('utc'::text, now()) THEN
    RETURN v_plan;
  END IF;

  -- 3. Any other status ('past_due', expired 'canceled', etc.): revert to 'free'
  RETURN 'free';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_plan() TO authenticated, anon;

-- 6. Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- A. Users can view their own subscription status; admins can view all
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- B. Subscriptions can ONLY be modified by service role processes (Stripe Webhook API)
--    or verified platform administrators. Clients cannot grant themselves Pro/Premium.
DROP POLICY IF EXISTS "Only service role or admin can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Only service role or admin can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
