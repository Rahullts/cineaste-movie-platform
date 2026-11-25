import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Movie, Collection, TimelineActivity } from "@/types";

export interface FetchResult<T> {
  data: T[];
  error: Error | null;
}

export interface RepoResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  isAuthError?: boolean;
}

export function isSupabaseAuthFailure(err: {
  code?: string;
  message?: string;
  status?: number;
} | null | undefined): boolean {
  if (!err) return false;
  const code = String(err.code || "");
  const msg = String(err.message || "").toLowerCase();
  return (
    err.status === 401 ||
    code === "PGRST301" ||
    code === "PGRST302" ||
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("auth session missing") ||
    msg.includes("not authenticated")
  );
}

/**
 * Resolves the UUID in public.movies for a TMDB film cleanly without violating RLS:
 * 1. Existing SELECT check
 * 2. SECURITY DEFINER RPC ensure_movie_catalog_entry
 * 3. Server /api/library/catalog fallback (admin/service role when configured)
 * 4. Direct insert fallback (for admin accounts)
 */
export async function ensureCatalogMovieId(
  supabase: SupabaseClient<Database>,
  movie: Pick<
    Movie,
    | "id"
    | "tmdb_id"
    | "title"
    | "original_title"
    | "overview"
    | "poster_path"
    | "backdrop_path"
    | "release_date"
    | "runtime"
    | "vote_average"
    | "vote_count"
    | "genres"
  >
): Promise<RepoResult<string>> {
  const tmdbId = Number(movie.tmdb_id || movie.id);
  if (!tmdbId || Number.isNaN(tmdbId) || tmdbId <= 0) {
    return { ok: false, error: "Invalid TMDB movie ID." };
  }

  // 1. Reuse existing catalog entry without attempting blocked updates
  const { data: existing, error: selErr } = await supabase
    .from("movies")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, data: existing.id };
  }
  if (selErr && isSupabaseAuthFailure(selErr)) {
    return {
      ok: false,
      error: selErr.message,
      code: selErr.code,
      isAuthError: true,
    };
  }

  const title = (movie.title || "Untitled Film").trim() || "Untitled Film";

  // 2. Authenticated SECURITY DEFINER RPC (safe, atomic, non-destructive)
  const { data: rpcId, error: rpcErr } = await supabase.rpc(
    "ensure_movie_catalog_entry",
    {
      p_tmdb_id: tmdbId,
      p_title: title,
      p_original_title: movie.original_title || title,
      p_overview: movie.overview || null,
      p_poster_path: movie.poster_path || null,
      p_backdrop_path: movie.backdrop_path || null,
      p_release_date: movie.release_date || null,
      p_runtime: movie.runtime ?? null,
      p_vote_average: movie.vote_average ?? null,
      p_vote_count: movie.vote_count ?? null,
      p_genres: movie.genres ? (movie.genres as any) : null,
    }
  );

  if (!rpcErr && rpcId) {
    return { ok: true, data: rpcId };
  }
  if (rpcErr && isSupabaseAuthFailure(rpcErr)) {
    return {
      ok: false,
      error: rpcErr.message,
      code: rpcErr.code,
      isAuthError: true,
    };
  }

  // 3. Direct insert attempt (succeeds if caller is admin or table permits insert)
  const payload = {
    tmdb_id: tmdbId,
    title,
    original_title: movie.original_title || title,
    overview: movie.overview || null,
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    release_date: movie.release_date || null,
    runtime: movie.runtime ?? null,
    vote_average: movie.vote_average ?? null,
    vote_count: movie.vote_count ?? null,
    genres: movie.genres ? (movie.genres as any) : null,
    metadata_updated_at: new Date().toISOString(),
  };

  const { data: directIns, error: directErr } = await supabase
    .from("movies")
    .insert(payload)
    .select("id")
    .single();

  if (!directErr && directIns?.id) {
    return { ok: true, data: directIns.id };
  }

  if (directErr?.code === "23505") {
    const { data: raced } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_id", tmdbId)
      .maybeSingle();
    if (raced?.id) {
      return { ok: true, data: raced.id };
    }
  }

  // 4. Server route fallback in browser context
  if (typeof window !== "undefined") {
    try {
      const apiRes = await fetch("/api/library/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await apiRes.json().catch(() => null);
      if (apiRes.ok && json?.id) {
        return { ok: true, data: json.id };
      }
      if (apiRes.status === 401) {
        return {
          ok: false,
          error: json?.error || "Authentication session expired.",
          code: "401",
          isAuthError: true,
        };
      }
      if (json?.error) {
        return {
          ok: false,
          error: json.error,
          code: json.code || String(apiRes.status),
        };
      }
    } catch {
      // Fall through to report exact Postgres error below
    }
  }

  const finalErr = directErr || rpcErr || selErr;
  return {
    ok: false,
    error: finalErr?.message || "Failed to catalog movie in Supabase.",
    code: finalErr?.code,
    isAuthError: isSupabaseAuthFailure(finalErr),
  };
}

