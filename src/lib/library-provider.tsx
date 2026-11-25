"use client";

import * as React from "react";
import type { Movie, Collection, TimelineActivity } from "@/types";
import { useUser } from "@/lib/user-context";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchUserLibraryResult,
  fetchUserCollectionsResult,
  fetchUserActivitiesResult,
  upsertUserMovieResult,
  deleteUserMovieResult,
  createUserCollectionResult,
  updateUserCollectionResult,
  addMovieToUserCollectionResult,
  removeMovieFromUserCollectionResult,
  deleteUserCollectionResult,
  recordMovieActivityResult,
  isSupabaseAuthFailure,
  type RepoResult,
} from "@/lib/supabase/library-repository";
import { migrateLocalDataToSupabase } from "@/lib/supabase/migration-service";
import {
  loadScopedLocalLibrary,
  saveScopedLocalEntity,
  dedupeMovies,
  getWatchlistStorageKey,
  getCollectionsStorageKey,
  getActivitiesStorageKey,
} from "@/lib/library-storage";
import { AlertCircle, RefreshCw, X } from "lucide-react";

export interface LibraryMutationResult {
  ok: boolean;
  error?: string;
  isAuthError?: boolean;
}

export interface LibraryState {
  movies: Movie[];
  collections: Collection[];
  activities: TimelineActivity[];
  isLoaded: boolean;
  syncError: string | null;
  clearSyncError: () => void;
  refreshLibrary: () => Promise<void>;
  resolveCollectionId: (id: string) => string;
  addToWatchlist: (movie: Movie) => Promise<LibraryMutationResult>;
  removeFromWatchlist: (tmdbId: number) => Promise<LibraryMutationResult>;
  markWatched: (
    movie: Movie,
    rating?: number,
    review?: string
  ) => Promise<LibraryMutationResult>;
  toggleFavorite: (movie: Movie) => Promise<LibraryMutationResult>;
  updateStatus: (
    tmdbId: number,
    status: Movie["status"]
  ) => Promise<LibraryMutationResult>;
  updateRating: (
    tmdbId: number,
    rating?: number,
    review?: string
  ) => Promise<LibraryMutationResult>;
  createCollection: (
    title: string,
    color?: string,
    description?: string,
    initialMovies?: Movie[]
  ) => Collection;
  updateCollection: (
    id: string,
    updates: Partial<Collection>
  ) => Promise<LibraryMutationResult>;
  deleteCollection: (id: string) => Promise<LibraryMutationResult>;
  addMovieToCollection: (
    collectionId: string,
    movie: Movie
  ) => Promise<LibraryMutationResult>;
  removeMovieFromCollection: (
    collectionId: string,
    tmdbId: number
  ) => Promise<LibraryMutationResult>;
  reorderCollectionMovies: (
    collectionId: string,
    movieIds: number[]
  ) => Promise<LibraryMutationResult>;
  addActivity: (
    activity: Omit<TimelineActivity, "id" | "occurred_at">
  ) => Promise<void>;
  trackMovieViewed: (movie: Movie) => Promise<void>;
  batchImportMovies: (
    importedMovies: Movie[],
    importedActivities?: TimelineActivity[]
  ) => { added: number; updated: number; skipped: number };
}

const SYNC_CHANNEL_NAME = "cineaste-library-sync";

interface SyncBroadcastPayload {
  type: "LIBRARY_UPDATED";
  uid: string | null;
  sender: string;
  movies?: Movie[];
  collections?: Collection[];
  activities?: TimelineActivity[];
}

const LibraryContext = React.createContext<LibraryState | null>(null);

function formatSyncErrorMessage(
  res: { error?: string; code?: string; isAuthError?: boolean },
  fallbackAction: string
): string {
  if (res.isAuthError) {
    return "Your session has expired. Changes could not be saved to your cloud library — please sign in again.";
  }
  if (res.code === "42501") {
    return `Database permission denied while trying to ${fallbackAction}. Changes were reverted.`;
  }
  return res.error
    ? `Could not ${fallbackAction}: ${res.error}`
    : `Could not ${fallbackAction}. Changes were reverted.`;
}

