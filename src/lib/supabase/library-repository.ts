import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Movie, Collection, TimelineActivity } from "@/types";

export interface FetchResult<T> {
  data: T[];
  error: Error | null;
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
    return { data: [], error: error ? new Error(error.message) : new Error("Failed to fetch user library") };
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
      error: colErr ? new Error(colErr.message) : new Error("Failed to fetch user collections"),
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
      error: error ? new Error(error.message) : new Error("Failed to fetch user activities"),
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
 * Upserts a movie record into the user's Supabase library.
 */
export async function upsertUserMovie(
  supabase: SupabaseClient<Database>,
  userId: string,
  movie: Movie
): Promise<boolean> {
  const tmdbId = movie.tmdb_id || movie.id;
  if (!tmdbId) return false;

  // 1. Ensure movie exists in shared movies cache
  const { data: movieRecord, error: catalogErr } = await supabase
    .from("movies")
    .upsert(
      {
        tmdb_id: tmdbId,
        title: movie.title,
        original_title: movie.original_title || movie.title,
        overview: movie.overview || null,
        poster_path: movie.poster_path || null,
        backdrop_path: movie.backdrop_path || null,
        release_date: movie.release_date || null,
        runtime: movie.runtime || null,
        vote_average: movie.vote_average || null,
        vote_count: movie.vote_count || null,
        genres: movie.genres ? (movie.genres as any) : null,
        metadata_updated_at: new Date().toISOString(),
      },
      { onConflict: "tmdb_id" }
    )
    .select("id")
    .single();

  if (catalogErr || !movieRecord) {
    console.error("Failed to catalog movie in Supabase:", catalogErr);
    return false;
  }

  // 2. Upsert into user_movies
  const { error: userMovieErr } = await supabase.from("user_movies").upsert(
    {
      user_id: userId,
      movie_id: movieRecord.id,
      tmdb_id: tmdbId,
      status: movie.status || "want",
      is_favorite: Boolean(movie.is_favorite),
      personal_rating: movie.rating ?? null,
      review: movie.review ?? null,
      watched_date: movie.watched_date ?? null,
      added_at: movie.created_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tmdb_id" }
  );

  return !userMovieErr;
}

/**
 * Removes a movie from the user's Supabase library.
 */
export async function deleteUserMovie(
  supabase: SupabaseClient<Database>,
  userId: string,
  tmdbId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("user_movies")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId);

  return !error;
}

/**
 * Creates a collection in Supabase and inserts initial movie associations.
 */
export async function createUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collection: Collection
): Promise<string | null> {
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
    console.error("Failed to create collection:", error);
    return null;
  }

  const newId = data.id;
  const movieIds = collection.movie_ids || [];

  for (let i = 0; i < movieIds.length; i++) {
    const tmdbId = movieIds[i];
    const { data: catMovie } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_id", tmdbId)
      .maybeSingle();

    if (catMovie) {
      await supabase.from("collection_movies").insert({
        collection_id: newId,
        movie_id: catMovie.id,
        tmdb_id: tmdbId,
        position: i,
        added_at: new Date().toISOString(),
      });
    }
  }

  return newId;
}

/**
 * Updates collection details in Supabase.
 */
export async function updateUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string,
  updates: Partial<Collection>
): Promise<boolean> {
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

  if (error) return false;

  // Synchronize collection_movies membership and ordering if movie_ids was provided
  if (updates.movie_ids !== undefined) {
    const movieIds = updates.movie_ids;
    await supabase.from("collection_movies").delete().eq("collection_id", collectionId);

    for (let i = 0; i < movieIds.length; i++) {
      const tmdbId = movieIds[i];
      const { data: catMovie } = await supabase
        .from("movies")
        .select("id")
        .eq("tmdb_id", tmdbId)
        .maybeSingle();

      if (catMovie) {
        await supabase.from("collection_movies").insert({
          collection_id: collectionId,
          movie_id: catMovie.id,
          tmdb_id: tmdbId,
          position: i,
          added_at: new Date().toISOString(),
        });
      }
    }
  }

  return true;
}

/**
 * Deletes a collection from Supabase.
 */
export async function deleteUserCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Adds an activity record to the user's movie journey in Supabase.
 */
export async function recordMovieActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  activity: Omit<TimelineActivity, "id">
): Promise<boolean> {
  let catalogMovieId: string | null = null;
  if (activity.tmdb_id) {
    const { data: m } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_id", activity.tmdb_id)
      .maybeSingle();
    if (m) catalogMovieId = m.id;
  }

  const { error } = await supabase.from("movie_activities").insert({
    user_id: userId,
    movie_id: catalogMovieId,
    tmdb_id: activity.tmdb_id || null,
    activity_type: activity.type as "viewed" | "added" | "watched",
    occurred_at: activity.occurred_at || new Date().toISOString(),
    metadata: activity.metadata ? (activity.metadata as any) : null,
    created_at: new Date().toISOString(),
  });

  return !error;
}
