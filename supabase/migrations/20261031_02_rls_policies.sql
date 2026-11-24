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