/**
 * Fetches all user library movies from Supabase joined with cached movie metadata,
 * preserving error distinction so callers do not confuse network failure with an empty vault.
 */
export async function fetchUserLibraryResult(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FetchResult<Movie>> {
  const { data, error } = await supabase
    .from("user_movies")
    .select(
      `
      id,
      tmdb_id,
      status,
      is_favorite,
      personal_rating,
      review,
      watched_date,
      added_at,
      updated_at,
      movies:movie_id (
        id,
        title,
        original_title,
        overview,
        poster_path,
        backdrop_path,
        release_date,
        runtime,
        vote_average,
        vote_count,
        genres
      )
    `
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching user library from Supabase:", error);
    return {
      data: [],
      error: error ? new Error(error.message) : new Error("Failed to fetch user library"),
    };
  }

  return {
    error: null,
    data: data.map((row: any) => {
      const meta = row.movies || {};
      return {
        id: row.tmdb_id,
        tmdb_id: row.tmdb_id,
        title: meta.title || "Untitled Film",
        original_title: meta.original_title,
        overview: meta.overview,
        poster_path: meta.poster_path,
        backdrop_path: meta.backdrop_path,
        release_date: meta.release_date,
        runtime: meta.runtime,
        vote_average: meta.vote_average ? Number(meta.vote_average) : undefined,
        vote_count: meta.vote_count,
        genres: meta.genres || [],
        status: row.status,
        is_favorite: row.is_favorite,
        rating: row.personal_rating !== null ? Number(row.personal_rating) : undefined,
        review: row.review || undefined,
        watched_date: row.watched_date || undefined,
        watched_at: row.status === "watched" ? row.updated_at : undefined,
        created_date: row.added_at,
        updated_date: row.updated_at,
      };
    }),
  };
}

export async function fetchUserLibrary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Movie[]> {
  const res = await fetchUserLibraryResult(supabase, userId);
  return res.data;
}

/**
 * Fetches all collections for the user with nested collection movies.
 */
export async function fetchUserCollectionsResult(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FetchResult<Collection>> {
  const { data: collections, error: colErr } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (colErr || !collections) {
    console.error("Error fetching user collections from Supabase:", colErr);
    return {
      data: [],
      error: colErr
        ? new Error(colErr.message)
        : new Error("Failed to fetch user collections"),
    };
  }

  const results: Collection[] = [];

  for (const col of collections) {
    const { data: colMovies } = await supabase
      .from("collection_movies")
      .select(
        `
        tmdb_id,
        position,
        movies:movie_id (
          id,
          title,
          poster_path,
          backdrop_path,
          release_date,
          runtime,
          vote_average
        )
      `
      )
      .eq("collection_id", col.id)
      .order("position", { ascending: true });

    const movieIds: number[] = [];
    const movies: Movie[] = [];

    (colMovies || []).forEach((cm: any) => {
      movieIds.push(cm.tmdb_id);
      const meta = cm.movies || {};
      movies.push({
        id: cm.tmdb_id,
        tmdb_id: cm.tmdb_id,
        title: meta.title || "Film",
        poster_path: meta.poster_path,
        backdrop_path: meta.backdrop_path,
        release_date: meta.release_date,
        runtime: meta.runtime,
        vote_average: meta.vote_average ? Number(meta.vote_average) : undefined,
      });
    });

    results.push({
      id: col.id,
      title: col.name,
      description: col.description || undefined,
      color: col.color,
      is_public: col.is_public,
      cover_url: col.cover_url || undefined,
      movie_count: movieIds.length,
      movie_ids: movieIds,
      movies,
      created_at: col.created_at,
      updated_at: col.updated_at,
    });
  }

  return { data: results, error: null };
}

export async function fetchUserCollections(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Collection[]> {
  const res = await fetchUserCollectionsResult(supabase, userId);
  return res.data;
}

/**
 * Fetches user movie journey timeline activities.
 */
export async function fetchUserActivitiesResult(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FetchResult<TimelineActivity>> {
  const { data, error } = await supabase
    .from("movie_activities")
    .select(
      `
      id,
      activity_type,
      tmdb_id,
      occurred_at,
      metadata,
      movies:movie_id (
        title,
        poster_path
      )
    `
    )
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(300);

  if (error || !data) {
    console.error("Error fetching user activities:", error);
    return {
      data: [],
      error: error
        ? new Error(error.message)
        : new Error("Failed to fetch user activities"),
    };
  }

  return {
    error: null,
    data: data.map((row: any) => {
      const meta = row.movies || {};
      return {
        id: row.id,
        type: row.activity_type,
        tmdb_id: row.tmdb_id,
        title: meta.title || row.metadata?.title || "Movie Event",
        poster_path: meta.poster_path || row.metadata?.poster_path,
        rating: row.metadata?.rating,
        review: row.metadata?.review,
        metadata: row.metadata || undefined,
        occurred_at: row.occurred_at,
      };
    }),
  };
}

export async function fetchUserActivities(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TimelineActivity[]> {
  const res = await fetchUserActivitiesResult(supabase, userId);
  return res.data;
}

/**
 * Upserts a movie record into the user's Supabase library with full error propagation.
 */
export async function upsertUserMovieResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  movie: Movie
): Promise<RepoResult> {
  const tmdbId = Number(movie.tmdb_id || movie.id);
  if (!tmdbId || Number.isNaN(tmdbId)) {
    return { ok: false, error: "Invalid TMDB movie ID." };
  }

  const catalogRes = await ensureCatalogMovieId(supabase, movie);
  if (!catalogRes.ok || !catalogRes.data) {
    return {
      ok: false,
      error: catalogRes.error || "Failed to catalog movie in Supabase.",
      code: catalogRes.code,
      isAuthError: catalogRes.isAuthError,
    };
  }

  const nowIso = new Date().toISOString();
  const { error: userMovieErr } = await supabase.from("user_movies").upsert(
    {
      user_id: userId,
      movie_id: catalogRes.data,
      tmdb_id: tmdbId,
      status: movie.status || "want",
      is_favorite: Boolean(movie.is_favorite),
      personal_rating: movie.rating ?? null,
      review: movie.review ?? null,
      watched_date: movie.watched_date ?? null,
      added_at: movie.created_date || nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,tmdb_id" }
  );

  if (userMovieErr) {
    return {
      ok: false,
      error: userMovieErr.message,
      code: userMovieErr.code,
      isAuthError: isSupabaseAuthFailure(userMovieErr),
    };
  }

  return { ok: true };
}

export async function upsertUserMovie(
  supabase: SupabaseClient<Database>,
  userId: string,
  movie: Movie
): Promise<boolean> {
  const res = await upsertUserMovieResult(supabase, userId, movie);
  return res.ok;
}

export async function deleteUserMovieResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  tmdbId: number
): Promise<RepoResult> {
  const { error } = await supabase
    .from("user_movies")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId);

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  return { ok: true };
}

export async function deleteUserMovie(
  supabase: SupabaseClient<Database>,
  userId: string,
  tmdbId: number
): Promise<boolean> {
  const res = await deleteUserMovieResult(supabase, userId, tmdbId);
  return res.ok;
}

/**
 * Creates a collection in Supabase and ensures all initial films exist in public.movies
 * before writing collection_movies associations.
 */
export async function createUserCollectionResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  collection: Collection
): Promise<RepoResult<string>> {
  const moviesList = collection.movies || [];
  const movieIds = collection.movie_ids || moviesList.map((m) => m.tmdb_id || m.id);
  const resolvedCatalogIds: { tmdbId: number; catalogId: string }[] = [];

  for (const tmdbId of movieIds) {
    const movieObj = moviesList.find((m) => (m.tmdb_id || m.id) === tmdbId) || {
      id: tmdbId,
      tmdb_id: tmdbId,
      title: `Film #${tmdbId}`,
    };
    const catRes = await ensureCatalogMovieId(supabase, movieObj);
    if (!catRes.ok || !catRes.data) {
      return {
        ok: false,
        error: catRes.error || `Failed to catalog film ${movieObj.title}`,
        code: catRes.code,
        isAuthError: catRes.isAuthError,
      };
    }
    resolvedCatalogIds.push({ tmdbId, catalogId: catRes.data });
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: collection.title.trim(),
      description: collection.description || null,
      color: collection.color || "#00D664",
      is_public: collection.is_public ?? true,
      cover_url: collection.cover_url || null,
      created_at: collection.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message || "Failed to create collection.",
      code: error?.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  const newId = data.id;

  if (resolvedCatalogIds.length > 0) {
    const rows = resolvedCatalogIds.map((item, idx) => ({
      collection_id: newId,
      movie_id: item.catalogId,
      tmdb_id: item.tmdbId,
      position: idx,
      added_at: new Date().toISOString(),
    }));

    const { error: linkErr } = await supabase
      .from("collection_movies")
      .upsert(rows, { onConflict: "collection_id,movie_id", ignoreDuplicates: true });

    if (linkErr) {
      await supabase.from("collections").delete().eq("id", newId).eq("user_id", userId);
      return {
        ok: false,
        error: linkErr.message,
        code: linkErr.code,
        isAuthError: isSupabaseAuthFailure(linkErr),
      };
    }
  }

  return { ok: true, data: newId };
}

export async function createUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collection: Collection
): Promise<string | null> {
  const res = await createUserCollectionResult(supabase, userId, collection);
  return res.ok ? res.data || null : null;
}

export async function addMovieToUserCollectionResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string,
  movie: Movie,
  position: number
): Promise<RepoResult> {
  const tmdbId = Number(movie.tmdb_id || movie.id);
  const catRes = await ensureCatalogMovieId(supabase, movie);
  if (!catRes.ok || !catRes.data) {
    return {
      ok: false,
      error: catRes.error || "Failed to catalog film for collection.",
      code: catRes.code,
      isAuthError: catRes.isAuthError,
    };
  }

  const { error: insertErr } = await supabase.from("collection_movies").upsert(
    {
      collection_id: collectionId,
      movie_id: catRes.data,
      tmdb_id: tmdbId,
      position,
      added_at: new Date().toISOString(),
    },
    { onConflict: "collection_id,movie_id", ignoreDuplicates: true }
  );

  if (insertErr) {
    return {
      ok: false,
      error: insertErr.message,
      code: insertErr.code,
      isAuthError: isSupabaseAuthFailure(insertErr),
    };
  }

  await supabase
    .from("collections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  return { ok: true };
}

export async function removeMovieFromUserCollectionResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string,
  tmdbId: number
): Promise<RepoResult> {
  const { error } = await supabase
    .from("collection_movies")
    .delete()
    .eq("collection_id", collectionId)
    .eq("tmdb_id", tmdbId);

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  await supabase
    .from("collections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  return { ok: true };
}

export async function updateUserCollectionResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string,
  updates: Partial<Collection>
): Promise<RepoResult> {
  let resolvedCatalogIds: { tmdbId: number; catalogId: string }[] | null = null;
  if (updates.movie_ids !== undefined) {
    resolvedCatalogIds = [];
    const movieObjs = updates.movies || [];
    for (const tmdbId of updates.movie_ids) {
      const mObj = movieObjs.find((m) => (m.tmdb_id || m.id) === tmdbId) || {
        id: tmdbId,
        tmdb_id: tmdbId,
        title: `Film #${tmdbId}`,
      };
      const catRes = await ensureCatalogMovieId(supabase, mObj);
      if (!catRes.ok || !catRes.data) {
        return {
          ok: false,
          error: catRes.error || "Failed to resolve collection film metadata.",
          code: catRes.code,
          isAuthError: catRes.isAuthError,
        };
      }
      resolvedCatalogIds.push({ tmdbId, catalogId: catRes.data });
    }
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title) payload.name = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.color) payload.color = updates.color;
  if (updates.is_public !== undefined) payload.is_public = updates.is_public;
  if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url;

  const { error } = await supabase
    .from("collections")
    .update(payload)
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  if (resolvedCatalogIds !== null) {
    const { error: delErr } = await supabase
      .from("collection_movies")
      .delete()
      .eq("collection_id", collectionId);
    if (delErr) {
      return {
        ok: false,
        error: delErr.message,
        code: delErr.code,
        isAuthError: isSupabaseAuthFailure(delErr),
      };
    }

    if (resolvedCatalogIds.length > 0) {
      const rows = resolvedCatalogIds.map((item, idx) => ({
        collection_id: collectionId,
        movie_id: item.catalogId,
        tmdb_id: item.tmdbId,
        position: idx,
        added_at: new Date().toISOString(),
      }));
      const { error: insErr } = await supabase
        .from("collection_movies")
        .upsert(rows, { onConflict: "collection_id,movie_id", ignoreDuplicates: true });
      if (insErr) {
        return {
          ok: false,
          error: insErr.message,
          code: insErr.code,
          isAuthError: isSupabaseAuthFailure(insErr),
        };
      }
    }
  }

  return { ok: true };
}

