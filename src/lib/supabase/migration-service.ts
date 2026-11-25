import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Movie, UserProfile } from "@/types";
import {
  LEGACY_WATCHLIST_KEYS,
  LEGACY_COLLECTION_KEYS,
  LEGACY_ACTIVITY_KEYS,
  getWatchlistStorageKey,
  getCollectionsStorageKey,
  getActivitiesStorageKey,
  getUserProfileStorageKey,
  loadScopedLocalLibrary,
  getMovieTimestampMs,
  clearConsumedGuestLibraryStorage,
} from "@/lib/library-storage";

export interface MigrationResult {
  success: boolean;
  skipped: boolean;
  moviesCount: number;
  collectionsCount: number;
  activitiesCount: number;
  backupKey?: string;
  error?: string;
}

// Single-flight promise lock per userId so simultaneous callers (UserProvider + useLibrary) coalesce safely.
const inflightMigrations = new Map<string, Promise<MigrationResult>>();

/**
 * Creates an immutable snapshot backup of all local storage state prior to cloud migration.
 */
export function createLocalBackup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const backupKey = `cineaste:backup:${Date.now()}`;
    const legacyWatchlist: Record<string, string | null> = {};
    for (const k of LEGACY_WATCHLIST_KEYS) {
      legacyWatchlist[k] = localStorage.getItem(k);
    }
    const payload = {
      backupTimestamp: new Date().toISOString(),
      v3GuestWatchlist: localStorage.getItem(getWatchlistStorageKey(null)),
      v2GuestWatchlist: localStorage.getItem("cineaste:library:watchlist:v2:guest"),
      legacyWatchlist,
      v3GuestCollections: localStorage.getItem(getCollectionsStorageKey(null)),
      legacyCollections: localStorage.getItem(LEGACY_COLLECTION_KEYS[0]),
      v3GuestActivities: localStorage.getItem(getActivitiesStorageKey(null)),
      legacyActivities: localStorage.getItem(LEGACY_ACTIVITY_KEYS[0]),
      profile:
        localStorage.getItem(getUserProfileStorageKey(null)) ||
        localStorage.getItem("cineaste:user_profile:v1"),
      theme: localStorage.getItem("cineaste:theme"),
    };
    localStorage.setItem(backupKey, JSON.stringify(payload));
    return backupKey;
  } catch (err) {
    console.error("Failed to create pre-migration local backup:", err);
    return null;
  }
}

function parseServerTimeMs(row: {
  updated_at?: string | null;
  added_at?: string | null;
}): number {
  const t1 = row.updated_at ? new Date(row.updated_at).getTime() : 0;
  const t2 = row.added_at ? new Date(row.added_at).getTime() : 0;
  return Math.max(Number.isNaN(t1) ? 0 : t1, Number.isNaN(t2) ? 0 : t2);
}

/**
 * Safely merges genuine guest-saved local film data into the authenticated user's Supabase library.
 * - Filters out auto-seeded legacy demo records so fake films are never uploaded.
 * - Deduplicates movie records by tmdb_id.
 * - Never overwrites newer server-side records with stale local data.
 * - Clears consumed guest storage ONLY after clean commit so accounts stay isolated.
 */
