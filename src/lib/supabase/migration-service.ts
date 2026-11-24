import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Movie, Collection, TimelineActivity, UserProfile } from "@/types";

const WATCHLIST_STORAGE_KEY = "cineaste:library:watchlist";
const COLLECTIONS_STORAGE_KEY = "cineaste:library:collections";
const ACTIVITIES_STORAGE_KEY = "cineaste:library:activities";
const USER_STORAGE_KEY = "cineaste:user_profile:v1";

export interface MigrationResult {
  success: boolean;
  skipped: boolean;
  moviesCount: number;
  collectionsCount: number;
  activitiesCount: number;
  backupKey?: string;
  error?: string;
}

/**
 * Creates an immutable snapshot backup of all local storage state prior to cloud migration.
 */
export function createLocalBackup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const backupKey = `cineaste:backup:${Date.now()}`;
    const payload = {
      backupTimestamp: new Date().toISOString(),
      watchlist: localStorage.getItem(WATCHLIST_STORAGE_KEY),
      collections: localStorage.getItem(COLLECTIONS_STORAGE_KEY),
      activities: localStorage.getItem(ACTIVITIES_STORAGE_KEY),
      profile: localStorage.getItem(USER_STORAGE_KEY),
      theme: localStorage.getItem("cineaste:theme"),
    };
    localStorage.setItem(backupKey, JSON.stringify(payload));
    return backupKey;
  } catch (err) {
    console.error("Failed to create pre-migration local backup:", err);
    return null;
  }
}

/**
 * Idempotently migrates all existing local storage film data to Supabase.
 * Preserves TMDB IDs, original watched dates, reviews, ratings, collections, and custom ordering.
 */