function getMovieId(movie: Pick<Movie, "id" | "tmdb_id">): number {
  return Number(movie.tmdb_id || movie.id);
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoaded: isUserLoaded } = useUser();

  const activeUserId: string | null | undefined = React.useMemo(() => {
    if (!isUserLoaded) return undefined;
    if (isAuthenticated && user?.id && user.id !== "guest-cinephile") {
      return user.id;
    }
    return null;
  }, [isUserLoaded, isAuthenticated, user?.id]);

  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [activities, setActivities] = React.useState<TimelineActivity[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // Authoritative synchronous refs so concurrent handlers never read stale closures
  const moviesRef = React.useRef<Movie[]>([]);
  const collectionsRef = React.useRef<Collection[]>([]);
  const activitiesRef = React.useRef<TimelineActivity[]>([]);
  const activeUserIdRef = React.useRef<string | null | undefined>(activeUserId);

  // Concurrency, ordering, and cross-tab sync coordination refs
  const mutationEpochRef = React.useRef(0);
  const activeMutationCountRef = React.useRef(0);
  const pendingRevalidateRef = React.useRef(false);
  const lastCloudSyncAtRef = React.useRef(0);
  const movieSeqRef = React.useRef<Map<number, number>>(new Map());
  const collectionSeqRef = React.useRef<Map<string, number>>(new Map());
  const movieQueuesRef = React.useRef<Map<number, Promise<unknown>>>(new Map());
  const collectionQueuesRef = React.useRef<Map<string, Promise<unknown>>>(new Map());
  const resolvedCollectionIdsRef = React.useRef<Map<string, string>>(new Map());
  const recentViewCacheRef = React.useRef<Map<number, number>>(new Map());

  const tabIdRef = React.useRef<string>(
    `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  const clearSyncError = React.useCallback(() => {
    setSyncError(null);
  }, []);

  const broadcastUpdate = React.useCallback(
    (
      uid: string | null,
      patch: {
        movies?: Movie[];
        collections?: Collection[];
        activities?: TimelineActivity[];
      }
    ) => {
      try {
        const channel = broadcastRef.current;
        if (!channel) return;
        const msg: SyncBroadcastPayload = {
          type: "LIBRARY_UPDATED",
          uid,
          sender: tabIdRef.current,
          ...patch,
        };
        channel.postMessage(msg);
      } catch {}
    },
    []
  );

  const commitMovies = React.useCallback(
    (uid: string | null, next: Movie[], broadcast = true) => {
      const normalized = dedupeMovies(next);
      moviesRef.current = normalized;
      setMovies(normalized);
      saveScopedLocalEntity(uid, "movies", normalized);
      if (broadcast) {
        broadcastUpdate(uid, { movies: normalized });
      }
    },
    [broadcastUpdate]
  );

  const commitCollections = React.useCallback(
    (uid: string | null, next: Collection[], broadcast = true) => {
      collectionsRef.current = next;
      setCollections(next);
      saveScopedLocalEntity(uid, "collections", next);
      if (broadcast) {
        broadcastUpdate(uid, { collections: next });
      }
    },
    [broadcastUpdate]
  );

  const commitActivities = React.useCallback(
    (uid: string | null, next: TimelineActivity[], broadcast = true) => {
      activitiesRef.current = next;
      setActivities(next);
      saveScopedLocalEntity(uid, "activities", next);
      if (broadcast) {
        broadcastUpdate(uid, { activities: next });
      }
    },
    [broadcastUpdate]
  );

  const resolveCollectionId = React.useCallback((id: string): string => {
    return resolvedCollectionIdsRef.current.get(id) ?? id;
  }, []);

  const nextMovieSeq = React.useCallback((tmdbId: number): number => {
    const next = (movieSeqRef.current.get(tmdbId) || 0) + 1;
    movieSeqRef.current.set(tmdbId, next);
    return next;
  }, []);

  const nextCollectionSeq = React.useCallback((colKey: string): number => {
    const next = (collectionSeqRef.current.get(colKey) || 0) + 1;
    collectionSeqRef.current.set(colKey, next);
    return next;
  }, []);

  const enqueueMovieMutation = React.useCallback(
    <T,>(tmdbId: number, task: () => Promise<T>): Promise<T> => {
      const prev = movieQueuesRef.current.get(tmdbId) || Promise.resolve();
      const next = prev
        .catch(() => undefined)
        .then(async () => {
          activeMutationCountRef.current += 1;
          try {
            return await task();
          } finally {
            activeMutationCountRef.current = Math.max(
              0,
              activeMutationCountRef.current - 1
            );
          }
        });
      movieQueuesRef.current.set(tmdbId, next);
      return next;
    },
    []
  );

  const enqueueCollectionMutation = React.useCallback(
    <T,>(collectionKey: string, task: () => Promise<T>): Promise<T> => {
      const rootKey = resolveCollectionId(collectionKey);
      const prev =
        collectionQueuesRef.current.get(collectionKey) ||
        collectionQueuesRef.current.get(rootKey) ||
        Promise.resolve();
      const next = prev
        .catch(() => undefined)
        .then(async () => {
          activeMutationCountRef.current += 1;
          try {
            return await task();
          } finally {
            activeMutationCountRef.current = Math.max(
              0,
              activeMutationCountRef.current - 1
            );
          }
        });
      collectionQueuesRef.current.set(collectionKey, next);
      collectionQueuesRef.current.set(rootKey, next);
      return next;
    },
    [resolveCollectionId]
  );

  const verifyCloudSession = React.useCallback(
    async (
      expectedUid: string
    ): Promise<
      | { ok: true; supabase: NonNullable<ReturnType<typeof getBrowserClient>> }
      | { ok: false; error: string; isAuthError: boolean }
    > => {
      const supabase = getBrowserClient();
      if (!supabase) {
        return {
          ok: false,
          error: "Supabase client is not configured.",
          isAuthError: true,
        };
      }

      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        return {
          ok: false,
          error: sessionErr.message,
          isAuthError: isSupabaseAuthFailure(sessionErr) || true,
        };
      }

      if (!sessionData.session || sessionData.session.user.id !== expectedUid) {
        return {
          ok: false,
          error: "Active session not found or expired.",
          isAuthError: true,
        };
      }

      return { ok: true, supabase };
    },
    []
  );

  const loadCloudLibrary = React.useCallback(
    async (uid: string, epoch: number, runMigration: boolean) => {
      if (!isSupabaseConfigured) return;
      if (
        epoch !== mutationEpochRef.current ||
        activeUserIdRef.current !== uid ||
        activeMutationCountRef.current > 0
      ) {
        if (activeMutationCountRef.current > 0) {
          pendingRevalidateRef.current = true;
        }
        return;
      }

      try {
        const supabase = getBrowserClient();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session || sessionData.session.user.id !== uid) {
          return;
        }

        if (runMigration) {
          await migrateLocalDataToSupabase(supabase, uid);
        }

        if (
          epoch !== mutationEpochRef.current ||
          activeUserIdRef.current !== uid ||
          activeMutationCountRef.current > 0
        ) {
          pendingRevalidateRef.current = true;
          return;
        }

        const [moviesRes, collectionsRes, activitiesRes] = await Promise.all([
          fetchUserLibraryResult(supabase, uid),
          fetchUserCollectionsResult(supabase, uid),
          fetchUserActivitiesResult(supabase, uid),
        ]);

        // Discard stale network load if user switched or mutated during await
        if (
          epoch !== mutationEpochRef.current ||
          activeUserIdRef.current !== uid
        ) {
          return;
        }
        if (activeMutationCountRef.current > 0) {
          pendingRevalidateRef.current = true;
          return;
        }

        const firstErr =
          moviesRes.error || collectionsRes.error || activitiesRes.error;
        if (firstErr) {
          console.warn("Failed to fetch full cloud library:", firstErr);
          if (
            isSupabaseAuthFailure(
              firstErr as { code?: string; message?: string; status?: number }
            )
          ) {
            setSyncError(
              "Your session could not be verified with the server. Showing cached library."
            );
          }
          return;
        }

        lastCloudSyncAtRef.current = Date.now();
        commitMovies(uid, moviesRes.data, true);
        commitCollections(uid, collectionsRes.data, true);
        commitActivities(uid, activitiesRes.data, true);
      } catch (err) {
        console.warn("Cloud library load error:", err);
      }
    },
    [commitMovies, commitCollections, commitActivities]
  );

  const refreshLibrary = React.useCallback(async () => {
    const uid = activeUserIdRef.current;
    if (!uid) {
      if (uid === null) {
        const scoped = loadScopedLocalLibrary(null);
        moviesRef.current = scoped.movies;
        collectionsRef.current = scoped.collections;
        activitiesRef.current = scoped.activities;
        setMovies(scoped.movies);
        setCollections(scoped.collections);
        setActivities(scoped.activities);
      }
      return;
    }
    setSyncError(null);
    await loadCloudLibrary(uid, mutationEpochRef.current, false);
  }, [loadCloudLibrary]);

  // Setup BroadcastChannel and storage fallback listeners
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        broadcastRef.current = channel;
        channel.onmessage = (event: MessageEvent<SyncBroadcastPayload>) => {
          const msg = event.data;
          if (!msg || msg.type !== "LIBRARY_UPDATED") return;
          if (msg.sender === tabIdRef.current) return;
          const currentUid = activeUserIdRef.current;
          if (currentUid === undefined || msg.uid !== currentUid) return;

          if (activeMutationCountRef.current > 0) {
            pendingRevalidateRef.current = true;
            return;
          }

          if (Array.isArray(msg.movies)) {
            const cleaned = dedupeMovies(msg.movies);
            moviesRef.current = cleaned;
            setMovies(cleaned);
          }
          if (Array.isArray(msg.collections)) {
            collectionsRef.current = msg.collections;
            setCollections(msg.collections);
          }
          if (Array.isArray(msg.activities)) {
            activitiesRef.current = msg.activities;
            setActivities(msg.activities);
          }
        };
      } catch {
        broadcastRef.current = null;
      }
    }

    const handleStorage = (e: StorageEvent) => {
      const currentUid = activeUserIdRef.current;
      if (currentUid === undefined || !e.key) return;
      const expectedKeys = [
        getWatchlistStorageKey(currentUid),
        getCollectionsStorageKey(currentUid),
        getActivitiesStorageKey(currentUid),
      ];
      if (!expectedKeys.includes(e.key)) return;
      if (activeMutationCountRef.current > 0) return;

      const scoped = loadScopedLocalLibrary(currentUid);
      moviesRef.current = scoped.movies;
      collectionsRef.current = scoped.collections;
      activitiesRef.current = scoped.activities;
      setMovies(scoped.movies);
      setCollections(scoped.collections);
      setActivities(scoped.activities);
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "hidden") return;
      const currentUid = activeUserIdRef.current;
      if (!currentUid || !isSupabaseConfigured) return;
      if (activeMutationCountRef.current > 0) return;
      if (Date.now() - lastCloudSyncAtRef.current < 5000) return;
      loadCloudLibrary(currentUid, mutationEpochRef.current, false);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      broadcastRef.current = null;
    };
  }, [loadCloudLibrary]);

  // Synchronize library scope immediately whenever authentication identity changes
  React.useEffect(() => {
    activeUserIdRef.current = activeUserId;
    if (activeUserId === undefined) return;

    const loadEpoch = ++mutationEpochRef.current;
    activeMutationCountRef.current = 0;
    pendingRevalidateRef.current = false;
    movieQueuesRef.current.clear();
    collectionQueuesRef.current.clear();
    movieSeqRef.current.clear();
    collectionSeqRef.current.clear();
    resolvedCollectionIdsRef.current.clear();
    recentViewCacheRef.current.clear();
    setSyncError(null);

    // Clear previous account's in-memory state immediately and hydrate strictly scoped cache
    const scoped = loadScopedLocalLibrary(activeUserId);
    moviesRef.current = scoped.movies;
    collectionsRef.current = scoped.collections;
    activitiesRef.current = scoped.activities;
    setMovies(scoped.movies);
    setCollections(scoped.collections);
    setActivities(scoped.activities);
    setIsLoaded(true);

    if (activeUserId && isSupabaseConfigured) {
      loadCloudLibrary(activeUserId, loadEpoch, true);
    }
  }, [activeUserId, loadCloudLibrary]);

  const removeOptimisticActivity = React.useCallback(
    (uid: string | null, activityId: string) => {
      const next = activitiesRef.current.filter((a) => a.id !== activityId);
      commitActivities(uid, next, true);
    },
    [commitActivities]
  );

  const pushActivity = React.useCallback(
    async (
      uid: string | null,
      epoch: number,
      act: Omit<TimelineActivity, "id" | "occurred_at">,
      persistToCloud = true
    ): Promise<TimelineActivity> => {
      const entry: TimelineActivity = {
        ...act,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        occurred_at: new Date().toISOString(),
      };
      const next = [entry, ...activitiesRef.current].slice(0, 100);
      commitActivities(uid, next, true);

      if (persistToCloud && uid && isSupabaseConfigured) {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return entry;
        }
        const supabase = getBrowserClient();
        if (!supabase) return entry;
        await recordMovieActivityResult(supabase, uid, {
          type: entry.type,
          tmdb_id: entry.tmdb_id,
          title: entry.title,
          poster_path: entry.poster_path,
          rating: entry.rating,
          review: entry.review,
          metadata: entry.metadata,
          occurred_at: entry.occurred_at,
        });
      }
      return entry;
    },
    [commitActivities]
  );

  const addActivity = React.useCallback(
    async (activity: Omit<TimelineActivity, "id" | "occurred_at">) => {
      const uid = activeUserIdRef.current ?? null;
      await pushActivity(uid, mutationEpochRef.current, activity, true);
    },
    [pushActivity]
  );

  const rollbackMovieSnapshot = React.useCallback(
    (
      uid: string | null,
      epoch: number,
      tmdbId: number,
      seq: number,
      previousMovie: Movie | null,
      optimisticActivityId?: string
    ) => {
      if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
        return;
      }
      if ((movieSeqRef.current.get(tmdbId) || 0) === seq) {
        const currentList = moviesRef.current;
        const filtered = currentList.filter((m) => getMovieId(m) !== tmdbId);
        const restored = previousMovie ? [previousMovie, ...filtered] : filtered;
        commitMovies(uid, restored, true);
      }
      if (optimisticActivityId) {
        removeOptimisticActivity(uid, optimisticActivityId);
      }
    },
    [commitMovies, removeOptimisticActivity]
  );

  const addToWatchlist = React.useCallback(
    async (movie: Movie): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const tmdbId = getMovieId(movie);
      const seq = nextMovieSeq(tmdbId);
      const nowIso = new Date().toISOString();

      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      const previousMovie = existing ? { ...existing } : null;

      const updatedMovie: Movie = {
        ...existing,
        ...movie,
        id: tmdbId,
        tmdb_id: tmdbId,
        status: "want",
        watched_date: undefined,
        watched_at: undefined,
        created_date: existing?.created_date || movie.created_date || nowIso,
        updated_date: nowIso,
      };

      const nextList = [
        updatedMovie,
        ...moviesRef.current.filter((m) => getMovieId(m) !== tmdbId),
      ];
      commitMovies(uid, nextList, true);

      let actEntry: TimelineActivity | null = null;
      if (!existing || existing.status !== "want") {
        actEntry = await pushActivity(
          uid,
          epoch,
          {
            type: "added",
            tmdb_id: tmdbId,
            title: movie.title,
            poster_path: movie.poster_path,
          },
          false
        );
      }

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(sessionCheck, "save watchlist update");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await upsertUserMovieResult(
          sessionCheck.supabase,
          uid,
          updatedMovie
        );
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(res, "add film to Watchlist");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        if (actEntry) {
          await recordMovieActivityResult(sessionCheck.supabase, uid, {
            type: actEntry.type,
            tmdb_id: actEntry.tmdb_id,
            title: actEntry.title,
            poster_path: actEntry.poster_path,
            occurred_at: actEntry.occurred_at,
          });
        }
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      pushActivity,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const removeFromWatchlist = React.useCallback(
    async (tmdbId: number): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const seq = nextMovieSeq(tmdbId);

      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      const previousMovie = existing ? { ...existing } : null;

      const nextList = moviesRef.current.filter((m) => getMovieId(m) !== tmdbId);
      commitMovies(uid, nextList, true);

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during removal." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie);
          const msg = formatSyncErrorMessage(sessionCheck, "remove film from library");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await deleteUserMovieResult(sessionCheck.supabase, uid, tmdbId);
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie);
          const msg = formatSyncErrorMessage(res, "remove film from library");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const markWatched = React.useCallback(
    async (
      movie: Movie,
      rating?: number,
      review?: string
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const tmdbId = getMovieId(movie);
      const seq = nextMovieSeq(tmdbId);
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.slice(0, 10);

      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      const previousMovie = existing ? { ...existing } : null;

      const finalRating =
        rating !== undefined
          ? rating > 0
            ? rating
            : undefined
          : existing?.rating ?? movie.rating;
      const finalReview =
        review !== undefined ? review : existing?.review ?? movie.review;

      const watchedMovie: Movie = {
        ...existing,
        ...movie,
        id: tmdbId,
        tmdb_id: tmdbId,
        status: "watched",
        rating: finalRating,
        review: finalReview,
        watched_date: movie.watched_date || existing?.watched_date || todayDate,
        watched_at: nowIso,
        created_date: existing?.created_date || movie.created_date || nowIso,
        updated_date: nowIso,
      };

      const nextList = [
        watchedMovie,
        ...moviesRef.current.filter((m) => getMovieId(m) !== tmdbId),
      ];
      commitMovies(uid, nextList, true);

      const actEntry = await pushActivity(
        uid,
        epoch,
        {
          type: rating ? "rated" : "watched",
          tmdb_id: tmdbId,
          title: movie.title,
          poster_path: movie.poster_path,
          rating: finalRating,
          review: finalReview,
        },
        false
      );

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry.id);
          const msg = formatSyncErrorMessage(sessionCheck, "mark film as watched");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await upsertUserMovieResult(
          sessionCheck.supabase,
          uid,
          watchedMovie
        );
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry.id);
          const msg = formatSyncErrorMessage(res, "mark film as watched");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        await recordMovieActivityResult(sessionCheck.supabase, uid, {
          type: actEntry.type,
          tmdb_id: actEntry.tmdb_id,
          title: actEntry.title,
          poster_path: actEntry.poster_path,
          rating: actEntry.rating,
          review: actEntry.review,
          occurred_at: actEntry.occurred_at,
        });
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      pushActivity,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const toggleFavorite = React.useCallback(
    async (movie: Movie): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const tmdbId = getMovieId(movie);
      const seq = nextMovieSeq(tmdbId);
      const nowIso = new Date().toISOString();

      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      const previousMovie = existing ? { ...existing } : null;
      const nextFav = !(existing?.is_favorite ?? movie.is_favorite ?? false);
      const nextStatus: Movie["status"] = existing?.status || movie.status || "want";

      const favMovie: Movie = {
        ...existing,
        ...movie,
        id: tmdbId,
        tmdb_id: tmdbId,
        status: nextStatus,
        is_favorite: nextFav,
        created_date: existing?.created_date || movie.created_date || nowIso,
        updated_date: nowIso,
      };

      const nextList = existing
        ? moviesRef.current.map((m) => (getMovieId(m) === tmdbId ? favMovie : m))
        : [favMovie, ...moviesRef.current];
      commitMovies(uid, nextList, true);

      let actEntry: TimelineActivity | null = null;
      if (nextFav) {
        actEntry = await pushActivity(
          uid,
          epoch,
          {
            type: "favorited",
            tmdb_id: tmdbId,
            title: movie.title,
            poster_path: movie.poster_path,
          },
          false
        );
      }

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(sessionCheck, "update favorite status");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await upsertUserMovieResult(sessionCheck.supabase, uid, favMovie);
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(res, "update favorite status");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        if (actEntry) {
          await recordMovieActivityResult(sessionCheck.supabase, uid, {
            type: actEntry.type,
            tmdb_id: actEntry.tmdb_id,
            title: actEntry.title,
            poster_path: actEntry.poster_path,
            occurred_at: actEntry.occurred_at,
          });
        }
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      pushActivity,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const updateStatus = React.useCallback(
    async (
      tmdbId: number,
      status: Movie["status"]
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      if (!existing) {
        return { ok: false, error: "Film is not in your library." };
      }

      const seq = nextMovieSeq(tmdbId);
      const previousMovie = { ...existing };
      const nowIso = new Date().toISOString();

      const updatedMovie: Movie = {
        ...existing,
        status,
        watched_date:
          status === "watched"
            ? existing.watched_date || nowIso.slice(0, 10)
            : undefined,
        watched_at:
          status === "watched" ? existing.watched_at || nowIso : undefined,
        updated_date: nowIso,
      };

      const nextList = moviesRef.current.map((m) =>
        getMovieId(m) === tmdbId ? updatedMovie : m
      );
      commitMovies(uid, nextList, true);

      let actEntry: TimelineActivity | null = null;
      if (status === "watched") {
        actEntry = await pushActivity(
          uid,
          epoch,
          {
            type: "watched",
            tmdb_id: tmdbId,
            title: existing.title,
            poster_path: existing.poster_path,
          },
          false
        );
      }

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(sessionCheck, "update watch status");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await upsertUserMovieResult(
          sessionCheck.supabase,
          uid,
          updatedMovie
        );
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(res, "update watch status");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        if (actEntry) {
          await recordMovieActivityResult(sessionCheck.supabase, uid, {
            type: actEntry.type,
            tmdb_id: actEntry.tmdb_id,
            title: actEntry.title,
            poster_path: actEntry.poster_path,
            occurred_at: actEntry.occurred_at,
          });
        }
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      pushActivity,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const updateRating = React.useCallback(
    async (
      tmdbId: number,
      rating?: number,
      review?: string
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const existing = moviesRef.current.find((m) => getMovieId(m) === tmdbId);
      if (!existing) {
        return { ok: false, error: "Film is not in your library." };
      }

      const seq = nextMovieSeq(tmdbId);
      const previousMovie = { ...existing };
      const nowIso = new Date().toISOString();

      const updatedMovie: Movie = {
        ...existing,
        ...(rating !== undefined
          ? { rating: rating > 0 ? rating : undefined }
          : {}),
        ...(review !== undefined ? { review } : {}),
        updated_date: nowIso,
      };

      const nextList = moviesRef.current.map((m) =>
        getMovieId(m) === tmdbId ? updatedMovie : m
      );
      commitMovies(uid, nextList, true);

      let actEntry: TimelineActivity | null = null;
      if ((rating && rating > 0) || (review && review.trim().length > 0)) {
        actEntry = await pushActivity(
          uid,
          epoch,
          {
            type: review && review.trim().length > 0 ? "reviewed" : "rated",
            tmdb_id: tmdbId,
            title: existing.title,
            poster_path: existing.poster_path,
            rating: updatedMovie.rating,
            review: updatedMovie.review,
          },
          false
        );
      }

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueMovieMutation(tmdbId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(sessionCheck, "save your rating or review");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await upsertUserMovieResult(
          sessionCheck.supabase,
          uid,
          updatedMovie
        );
        if (!res.ok) {
          rollbackMovieSnapshot(uid, epoch, tmdbId, seq, previousMovie, actEntry?.id);
          const msg = formatSyncErrorMessage(res, "save your rating or review");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        if (actEntry) {
          await recordMovieActivityResult(sessionCheck.supabase, uid, {
            type: actEntry.type,
            tmdb_id: actEntry.tmdb_id,
            title: actEntry.title,
            poster_path: actEntry.poster_path,
            rating: actEntry.rating,
            review: actEntry.review,
            occurred_at: actEntry.occurred_at,
          });
        }
        return { ok: true };
      });
    },
    [
      nextMovieSeq,
      commitMovies,
      pushActivity,
      enqueueMovieMutation,
      verifyCloudSession,
      rollbackMovieSnapshot,
    ]
  );

  const rollbackCollectionSnapshot = React.useCallback(
    (
      uid: string | null,
      epoch: number,
      targetId: string,
      seq: number,
      previousCol: Collection | null,
      optimisticActivityId?: string
    ) => {
      if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
        return;
      }
      const realId = resolveCollectionId(targetId);
      if (
        (collectionSeqRef.current.get(targetId) || 0) === seq ||
        (collectionSeqRef.current.get(realId) || 0) === seq
      ) {
        const filtered = collectionsRef.current.filter(
          (c) => c.id !== targetId && c.id !== realId
        );
        const restored = previousCol ? [previousCol, ...filtered] : filtered;
        commitCollections(uid, restored, true);
      }
      if (optimisticActivityId) {
        removeOptimisticActivity(uid, optimisticActivityId);
      }
    },
    [resolveCollectionId, commitCollections, removeOptimisticActivity]
  );

  const createCollection = React.useCallback(
    (
      title: string,
      color = "#00D664",
      description = "",
      initialMovies: Movie[] = []
    ): Collection => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const nowIso = new Date().toISOString();
      const tempId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const seq = nextCollectionSeq(tempId);

      const dedupedInitial = dedupeMovies(initialMovies);
      const newCol: Collection = {
        id: tempId,
        title: title.trim() || "Untitled Collection",
        description,
        color,
        is_public: true,
        movie_count: dedupedInitial.length,
        movie_ids: dedupedInitial.map((m) => getMovieId(m)),
        movies: dedupedInitial,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const nextCols = [newCol, ...collectionsRef.current];
      commitCollections(uid, nextCols, true);

      const actPromise = pushActivity(
        uid,
        epoch,
        {
          type: "created_collection",
          title: newCol.title,
        },
        false
      );

      if (uid && isSupabaseConfigured) {
        void enqueueCollectionMutation(tempId, async () => {
          const actEntry = await actPromise;
          if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
            return;
          }

          const sessionCheck = await verifyCloudSession(uid);
          if (!sessionCheck.ok) {
            rollbackCollectionSnapshot(uid, epoch, tempId, seq, null, actEntry.id);
            setSyncError(
              formatSyncErrorMessage(sessionCheck, "create collection")
            );
            return;
          }

          const res: RepoResult<string> = await createUserCollectionResult(
            sessionCheck.supabase,
            uid,
            newCol
          );
          if (!res.ok || !res.data) {
            rollbackCollectionSnapshot(uid, epoch, tempId, seq, null, actEntry.id);
            setSyncError(formatSyncErrorMessage(res, "create collection"));
            return;
          }

          const cloudId = res.data;
          resolvedCollectionIdsRef.current.set(tempId, cloudId);
          const replaced = collectionsRef.current.map((c) =>
            c.id === tempId ? { ...c, id: cloudId } : c
          );
          commitCollections(uid, replaced, true);
          setSyncError(null);

          await recordMovieActivityResult(sessionCheck.supabase, uid, {
            type: actEntry.type,
            title: actEntry.title,
            occurred_at: actEntry.occurred_at,
          });
        });
      }

      return newCol;
    },
    [
      nextCollectionSeq,
      commitCollections,
      pushActivity,
      enqueueCollectionMutation,
      verifyCloudSession,
      rollbackCollectionSnapshot,
    ]
  );

  const updateCollection = React.useCallback(
    async (
      id: string,
      updates: Partial<Collection>
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const lookupId = resolveCollectionId(id);
      const existing = collectionsRef.current.find(
        (c) => c.id === id || c.id === lookupId
      );
      if (!existing) {
        return { ok: false, error: "Collection not found." };
      }

      const seq = nextCollectionSeq(id);
      const previousCol: Collection = {
        ...existing,
        movies: existing.movies ? [...existing.movies] : undefined,
        movie_ids: existing.movie_ids ? [...existing.movie_ids] : undefined,
      };
      const nowIso = new Date().toISOString();

      const nextMovies =
        updates.movies !== undefined ? dedupeMovies(updates.movies) : existing.movies;
      const nextMovieIds =
        updates.movie_ids !== undefined
          ? updates.movie_ids
          : nextMovies
            ? nextMovies.map((m) => getMovieId(m))
            : existing.movie_ids;

      const merged: Collection = {
        ...existing,
        ...updates,
        movies: nextMovies,
        movie_ids: nextMovieIds,
        movie_count:
          nextMovies?.length ?? nextMovieIds?.length ?? existing.movie_count ?? 0,
        updated_at: nowIso,
      };

      const nextCols = collectionsRef.current.map((c) =>
        c.id === existing.id ? merged : c
      );
      commitCollections(uid, nextCols, true);

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueCollectionMutation(id, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }
        const realId = resolveCollectionId(id);
        if (realId.startsWith("col-")) {
          rollbackCollectionSnapshot(uid, epoch, id, seq, previousCol);
          const msg = "Collection was not created in the cloud yet. Reverted.";
          setSyncError(msg);
          return { ok: false, error: msg };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(sessionCheck, "update collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await updateUserCollectionResult(
          sessionCheck.supabase,
          uid,
          realId,
          {
            ...updates,
            movies: nextMovies,
            movie_ids: nextMovieIds,
            updated_at: nowIso,
          }
        );
        if (!res.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(res, "update collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        return { ok: true };
      });
    },
    [
      resolveCollectionId,
      nextCollectionSeq,
      commitCollections,
      enqueueCollectionMutation,
      verifyCloudSession,
      rollbackCollectionSnapshot,
    ]
  );

  const deleteCollection = React.useCallback(
    async (id: string): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const lookupId = resolveCollectionId(id);
      const existing = collectionsRef.current.find(
        (c) => c.id === id || c.id === lookupId
      );
      if (!existing) {
        return { ok: false, error: "Collection not found." };
      }

      const seq = nextCollectionSeq(id);
      const previousCol: Collection = { ...existing };

      const nextCols = collectionsRef.current.filter(
        (c) => c.id !== id && c.id !== lookupId
      );
      commitCollections(uid, nextCols, true);

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueCollectionMutation(id, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during delete." };
        }
        const realId = resolveCollectionId(id);
        if (realId.startsWith("col-")) {
          // Was never created remotely; keep local deletion cleanly
          return { ok: true };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(sessionCheck, "delete collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await deleteUserCollectionResult(
          sessionCheck.supabase,
          uid,
          realId
        );
        if (!res.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(res, "delete collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        return { ok: true };
      });
    },
    [
      resolveCollectionId,
      nextCollectionSeq,
      commitCollections,
      enqueueCollectionMutation,
      verifyCloudSession,
      rollbackCollectionSnapshot,
    ]
  );

  const addMovieToCollection = React.useCallback(
    async (
      collectionId: string,
      movie: Movie
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const lookupId = resolveCollectionId(collectionId);
      const existing = collectionsRef.current.find(
        (c) => c.id === collectionId || c.id === lookupId
      );
      if (!existing) {
        return { ok: false, error: "Collection not found." };
      }

      const tmdbId = getMovieId(movie);
      const currentMovies = existing.movies || [];
      if (currentMovies.some((m) => getMovieId(m) === tmdbId)) {
        return { ok: true };
      }

      const seq = nextCollectionSeq(collectionId);
      const previousCol: Collection = {
        ...existing,
        movies: [...currentMovies],
        movie_ids: [...(existing.movie_ids || [])],
      };
      const nowIso = new Date().toISOString();
      const position = currentMovies.length;
      const updatedMovies = [...currentMovies, { ...movie, id: tmdbId, tmdb_id: tmdbId }];
      const updatedIds = [
        ...(existing.movie_ids || currentMovies.map((m) => getMovieId(m))),
        tmdbId,
      ];

      const nextCols = collectionsRef.current.map((c) =>
        c.id === existing.id
          ? {
              ...c,
              movies: updatedMovies,
              movie_ids: updatedIds,
              movie_count: updatedMovies.length,
              updated_at: nowIso,
            }
          : c
      );
      commitCollections(uid, nextCols, true);

      const actEntry = await pushActivity(
        uid,
        epoch,
        {
          type: "collected",
          tmdb_id: tmdbId,
          title: movie.title,
          poster_path: movie.poster_path,
          metadata: { collectionTitle: existing.title },
        },
        false
      );

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueCollectionMutation(collectionId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during save." };
        }
        const realId = resolveCollectionId(collectionId);
        if (realId.startsWith("col-")) {
          rollbackCollectionSnapshot(uid, epoch, collectionId, seq, previousCol, actEntry.id);
          const msg = "Could not add film because parent collection failed to save.";
          setSyncError(msg);
          return { ok: false, error: msg };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol, actEntry.id);
          const msg = formatSyncErrorMessage(sessionCheck, "add film to collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await addMovieToUserCollectionResult(
          sessionCheck.supabase,
          uid,
          realId,
          movie,
          position
        );
        if (!res.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol, actEntry.id);
          const msg = formatSyncErrorMessage(res, "add film to collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        await recordMovieActivityResult(sessionCheck.supabase, uid, {
          type: actEntry.type,
          tmdb_id: actEntry.tmdb_id,
          title: actEntry.title,
          poster_path: actEntry.poster_path,
          metadata: actEntry.metadata,
          occurred_at: actEntry.occurred_at,
        });
        return { ok: true };
      });
    },
    [
      resolveCollectionId,
      nextCollectionSeq,
      commitCollections,
      pushActivity,
      enqueueCollectionMutation,
      verifyCloudSession,
      rollbackCollectionSnapshot,
    ]
  );

  const removeMovieFromCollection = React.useCallback(
    async (
      collectionId: string,
      tmdbId: number
    ): Promise<LibraryMutationResult> => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      const lookupId = resolveCollectionId(collectionId);
      const existing = collectionsRef.current.find(
        (c) => c.id === collectionId || c.id === lookupId
      );
      if (!existing) {
        return { ok: false, error: "Collection not found." };
      }

      const seq = nextCollectionSeq(collectionId);
      const previousCol: Collection = {
        ...existing,
        movies: existing.movies ? [...existing.movies] : [],
        movie_ids: existing.movie_ids ? [...existing.movie_ids] : [],
      };
      const nowIso = new Date().toISOString();

      const updatedMovies = (existing.movies || []).filter(
        (m) => getMovieId(m) !== tmdbId
      );
      const updatedIds = (existing.movie_ids || []).filter((id) => id !== tmdbId);

      const nextCols = collectionsRef.current.map((c) =>
        c.id === existing.id
          ? {
              ...c,
              movies: updatedMovies,
              movie_ids: updatedIds,
              movie_count: updatedMovies.length,
              updated_at: nowIso,
            }
          : c
      );
      commitCollections(uid, nextCols, true);

      if (!uid || !isSupabaseConfigured) {
        setSyncError(null);
        return { ok: true };
      }

      return enqueueCollectionMutation(collectionId, async () => {
        if (epoch !== mutationEpochRef.current || activeUserIdRef.current !== uid) {
          return { ok: false, error: "Account state changed during removal." };
        }
        const realId = resolveCollectionId(collectionId);
        if (realId.startsWith("col-")) {
          rollbackCollectionSnapshot(uid, epoch, collectionId, seq, previousCol);
          return { ok: false, error: "Collection not saved in cloud." };
        }

        const sessionCheck = await verifyCloudSession(uid);
        if (!sessionCheck.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(
            sessionCheck,
            "remove film from collection"
          );
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: sessionCheck.isAuthError };
        }

        const res = await removeMovieFromUserCollectionResult(
          sessionCheck.supabase,
          uid,
          realId,
          tmdbId
        );
        if (!res.ok) {
          rollbackCollectionSnapshot(uid, epoch, realId, seq, previousCol);
          const msg = formatSyncErrorMessage(res, "remove film from collection");
          setSyncError(msg);
          return { ok: false, error: msg, isAuthError: res.isAuthError };
        }

        setSyncError(null);
        return { ok: true };
      });
    },
    [
      resolveCollectionId,
      nextCollectionSeq,
      commitCollections,
      enqueueCollectionMutation,
      verifyCloudSession,
      rollbackCollectionSnapshot,
    ]
  );

  const reorderCollectionMovies = React.useCallback(
    async (
      collectionId: string,
      movieIds: number[]
    ): Promise<LibraryMutationResult> => {
      const existing = collectionsRef.current.find(
        (c) => c.id === collectionId || c.id === resolveCollectionId(collectionId)
      );
      if (!existing) {
        return { ok: false, error: "Collection not found." };
      }

      const currentMovies = existing.movies || [];
      const reordered: Movie[] = [];
      for (const id of movieIds) {
        const found = currentMovies.find((m) => getMovieId(m) === id);
        if (found) reordered.push(found);
      }
      for (const m of currentMovies) {
        if (!reordered.some((r) => getMovieId(r) === getMovieId(m))) {
          reordered.push(m);
        }
      }

      return updateCollection(existing.id, {
        movies: reordered,
        movie_ids: reordered.map((m) => getMovieId(m)),
      });
    },
    [resolveCollectionId, updateCollection]
  );

  const trackMovieViewed = React.useCallback(
    async (movie: Movie) => {
      const uid = activeUserIdRef.current ?? null;
      const tmdbId = getMovieId(movie);
      if (!tmdbId) return;

      const lastViewed = recentViewCacheRef.current.get(tmdbId) || 0;
      if (Date.now() - lastViewed < 60_000) return;
      recentViewCacheRef.current.set(tmdbId, Date.now());

      await pushActivity(
        uid,
        mutationEpochRef.current,
        {
          type: "viewed",
          tmdb_id: tmdbId,
          title: movie.title,
          poster_path: movie.poster_path,
        },
        true
      );
    },
    [pushActivity]
  );

  const batchImportMovies = React.useCallback(
    (
      importedMovies: Movie[],
      importedActivities?: TimelineActivity[]
    ): { added: number; updated: number; skipped: number } => {
      const uid = activeUserIdRef.current ?? null;
      const epoch = mutationEpochRef.current;
      let added = 0;
      let updated = 0;
      let skipped = 0;

      const map = new Map<number, Movie>();
      for (const m of moviesRef.current) {
        map.set(getMovieId(m), m);
      }

      const toSync: Movie[] = [];
      for (const incoming of importedMovies) {
        const id = getMovieId(incoming);
        if (!id) {
          skipped++;
          continue;
        }
        const existing = map.get(id);
        if (!existing) {
          const merged = { ...incoming, id, tmdb_id: id };
          map.set(id, merged);
          toSync.push(merged);
          added++;
        } else {
          const nextRating = incoming.rating ?? existing.rating;
          const nextStatus =
            incoming.status === "watched" || existing.status === "watched"
              ? "watched"
              : incoming.status || existing.status || "want";
          const changed =
            nextRating !== existing.rating ||
            nextStatus !== existing.status ||
            (incoming.review && !existing.review);
          if (changed) {
            const merged: Movie = {
              ...existing,
              status: nextStatus,
              rating: nextRating,
              review: existing.review || incoming.review,
              watched_date: incoming.watched_date || existing.watched_date,
              watched_at: incoming.watched_at || existing.watched_at,
              updated_date: new Date().toISOString(),
            };
            map.set(id, merged);
            toSync.push(merged);
            updated++;
          } else {
            skipped++;
          }
        }
      }

      commitMovies(uid, Array.from(map.values()), true);

      if (importedActivities && importedActivities.length > 0) {
        commitActivities(
          uid,
          [...importedActivities, ...activitiesRef.current].slice(0, 150),
          true
        );
      }

      if (uid && isSupabaseConfigured && toSync.length > 0) {
        void (async () => {
          const sessionCheck = await verifyCloudSession(uid);
          if (!sessionCheck.ok) {
            setSyncError(
              formatSyncErrorMessage(sessionCheck, "sync imported films")
            );
            return;
          }

          let failedCount = 0;
          for (const film of toSync) {
            if (
              epoch !== mutationEpochRef.current ||
              activeUserIdRef.current !== uid
            ) {
              return;
            }
            const res = await upsertUserMovieResult(
              sessionCheck.supabase,
              uid,
              film
            );
            if (!res.ok) {
              failedCount++;
            }
          }

          if (importedActivities) {
            for (const act of importedActivities.slice(0, 25)) {
              if (
                epoch !== mutationEpochRef.current ||
                activeUserIdRef.current !== uid
              ) {
                return;
              }
              await recordMovieActivityResult(sessionCheck.supabase, uid, {
                type: act.type,
                tmdb_id: act.tmdb_id,
                title: act.title,
                poster_path: act.poster_path,
                rating: act.rating,
                review: act.review,
                metadata: act.metadata,
                occurred_at: act.occurred_at,
              });
            }
          }

          if (failedCount > 0) {
            setSyncError(
              `${failedCount} imported film${failedCount === 1 ? "" : "s"} could not be synced to the cloud.`
            );
          }
        })();
      }

      return { added, updated, skipped };
    },
    [commitMovies, commitActivities, verifyCloudSession]
  );

  // Trigger deferred cloud revalidation once pending mutations finish
  React.useEffect(() => {
    if (!pendingRevalidateRef.current) return;
    if (activeMutationCountRef.current !== 0) return;
    const uid = activeUserIdRef.current;
    if (!uid) return;
    pendingRevalidateRef.current = false;
    loadCloudLibrary(uid, mutationEpochRef.current, false);
  });

  const value = React.useMemo<LibraryState>(
    () => ({
      movies,
      collections,
      activities,
      isLoaded,
      syncError,
      clearSyncError,
      refreshLibrary,
      resolveCollectionId,
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
    }),
    [
      movies,
      collections,
      activities,
      isLoaded,
      syncError,
      clearSyncError,
      refreshLibrary,
      resolveCollectionId,
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
    ]
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
      {syncError && (
        <div
          role="alert"
          data-testid="library-sync-error"
          className="fixed bottom-24 left-4 sm:left-6 z-50 max-w-sm rounded-2xl bg-popover dark:bg-[#141722] text-foreground shadow-[0_20px_48px_-12px_rgba(0,0,0,0.8)] p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs leading-relaxed text-foreground">
              {syncError}
            </p>
            <div className="flex items-center gap-2">
              {activeUserId && (
                <button
                  type="button"
                  onClick={() => void refreshLibrary()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D878] text-[#050608] text-[11px] font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Sync</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearSyncError}
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSyncError}
            aria-label="Dismiss library sync alert"
            className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryState {
  const ctx = React.useContext(LibraryContext);
  if (!ctx) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return ctx;
}
