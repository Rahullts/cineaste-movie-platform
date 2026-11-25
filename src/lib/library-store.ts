"use client";

import * as React from "react";
import type { Movie, Collection, TimelineActivity } from "@/types";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchUserLibraryResult,
  fetchUserCollectionsResult,
  fetchUserActivitiesResult,
  upsertUserMovie,
  deleteUserMovie,
  createUserCollection,
  updateUserCollection,
  deleteUserCollection,
  recordMovieActivity,
} from "@/lib/supabase/library-repository";
import { migrateLocalDataToSupabase } from "@/lib/supabase/migration-service";
import {
  loadScopedLocalLibrary,
  saveScopedLocalEntity,
} from "@/lib/library-storage";

export interface LibraryState {
  movies: Movie[];
  collections: Collection[];
  activities: TimelineActivity[];
  isLoaded: boolean;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (tmdbId: number) => void;
  markWatched: (movie: Movie, rating?: number, review?: string) => void;
  toggleFavorite: (movie: Movie) => void;
  updateStatus: (tmdbId: number, status: Movie["status"]) => void;
  updateRating: (tmdbId: number, rating?: number, review?: string) => void;
  createCollection: (
    title: string,
    color?: string,
    description?: string,
    initialMovies?: Movie[]
  ) => Collection;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addMovieToCollection: (collectionId: string, movie: Movie) => void;
  removeMovieFromCollection: (collectionId: string, tmdbId: number) => void;
  reorderCollectionMovies: (collectionId: string, movieIds: number[]) => void;
  addActivity: (activity: Omit<TimelineActivity, "id" | "occurred_at">) => void;
  trackMovieViewed: (movie: Movie) => void;
  batchImportMovies: (
    importedMovies: Movie[],
    importedActivities?: TimelineActivity[]
  ) => { added: number; updated: number; skipped: number };
}