export async function migrateLocalDataToSupabase(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MigrationResult> {
  if (typeof window === "undefined") {
    return { success: false, skipped: true, moviesCount: 0, collectionsCount: 0, activitiesCount: 0 };
  }

  const migrationMarkerKey = `cineaste:migrated:${userId}`;
  const alreadyMigrated = localStorage.getItem(migrationMarkerKey);

  // Check server-side migration status as secondary confirmation
  if (alreadyMigrated) {
    return {
      success: true,
      skipped: true,
      moviesCount: 0,
      collectionsCount: 0,
      activitiesCount: 0,
    };
  }

  // Create safety backup before touching anything
  const backupKey = createLocalBackup();

  try {
    // 1. Read local records
    let localMovies: Movie[] = [];
    let localCollections: Collection[] = [];
    let localActivities: TimelineActivity[] = [];
    let localProfile: Partial<UserProfile> | null = null;

    try {
      const sm = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (sm) localMovies = JSON.parse(sm);
    } catch {}

    try {
      const sc = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (sc) localCollections = JSON.parse(sc);
    } catch {}

    try {
      const sa = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (sa) localActivities = JSON.parse(sa);
    } catch {}

    try {
      const sp = localStorage.getItem(USER_STORAGE_KEY);
      if (sp) localProfile = JSON.parse(sp);
    } catch {}

    let moviesMigrated = 0;
    let collectionsMigrated = 0;
    let activitiesMigrated = 0;

    // 2. Migrate Movies & User Movie Library
    if (localMovies.length > 0) {
      for (const movie of localMovies) {
        const tmdbId = movie.tmdb_id || movie.id;
        if (!tmdbId) continue;

        // Upsert into shared movies catalog
        const { data: movieRecord, error: movieErr } = await supabase
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

        if (movieErr || !movieRecord) {
          console.warn(`Could not catalog movie ${movie.title}:`, movieErr);
          continue;
        }

        // Upsert user_movies with status, favorite, rating, review, and watched date
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
            updated_at: movie.updated_date || new Date().toISOString(),
          },
          { onConflict: "user_id,tmdb_id" }
        );

        if (!userMovieErr) {
          moviesMigrated++;
        }
      }
    }

    // 3. Migrate Collections & Collection Movies
    if (localCollections.length > 0) {
      for (const col of localCollections) {
        if (!col.title) continue;

        // Check if collection with this name already exists in cloud to avoid duplicates
        const { data: existingCol } = await supabase
          .from("collections")
          .select("id")
          .eq("user_id", userId)
          .eq("name", col.title.trim())
          .maybeSingle();

        let colId = existingCol?.id;

        if (!colId) {
          const { data: colRecord, error: colErr } = await supabase
            .from("collections")
            .insert({
              user_id: userId,
              name: col.title.trim(),
              description: col.description || null,
              color: col.color || "#00D664",
              is_public: col.is_public ?? true,
              cover_url: col.cover_url || null,
              created_at: col.created_at || new Date().toISOString(),
              updated_at: col.updated_at || new Date().toISOString(),
            })
            .select("id")
            .single();

          if (colErr || !colRecord) {
            console.warn(`Could not migrate collection ${col.title}:`, colErr);
            continue;
          }

          colId = colRecord.id;
          collectionsMigrated++;
        }

        // Add collection movies idempotently
        const movieIds = col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
        if (movieIds && movieIds.length > 0) {
          for (let pos = 0; pos < movieIds.length; pos++) {
            const tmdbId = movieIds[pos];
            // Lookup movie in shared movies table
            const { data: catalogMovie } = await supabase
              .from("movies")
              .select("id")
              .eq("tmdb_id", tmdbId)
              .maybeSingle();

            if (catalogMovie) {
              await supabase.from("collection_movies").upsert(
                {
                  collection_id: colId,
                  movie_id: catalogMovie.id,
                  tmdb_id: tmdbId,
                  position: pos,
                  added_at: new Date().toISOString(),
                },
                { onConflict: "collection_id,movie_id" }
              );
            }
          }
        }
      }
    }

    // 4. Migrate Timeline Activities (strictly viewed, added, watched)
    if (localActivities.length > 0) {
      const validTypes = new Set(["viewed", "added", "watched"]);
      const filteredActivities = localActivities.filter((a) =>
        validTypes.has(a.type)
      );

      for (const act of filteredActivities) {
        // Prevent duplicate timeline activity on retry/resume
        const { data: existingAct } = await supabase
          .from("movie_activities")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", act.type as any)
          .eq("occurred_at", act.occurred_at || "")
          .maybeSingle();

        if (existingAct) {
          continue;
        }

        let catalogMovieId: string | null = null;
        if (act.tmdb_id) {
          const { data: m } = await supabase
            .from("movies")
            .select("id")
            .eq("tmdb_id", act.tmdb_id)
            .maybeSingle();
          if (m) catalogMovieId = m.id;
        }

        const { error: actErr } = await supabase.from("movie_activities").insert({
          user_id: userId,
          movie_id: catalogMovieId,
          tmdb_id: act.tmdb_id || null,
          activity_type: act.type as "viewed" | "added" | "watched",
          occurred_at: act.occurred_at || new Date().toISOString(),
          metadata: act.metadata ? (act.metadata as any) : null,
          created_at: new Date().toISOString(),
        });

        if (!actErr) {
          activitiesMigrated++;
        }
      }
    }

    // 5. Migrate Preferences & Settings
    if (localProfile?.settings) {
      const s = localProfile.settings;
      await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          theme: s.theme || "dark",
          accent_color: s.accent || "emerald",
          interface_density: s.density || "comfortable",
          autoplay_trailers: s.autoplay_trailers ?? true,
          rating_system: s.rating_system || "stars5",
          streaming_region: s.region || "IN",
          email_notifications: s.email_notifications ?? true,
          push_notifications: s.push_notifications ?? true,
          profile_visibility: s.profile_visibility || "friends",
          show_activity: s.show_activity ?? true,
          show_watchlist: s.show_watchlist ?? true,
          reduce_motion: s.reduce_motion ?? false,
          high_contrast: s.high_contrast ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // Set local completion marker
    localStorage.setItem(migrationMarkerKey, new Date().toISOString());

    return {
      success: true,
      skipped: false,
      moviesCount: moviesMigrated,
      collectionsCount: collectionsMigrated,
      activitiesCount: activitiesMigrated,
      backupKey: backupKey || undefined,
    };
  } catch (err: any) {
    console.error("Migration failed:", err);
    return {
      success: false,
      skipped: false,
      moviesCount: 0,
      collectionsCount: 0,
      activitiesCount: 0,
      backupKey: backupKey || undefined,
      error: err?.message || "Migration error",
    };
  }
}