export async function updateUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string,
  updates: Partial<Collection>
): Promise<boolean> {
  const res = await updateUserCollectionResult(supabase, userId, collectionId, updates);
  return res.ok;
}

export async function deleteUserCollectionResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string
): Promise<RepoResult> {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  return { ok: true };
}

export async function deleteUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string
): Promise<boolean> {
  const res = await deleteUserCollectionResult(supabase, userId, collectionId);
  return res.ok;
}

export async function recordMovieActivityResult(
  supabase: SupabaseClient<Database>,
  userId: string,
  activity: Omit<TimelineActivity, "id">
): Promise<RepoResult> {
  let catalogMovieId: string | null = null;
  if (activity.tmdb_id) {
    const { data: m } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_id", activity.tmdb_id)
      .maybeSingle();
    if (m) catalogMovieId = m.id;
  }

  const metadataPayload = {
    ...(activity.metadata || {}),
    ...(activity.title ? { title: activity.title } : {}),
    ...(activity.poster_path ? { poster_path: activity.poster_path } : {}),
    ...(activity.rating !== undefined ? { rating: activity.rating } : {}),
    ...(activity.review !== undefined ? { review: activity.review } : {}),
  };

  const { error } = await supabase.from("movie_activities").insert({
    user_id: userId,
    movie_id: catalogMovieId,
    tmdb_id: activity.tmdb_id || null,
    activity_type: activity.type as "viewed" | "added" | "watched",
    occurred_at: activity.occurred_at || new Date().toISOString(),
    metadata: Object.keys(metadataPayload).length > 0 ? (metadataPayload as any) : null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      isAuthError: isSupabaseAuthFailure(error),
    };
  }

  return { ok: true };
}

export async function recordMovieActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  activity: Omit<TimelineActivity, "id">
): Promise<boolean> {
  const res = await recordMovieActivityResult(supabase, userId, activity);
  return res.ok;
}