export function useLibrary(): LibraryState {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [activities, setActivities] = React.useState<TimelineActivity[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
  const activeUserIdRef = React.useRef<string | null>(null);
  const loadSeqRef = React.useRef(0);

  // Load from Supabase when authenticated, otherwise use strictly scoped guest storage (empty on fresh visit)
  const loadData = React.useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const supabase = getBrowserClient();

    const applyLocalScope = (uid: string | null) => {
      const scoped = loadScopedLocalLibrary(uid);
      if (seq !== loadSeqRef.current) return;
      setMovies(scoped.movies);
      setCollections(scoped.collections);
      setActivities(scoped.activities);
      setIsLoaded(true);
    };

    if (!supabase || !isSupabaseConfigured) {
      activeUserIdRef.current = null;
      setActiveUserId(null);
      applyLocalScope(null);
      return;
    }

    let uidForFallback: string | null = activeUserIdRef.current;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (seq !== loadSeqRef.current) return;

      if (!session?.user) {
        if (activeUserIdRef.current !== null) {
          // Immediately clear any prior authenticated user's in-memory state on sign-out
          setMovies([]);
          setCollections([]);
          setActivities([]);
        }
        activeUserIdRef.current = null;
        setActiveUserId(null);
        applyLocalScope(null);
        return;
      }

      const uid = session.user.id;
      uidForFallback = uid;

      if (activeUserIdRef.current !== uid) {
        // Clear previous scope immediately before fetching new user's cloud data
        setMovies([]);
        setCollections([]);
        setActivities([]);
        setIsLoaded(false);
      }
      activeUserIdRef.current = uid;
      setActiveUserId(uid);

      // Ensure genuine guest items are safely migrated (and demo items stripped) before reading cloud state
      await migrateLocalDataToSupabase(supabase, uid).catch((err) => {
        console.warn("Guest-to-cloud migration deferred:", err);
      });

      if (seq !== loadSeqRef.current) return;

      // Fetch cloud records in parallel with explicit error flags
      const [moviesRes, collectionsRes, activitiesRes] = await Promise.all([
        fetchUserLibraryResult(supabase, uid),
        fetchUserCollectionsResult(supabase, uid),
        fetchUserActivitiesResult(supabase, uid),
      ]);

      if (seq !== loadSeqRef.current) return;

      const scopedFallback =
        moviesRes.error || collectionsRes.error || activitiesRes.error
          ? loadScopedLocalLibrary(uid)
          : null;

      if (!moviesRes.error) {
        setMovies(moviesRes.data);
        saveScopedLocalEntity(uid, "movies", moviesRes.data);
      } else {
        setMovies(scopedFallback?.movies || []);
      }

      if (!collectionsRes.error) {
        setCollections(collectionsRes.data);
        saveScopedLocalEntity(uid, "collections", collectionsRes.data);
      } else {
        setCollections(scopedFallback?.collections || []);
      }

      if (!activitiesRes.error) {
        setActivities(activitiesRes.data);
        saveScopedLocalEntity(uid, "activities", activitiesRes.data);
      } else {
        setActivities(scopedFallback?.activities || []);
      }
    } catch (err) {
      console.warn("Could not load from Supabase; using scoped fallback:", err);
      if (seq !== loadSeqRef.current) return;
      applyLocalScope(uidForFallback);
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoaded(true);
      }
    }
  }, []);

  React.useEffect(() => {
    // Synchronously hydrate ONLY for genuine unauthenticated guest sessions (never auto-seeds demo movies)
    try {
      const hasAuthSessionToken = Object.keys(localStorage).some(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
      );
      if (!hasAuthSessionToken) {
        const guestLib = loadScopedLocalLibrary(null);
        setMovies(guestLib.movies);
        setCollections(guestLib.collections);
        setActivities(guestLib.activities);
      }
    } catch {}

    loadData();

    const handleLibraryChange = (event: Event) => {
      const custom = event as CustomEvent<{
        uid?: string | null;
        type?: "movies" | "collections" | "activities";
        data?: any;
      }>;
      if (custom.detail && custom.detail.type) {
        // Ignore events from a different auth scope and apply same-tab mutations directly
        if ((custom.detail.uid ?? null) !== activeUserIdRef.current) return;
        if (custom.detail.type === "movies" && Array.isArray(custom.detail.data)) {
          setMovies(custom.detail.data);
        } else if (custom.detail.type === "collections" && Array.isArray(custom.detail.data)) {
          setCollections(custom.detail.data);
        } else if (custom.detail.type === "activities" && Array.isArray(custom.detail.data)) {
          setActivities(custom.detail.data);
        }
        return;
      }
      loadData();
    };

    const handleRefresh = () => loadData();
    const handleStorage = () => loadData();

    window.addEventListener("cineaste:library-change", handleLibraryChange);
    window.addEventListener("cineaste:library-refresh", handleRefresh);
    window.addEventListener("storage", handleStorage);

    const supabase = getBrowserClient();
    let authSub: { unsubscribe: () => void } | null = null;
    if (supabase && isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        const nextUid = session?.user?.id || null;
        if (event === "SIGNED_OUT" || nextUid !== activeUserIdRef.current) {
          activeUserIdRef.current = nextUid;
          setActiveUserId(nextUid);
          setMovies([]);
          setCollections([]);
          setActivities([]);
        }
        loadData();
      });
      authSub = data.subscription;
    }

    return () => {
      window.removeEventListener("cineaste:library-change", handleLibraryChange);
      window.removeEventListener("cineaste:library-refresh", handleRefresh);
      window.removeEventListener("storage", handleStorage);
      authSub?.unsubscribe();
    };
  }, [loadData]);

  // Save to strictly user-scoped v3 localStorage and notify sibling hooks in the same scope
  const notifyChanges = (type: "movies" | "collections" | "activities", data: any) => {
    try {
      const uid = activeUserIdRef.current;
      saveScopedLocalEntity(uid, type, data);
      window.dispatchEvent(
        new CustomEvent("cineaste:library-change", { detail: { uid, type, data } })
      );
    } catch {}
  };

  const addActivity = (activity: Omit<TimelineActivity, "id" | "occurred_at">) => {
    const occurred_at = new Date().toISOString();
    const newEntry: TimelineActivity = {
      ...activity,
      id: "act-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      occurred_at,
    };
    const updated = [newEntry, ...activities];
    setActivities(updated);
    notifyChanges("activities", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      recordMovieActivity(supabase, activeUserId, {
        ...activity,
        occurred_at,
      }).catch((err) => console.error("Cloud activity sync failed:", err));
    }
  };

  const trackMovieViewed = (movie: Movie) => {
    const tmdbId = movie.tmdb_id || movie.id;
    if (!tmdbId) return;

    const now = Date.now();
    const isRecent = activities.some(
      (a) =>
        a.type === "viewed" &&
        a.tmdb_id === tmdbId &&
        now - new Date(a.occurred_at).getTime() < 30 * 60 * 1000
    );
    if (isRecent) return;

    addActivity({
      type: "viewed",
      tmdb_id: tmdbId,
      title: movie.title,
      poster_path: movie.poster_path,
    });
  };

  const addToWatchlist = (movie: Movie) => {
    const targetId = movie.tmdb_id || movie.id;
    const existing = movies.find((m) => (m.tmdb_id || m.id) === targetId);
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      targetMovie = {
        ...existing,
        tmdb_id: existing.tmdb_id || targetId,
        id: existing.id || targetId,
        status: "want",
        updated_date: new Date().toISOString(),
      };
      updated = movies.map((m) => ((m.tmdb_id || m.id) === targetId ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
        id: targetId,
        tmdb_id: targetId,
        status: "want",
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      updated = [targetMovie, ...movies];
    }

    setMovies(updated);
    notifyChanges("movies", updated);

    addActivity({
      type: "added",
      tmdb_id: targetId,
      title: movie.title,
      poster_path: movie.poster_path,
    });

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      upsertUserMovie(supabase, activeUserId, targetMovie).catch((err) =>
        console.error("Cloud watchlist sync failed:", err)
      );
    }
  };

  const removeFromWatchlist = (tmdbId: number) => {
    const updated = movies.filter((m) => (m.tmdb_id || m.id) !== tmdbId);
    setMovies(updated);
    notifyChanges("movies", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      deleteUserMovie(supabase, activeUserId, tmdbId).catch((err) =>
        console.error("Cloud remove sync failed:", err)
      );
    }
  };

  const markWatched = (movie: Movie, rating?: number, review?: string) => {
    const targetId = movie.tmdb_id || movie.id;
    const existing = movies.find((m) => (m.tmdb_id || m.id) === targetId);
    const dateStr = new Date().toISOString().split("T")[0];
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      targetMovie = {
        ...existing,
        tmdb_id: existing.tmdb_id || targetId,
        id: existing.id || targetId,
        status: "watched",
        watched_date: dateStr,
        rating: rating !== undefined ? rating : existing.rating,
        review: review !== undefined ? review : existing.review,
        updated_date: new Date().toISOString(),
      };
      updated = movies.map((m) => ((m.tmdb_id || m.id) === targetId ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
        id: targetId,
        tmdb_id: targetId,
        status: "watched",
        watched_date: dateStr,
        rating,
        review,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      updated = [targetMovie, ...movies];
    }

    setMovies(updated);
    notifyChanges("movies", updated);

    addActivity({
      type: "watched",
      tmdb_id: targetId,
      title: movie.title,
      poster_path: movie.poster_path,
      rating,
      review,
    });

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      upsertUserMovie(supabase, activeUserId, targetMovie).catch((err) =>
        console.error("Cloud watched sync failed:", err)
      );
    }
  };

  const toggleFavorite = (movie: Movie) => {
    const targetId = movie.tmdb_id || movie.id;
    const existing = movies.find((m) => (m.tmdb_id || m.id) === targetId);
    let isNowFavorite = true;
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      isNowFavorite = !existing.is_favorite;
      targetMovie = {
        ...existing,
        tmdb_id: existing.tmdb_id || targetId,
        id: existing.id || targetId,
        is_favorite: isNowFavorite,
        updated_date: new Date().toISOString(),
      };
      updated = movies.map((m) => ((m.tmdb_id || m.id) === targetId ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
        id: targetId,
        tmdb_id: targetId,
        is_favorite: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      updated = [targetMovie, ...movies];
    }

    setMovies(updated);
    notifyChanges("movies", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      upsertUserMovie(supabase, activeUserId, targetMovie).catch((err) =>
        console.error("Cloud favorite sync failed:", err)
      );
    }
  };

  const updateStatus = (tmdbId: number, status: Movie["status"]) => {
    let targetMovie: Movie | null = null;
    const updated = movies.map((m) => {
      if ((m.tmdb_id || m.id) === tmdbId) {
        targetMovie = {
          ...m,
          status,
          updated_date: new Date().toISOString(),
          watched_date:
            status === "watched"
              ? m.watched_date || new Date().toISOString().split("T")[0]
              : m.watched_date,
        };
        return targetMovie;
      }
      return m;
    });

    setMovies(updated);
    notifyChanges("movies", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId && targetMovie) {
      upsertUserMovie(supabase, activeUserId, targetMovie).catch((err) =>
        console.error("Cloud status sync failed:", err)
      );
    }
  };

  const updateRating = (tmdbId: number, rating?: number, review?: string) => {
    let targetMovie: Movie | null = null;
    const updated = movies.map((m) => {
      if ((m.tmdb_id || m.id) === tmdbId) {
        targetMovie = {
          ...m,
          rating: rating !== undefined ? rating : m.rating,
          review: review !== undefined ? review : m.review,
          updated_date: new Date().toISOString(),
        };
        return targetMovie;
      }
      return m;
    });

    setMovies(updated);
    notifyChanges("movies", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId && targetMovie) {
      upsertUserMovie(supabase, activeUserId, targetMovie).catch((err) =>
        console.error("Cloud rating sync failed:", err)
      );
    }
  };

  const createCollection = (
    title: string,
    color: string = "#00D664",
    description: string = "",
    initialMovies?: Movie[]
  ): Collection => {
    const movieIds = (initialMovies || []).map((m) => m.tmdb_id || m.id);
    const newCol: Collection = {
      id: "col-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: description.trim(),
      color,
      is_public: true,
      movie_count: movieIds.length,
      movie_ids: movieIds,
      movies: initialMovies || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newCol, ...collections];
    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      createUserCollection(supabase, activeUserId, newCol).then((cloudId) => {
        if (cloudId) {
          // Update collection with persistent UUID from cloud
          setCollections((prev) =>
            prev.map((c) => (c.id === newCol.id ? { ...c, id: cloudId } : c))
          );
        }
      });
    }

    return newCol;
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    const updated = collections.map((col) => {
      if (col.id === id) {
        return {
          ...col,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return col;
    });

    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      updateUserCollection(supabase, activeUserId, id, updates).catch((err) =>
        console.error("Cloud collection update failed:", err)
      );
    }
  };

  const deleteCollection = (id: string) => {
    const updated = collections.filter((col) => col.id !== id);
    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      deleteUserCollection(supabase, activeUserId, id).catch((err) =>
        console.error("Cloud collection delete failed:", err)
      );
    }
  };

  const addMovieToCollection = (collectionId: string, movie: Movie) => {
    const movieId = movie.tmdb_id || movie.id;
    let targetCol: Collection | null = null;

    const updated = collections.map((col) => {
      if (col.id === collectionId) {
        const existingIds = col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
        if (existingIds.includes(movieId)) return col;
        const newIds = [...existingIds, movieId];
        const newMovies = [...(col.movies || []), movie];
        targetCol = {
          ...col,
          movie_ids: newIds,
          movies: newMovies,
          movie_count: newIds.length,
          updated_at: new Date().toISOString(),
        };
        return targetCol;
      }
      return col;
    });

    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId && targetCol) {
      updateUserCollection(supabase, activeUserId, collectionId, {
        movie_ids: (targetCol as any).movie_ids,
      }).catch((err) => console.error("Cloud collection add failed:", err));
    }
  };

  const removeMovieFromCollection = (collectionId: string, tmdbId: number) => {
    let targetCol: Collection | null = null;
    const updated = collections.map((col) => {
      if (col.id === collectionId) {
        const existingIds = col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
        const newIds = existingIds.filter((id) => id !== tmdbId);
        const newMovies = (col.movies || []).filter((m) => (m.tmdb_id || m.id) !== tmdbId);
        targetCol = {
          ...col,
          movie_ids: newIds,
          movies: newMovies,
          movie_count: newIds.length,
          updated_at: new Date().toISOString(),
        };
        return targetCol;
      }
      return col;
    });

    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId && targetCol) {
      updateUserCollection(supabase, activeUserId, collectionId, {
        movie_ids: (targetCol as any).movie_ids,
      }).catch((err) => console.error("Cloud collection remove failed:", err));
    }
  };

  const reorderCollectionMovies = (collectionId: string, movieIds: number[]) => {
    const updated = collections.map((col) => {
      if (col.id === collectionId) {
        const movieMap = new Map((col.movies || []).map((m) => [m.tmdb_id || m.id, m]));
        const orderedMovies = movieIds
          .map((id) => movieMap.get(id))
          .filter((m): m is Movie => Boolean(m));
        return {
          ...col,
          movie_ids: movieIds,
          movies: orderedMovies,
          updated_at: new Date().toISOString(),
        };
      }
      return col;
    });

    setCollections(updated);
    notifyChanges("collections", updated);

    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      updateUserCollection(supabase, activeUserId, collectionId, {
        movie_ids: movieIds,
      }).catch((err) => console.error("Cloud collection reorder failed:", err));
    }
  };

  const batchImportMovies = (
    importedMovies: Movie[],
    importedActivities?: TimelineActivity[]
  ): { added: number; updated: number; skipped: number } => {
    let addedCount = 0;
    let updatedCount = 0;

    const movieMap = new Map<number, Movie>();
    movies.forEach((m) => movieMap.set(m.tmdb_id, m));

    importedMovies.forEach((incoming) => {
      const existing = movieMap.get(incoming.tmdb_id);
      if (existing) {
        movieMap.set(incoming.tmdb_id, {
          ...existing,
          ...incoming,
          is_favorite: existing.is_favorite || incoming.is_favorite,
          rating: incoming.rating ?? existing.rating,
          review: incoming.review ?? existing.review,
          status: incoming.status || existing.status,
          watched_date: incoming.watched_date || existing.watched_date,
          updated_date: new Date().toISOString(),
        });
        updatedCount++;
      } else {
        movieMap.set(incoming.tmdb_id, {
          ...incoming,
          created_date: incoming.created_date || new Date().toISOString(),
        });
        addedCount++;
      }
    });

    const newMovieList = Array.from(movieMap.values());
    setMovies(newMovieList);
    notifyChanges("movies", newMovieList);

    if (importedActivities && importedActivities.length > 0) {
      const newActs = [...importedActivities, ...activities];
      setActivities(newActs);
      notifyChanges("activities", newActs);
    }

    // Ingest into Supabase if authenticated
    const supabase = getBrowserClient();
    if (supabase && activeUserId) {
      importedMovies.forEach((m) => {
        upsertUserMovie(supabase, activeUserId, m).catch(() => {});
      });
    }

    return { added: addedCount, updated: updatedCount, skipped: 0 };
  };

  return {
    movies,
    collections,
    activities,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    markWatched,
    toggleFavorite,
    updateStatus,
    updateRating,
    createCollection,
    updateCollection,
    deleteCollection,
    addMovieToCollection,
    removeMovieFromCollection,
    reorderCollectionMovies,
    addActivity,
    trackMovieViewed,
    batchImportMovies,
  };
}
