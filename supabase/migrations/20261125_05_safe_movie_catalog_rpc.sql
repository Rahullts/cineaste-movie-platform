-- ==============================================================================
-- CINEASTE: SUPABASE MIGRATION 05 - SAFE AUTHENTICATED MOVIE CATALOG RPC
-- ==============================================================================
-- Preserves public.movies RLS against direct malicious client overwrites while
-- allowing any authenticated user to ensure a TMDB catalog row exists before
-- writing to user_movies, collection_movies, or movie_activities.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ensure_movie_catalog_entry(
  p_tmdb_id INTEGER,
  p_title TEXT,
  p_original_title TEXT DEFAULT NULL,
  p_overview TEXT DEFAULT NULL,
  p_poster_path TEXT DEFAULT NULL,
  p_backdrop_path TEXT DEFAULT NULL,
  p_release_date TEXT DEFAULT NULL,
  p_runtime INTEGER DEFAULT NULL,
  p_vote_average NUMERIC DEFAULT NULL,
  p_vote_count INTEGER DEFAULT NULL,
  p_genres JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_movie_id UUID;
  v_clean_title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to catalog films' USING ERRCODE = '42501';
  END IF;

  IF p_tmdb_id IS NULL OR p_tmdb_id <= 0 THEN
    RAISE EXCEPTION 'Valid TMDB movie ID is required' USING ERRCODE = '22023';
  END IF;

  v_clean_title := COALESCE(NULLIF(btrim(p_title), ''), 'Untitled Film');

  INSERT INTO public.movies (
    tmdb_id,
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    runtime,
    vote_average,
    vote_count,
    genres,
    metadata_updated_at
  ) VALUES (
    p_tmdb_id,
    v_clean_title,
    COALESCE(NULLIF(btrim(p_original_title), ''), v_clean_title),
    p_overview,
    p_poster_path,
    p_backdrop_path,
    p_release_date,
    p_runtime,
    p_vote_average,
    p_vote_count,
    p_genres,
    timezone('utc'::text, now())
  )
  ON CONFLICT (tmdb_id) DO UPDATE SET
    overview = COALESCE(public.movies.overview, EXCLUDED.overview),
    poster_path = COALESCE(public.movies.poster_path, EXCLUDED.poster_path),
    backdrop_path = COALESCE(public.movies.backdrop_path, EXCLUDED.backdrop_path),
    release_date = COALESCE(public.movies.release_date, EXCLUDED.release_date),
    runtime = COALESCE(public.movies.runtime, EXCLUDED.runtime),
    vote_average = COALESCE(public.movies.vote_average, EXCLUDED.vote_average),
    vote_count = COALESCE(public.movies.vote_count, EXCLUDED.vote_count),
    genres = COALESCE(public.movies.genres, EXCLUDED.genres)
  RETURNING id INTO v_movie_id;

  RETURN v_movie_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_movie_catalog_entry(
  INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, INTEGER, JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_movie_catalog_entry(
  INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, INTEGER, JSONB
) TO authenticated;