export async function migrateLocalDataToSupabase(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MigrationResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      skipped: true,
      moviesCount: 0,
      collectionsCount: 0,
      activitiesCount: 0,
    };
  }

  const existingPromise = inflightMigrations.get(userId);
  if (existingPromise) {
    return existingPromise;
  }

  const run = async (): Promise<MigrationResult> => {
    // Load genuine (non-demo, deduplicated, upgraded v1/v2->v3) guest records
    const guestLib = loadScopedLocalLibrary(null);
    const localMovies: Movie[] = guestLib.movies;
    const localCollections = guestLib.collections;
    const localActivities = guestLib.activities;

    let localProfile: Partial<UserProfile> | null = null;
    try {
      const sp = localStorage.getItem(getUserProfileStorageKey(null));
      if (sp) localProfile = JSON.parse(sp);
    } catch {}

    const hasGuestWork =
      localMovies.length > 0 ||
      localCollections.length > 0 ||
      localActivities.length > 0 ||
      Boolean(localProfile?.settings);

    if (!hasGuestWork) {
      return {
        success: true,
        skipped: true,
        moviesCount: 0,
        collectionsCount: 0,
        activitiesCount: 0,
      };
    }

    const backupKey = createLocalBackup();

    try {
      let moviesMigrated = 0;
      let collectionsMigrated = 0;
      let activitiesMigrated = 0;
      let hadError = false;

      // 1. Fetch existing server-side user_movies upfront to avoid overwriting newer cloud records
      const serverMoviesMap = new Map<
        number,
        { updated_at: string; added_at: string }
      >();
      if (localMovies.length > 0) {
        const { data: existingServerRows, error: fetchErr } = await supabase
          .from("user_movies")
          .select("tmdb_id, updated_at, added_at")
          .eq("user_id", userId);

        if (fetchErr) {
          return {
            success: false,
            skipped: false,
            moviesCount: 0,
            collectionsCount: 0,
            activitiesCount: 0,
            backupKey: backupKey || undefined,
            error: fetchErr.message,
          };
        }

        (existingServerRows || []).forEach((r) => {
          serverMoviesMap.set(r.tmdb_id, {
            updated_at: r.updated_at,
            added_at: r.added_at,
          });
        });

        // 2. Migrate genuine movies without clobbering newer server records
        for (const movie of localMovies) {
          const tmdbId = Number(movie.tmdb_id || movie.id);
          if (!tmdbId) continue;

          const existingServer = serverMoviesMap.get(tmdbId);
          if (existingServer) {
            const serverMs = parseServerTimeMs(existingServer);
            const localMs = getMovieTimestampMs(movie);
            // Server is newer or equal -> do NOT overwrite server record with stale local data
            if (serverMs >= localMs) {
              continue;
            }
          }

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
            hadError = true;
            console.warn(`Could not catalog movie ${movie.title}:`, movieErr);
            continue;
          }

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

          if (userMovieErr) {
            hadError = true;
            console.warn(`Could not upsert user movie ${movie.title}:`, userMovieErr);
          } else {
            moviesMigrated++;
          }
        }
      }

      // 3. Migrate Collections & Collection Movies (non-destructive)
      if (localCollections.length > 0) {
        for (const col of localCollections) {
          if (!col.title) continue;

          const { data: existingCol, error: colLookupErr } = await supabase
            .from("collections")
            .select("id")
            .eq("user_id", userId)
            .eq("name", col.title.trim())
            .maybeSingle();

          if (colLookupErr) {
            hadError = true;
            continue;
          }

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
              hadError = true;
              console.warn(`Could not migrate collection ${col.title}:`, colErr);
              continue;
            }

            colId = colRecord.id;
            collectionsMigrated++;
          }

          const movieIds = col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
          if (movieIds && movieIds.length > 0) {
            for (let pos = 0; pos < movieIds.length; pos++) {
              const tmdbId = movieIds[pos];
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
                  { onConflict: "collection_id,movie_id", ignoreDuplicates: true }
                );
              }
            }
          }
        }
      }

      // 4. Migrate Timeline Activities (strictly viewed, added, watched)
      if (localActivities.length > 0) {
        const validTypes = new Set(["viewed", "added", "watched"]);
        const filteredActivities = localActivities.filter((a) => validTypes.has(a.type));

        for (const act of filteredActivities) {
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
          } else {
            hadError = true;
          }
        }
      }

      // 5. Migrate Guest Preferences ONLY if server has no preferences yet (never clobber existing account settings)
      if (localProfile?.settings) {
        const { data: existingPrefs } = await supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingPrefs) {
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
      }

      // Only clear consumed guest library storage when migration succeeded cleanly with no errors
      if (!hadError) {
        clearConsumedGuestLibraryStorage();
      }

      return {
        success: !hadError,
        skipped: false,
        moviesCount: moviesMigrated,
        collectionsCount: collectionsMigrated,
        activitiesCount: activitiesMigrated,
        backupKey: backupKey || undefined,
        error: hadError ? "Partial migration error; guest local backup preserved" : undefined,
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
  };

  const promise = run().finally(() => {
    inflightMigrations.delete(userId);
  });
  inflightMigrations.set(userId, promise);
  return promise;
}
