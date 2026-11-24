"use client";

import * as React from "react";
import type { Movie, Collection, TimelineActivity } from "@/types";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchUserLibrary,
  fetchUserCollections,
  fetchUserActivities,
  upsertUserMovie,
  deleteUserMovie,
  createUserCollection,
  updateUserCollection,
  deleteUserCollection,
  recordMovieActivity,
} from "@/lib/supabase/library-repository";

const WATCHLIST_STORAGE_KEY = "cineaste:library:watchlist:v2";
const COLLECTIONS_STORAGE_KEY = "cineaste:library:collections";
const ACTIVITIES_STORAGE_KEY = "cineaste:library:activities";

export const DEFAULT_LIBRARY_MOVIES: Movie[] = [
  {
    id: 275,
    tmdb_id: 275,
    title: "Fargo",
    release_date: "1996-03-08",
    vote_average: 7.8,
    runtime: 98,
    overview:
      "Jerry Lundegaard is a small-town Minnesota car salesman deeply in debt and willing to do almost anything to get out. Police chief Marge Gunderson discovers a string of violent crimes as Jerry's schemes spiral out of control.",
    backdrop_path: "/747dgDfL5d8esobk7h4odaOFhUq.jpg",
    poster_path: "/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg",
    genres: ["Crime", "Drama", "Thriller"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-31T12:00:00.000Z",
  },
  {
    id: 27205,
    tmdb_id: 27205,
    title: "Inception",
    release_date: "2010-07-16",
    vote_average: 8.4,
    runtime: 148,
    backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    genres: ["Action", "Sci-Fi", "Adventure"] as any,
    status: "watched",
    is_favorite: true,
    rating: 9.0,
    watched_date: "2026-10-29T20:00:00.000Z",
  },
  {
    id: 693134,
    tmdb_id: 693134,
    title: "Dune: Part Two",
    release_date: "2024-03-01",
    vote_average: 8.2,
    runtime: 166,
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    genres: ["Sci-Fi", "Adventure"] as any,
    status: "watched",
    is_favorite: true,
    rating: 9.5,
    watched_date: "2026-10-30T18:00:00.000Z",
  },
  {
    id: 872585,
    tmdb_id: 872585,
    title: "Oppenheimer",
    release_date: "2023-07-19",
    vote_average: 8.1,
    runtime: 180,
    backdrop_path: "/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genres: ["Drama", "History"] as any,
    status: "watched",
    is_favorite: true,
    rating: 9.0,
    watched_date: "2026-10-25T19:00:00.000Z",
  },
  {
    id: 157336,
    tmdb_id: 157336,
    title: "Interstellar",
    release_date: "2014-11-05",
    vote_average: 8.4,
    runtime: 169,
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Adventure", "Drama", "Sci-Fi"] as any,
    status: "watched",
    is_favorite: true,
    rating: 9.5,
    watched_date: "2026-10-20T21:00:00.000Z",
  },
  {
    id: 155,
    tmdb_id: 155,
    title: "The Dark Knight",
    release_date: "2008-07-16",
    vote_average: 8.5,
    runtime: 152,
    backdrop_path: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    genres: ["Drama", "Action", "Crime"] as any,
    status: "watched",
    is_favorite: false,
    rating: 9.2,
    watched_date: "2026-10-15T20:30:00.000Z",
  },
  {
    id: 680,
    tmdb_id: 680,
    title: "Pulp Fiction",
    release_date: "1994-09-10",
    vote_average: 8.5,
    runtime: 154,
    backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    genres: ["Thriller", "Crime"] as any,
    status: "watched",
    is_favorite: false,
    rating: 9.0,
    watched_date: "2026-10-10T22:00:00.000Z",
  },
  {
    id: 496243,
    tmdb_id: 496243,
    title: "Parasite",
    release_date: "2019-05-30",
    vote_average: 8.5,
    runtime: 132,
    backdrop_path: "/hiKmpnnSZvAQWOPv8Gcvkwh96v4.jpg",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    genres: ["Comedy", "Thriller", "Drama"] as any,
    status: "watched",
    is_favorite: false,
    rating: 8.8,
    watched_date: "2026-10-05T19:30:00.000Z",
  },
  {
    id: 129,
    tmdb_id: 129,
    title: "Spirited Away",
    release_date: "2001-07-20",
    vote_average: 8.5,
    runtime: 125,
    backdrop_path: "/Ab8mkHmkYADjU7wQiOkia9obGvS.jpg",
    poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    genres: ["Animation", "Family", "Fantasy"] as any,
    status: "watched",
    is_favorite: false,
    rating: 8.9,
    watched_date: "2026-09-28T17:00:00.000Z",
  },
  {
    id: 244786,
    tmdb_id: 244786,
    title: "Whiplash",
    release_date: "2014-10-10",
    vote_average: 8.4,
    runtime: 107,
    backdrop_path: "/vNXMSfR5LzW2z2R5t6Z2X7Wz2.jpg",
    poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    genres: ["Drama", "Music"] as any,
    status: "watched",
    is_favorite: false,
    rating: 8.7,
    watched_date: "2026-09-20T20:00:00.000Z",
  },
  {
    id: 792307,
    tmdb_id: 792307,
    title: "Poor Things",
    release_date: "2023-12-07",
    vote_average: 7.8,
    runtime: 141,
    backdrop_path: "/jXJxMcVoKd7vj1zC0tI4Fk3oF9I.jpg",
    poster_path: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
    genres: ["Comedy", "Romance", "Sci-Fi"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-30T10:00:00.000Z",
  },
  {
    id: 666277,
    tmdb_id: 666277,
    title: "Past Lives",
    release_date: "2023-06-02",
    vote_average: 7.9,
    runtime: 106,
    backdrop_path: "/7HR38hMBl23lf38MAN63y4pKsHz.jpg",
    poster_path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    genres: ["Romance", "Drama"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-29T10:00:00.000Z",
  },
  {
    id: 915935,
    tmdb_id: 915935,
    title: "Anatomy of a Fall",
    release_date: "2023-08-23",
    vote_average: 7.7,
    runtime: 151,
    backdrop_path: "/lDVl2jf6VB8ODl1olZ6FLvOV1gX.jpg",
    poster_path: "/1ho0d4LNZw3Y0voeKmSvPSgJOJ2.jpg",
    genres: ["Crime", "Drama", "Mystery"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-28T10:00:00.000Z",
  },
  {
    id: 467244,
    tmdb_id: 467244,
    title: "The Zone of Interest",
    release_date: "2023-12-15",
    vote_average: 7.2,
    runtime: 105,
    backdrop_path: "/pnTSOKcYnvdpQNQElAtJM1rWOxH.jpg",
    poster_path: "/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
    genres: ["History", "Drama", "War"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-27T10:00:00.000Z",
  },
  {
    id: 569094,
    tmdb_id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    release_date: "2023-05-31",
    vote_average: 8.4,
    runtime: 140,
    backdrop_path: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    genres: ["Animation", "Action", "Adventure"] as any,
    status: "want",
    is_favorite: false,
    created_date: "2026-10-26T10:00:00.000Z",
  },
];

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
  const [movies, setMovies] = React.useState<Movie[]>(DEFAULT_LIBRARY_MOVIES);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [activities, setActivities] = React.useState<TimelineActivity[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null);

  // Load from Supabase when authenticated, otherwise fallback to localStorage
  const loadData = React.useCallback(async () => {
    const supabase = getBrowserClient();

    const loadLocalFallback = () => {
      try {
        const storedMovies = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (storedMovies) {
          const parsed = JSON.parse(storedMovies);
          setMovies(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LIBRARY_MOVIES);
        } else {
          setMovies(DEFAULT_LIBRARY_MOVIES);
          localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(DEFAULT_LIBRARY_MOVIES));
        }
        const storedCols = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
        if (storedCols) setCollections(JSON.parse(storedCols));
        const storedActs = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
        if (storedActs) setActivities(JSON.parse(storedActs));
      } catch {
        setMovies(DEFAULT_LIBRARY_MOVIES);
      }
      setIsLoaded(true);
    };

    if (!supabase || !isSupabaseConfigured) {
      loadLocalFallback();
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setActiveUserId(null);
        loadLocalFallback();
        return;
      }

      const uid = session.user.id;
      setActiveUserId(uid);

      // Fetch cloud records in parallel
      const [cloudMovies, cloudCollections, cloudActivities] = await Promise.all([
        fetchUserLibrary(supabase, uid),
        fetchUserCollections(supabase, uid),
        fetchUserActivities(supabase, uid),
      ]);

      // Use cloud records if available, otherwise fallback per entity to localStorage
      if (cloudMovies.length > 0) {
        setMovies(cloudMovies);
      } else {
        const storedMovies = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (storedMovies) {
          try {
            const parsed = JSON.parse(storedMovies);
            setMovies(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LIBRARY_MOVIES);
          } catch {
            setMovies(DEFAULT_LIBRARY_MOVIES);
          }
        } else {
          setMovies(DEFAULT_LIBRARY_MOVIES);
        }
      }

      if (cloudCollections.length > 0) {
        setCollections(cloudCollections);
      } else {
        const storedCols = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
        if (storedCols) {
          try {
            setCollections(JSON.parse(storedCols));
          } catch {}
        }
      }

      if (cloudActivities.length > 0) {
        setActivities(cloudActivities);
      } else {
        const storedActs = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
        if (storedActs) {
          try {
            setActivities(JSON.parse(storedActs));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Could not load from Supabase; using local fallback:", err);
      loadLocalFallback();
    } finally {
      setIsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    // Immediately load local fallback so UI renders cached library without waiting for network
    try {
      const storedMovies = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedMovies) {
        const parsed = JSON.parse(storedMovies);
        setMovies(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LIBRARY_MOVIES);
      } else {
        setMovies(DEFAULT_LIBRARY_MOVIES);
      }
      const storedCols = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (storedCols) setCollections(JSON.parse(storedCols));
      const storedActs = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (storedActs) setActivities(JSON.parse(storedActs));
    } catch {}

    loadData();

    const handleSync = () => loadData();
    window.addEventListener("cineaste:library-change", handleSync);
    window.addEventListener("storage", handleSync);

    const supabase = getBrowserClient();
    let authSub: { unsubscribe: () => void } | null = null;
    if (supabase && isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        loadData();
      });
      authSub = data.subscription;
    }

    return () => {
      window.removeEventListener("cineaste:library-change", handleSync);
      window.removeEventListener("storage", handleSync);
      authSub?.unsubscribe();
    };
  }, [loadData]);

  // Save to localStorage and notify UI listeners
  const notifyChanges = (type: "movies" | "collections" | "activities", data: any) => {
    try {
      if (type === "movies") {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(data));
      } else if (type === "collections") {
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(data));
      } else if (type === "activities") {
        localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(data));
      }
      window.dispatchEvent(
        new CustomEvent("cineaste:library-change", { detail: { type, data } })
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
    const existing = movies.find((m) => m.tmdb_id === movie.tmdb_id);
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      targetMovie = { ...existing, status: "want", updated_date: new Date().toISOString() };
      updated = movies.map((m) => (m.tmdb_id === movie.tmdb_id ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
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
      tmdb_id: movie.tmdb_id,
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
    const updated = movies.filter((m) => m.tmdb_id !== tmdbId && m.id !== tmdbId);
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
    const existing = movies.find((m) => m.tmdb_id === movie.tmdb_id);
    const dateStr = new Date().toISOString().split("T")[0];
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      targetMovie = {
        ...existing,
        status: "watched",
        watched_date: dateStr,
        rating: rating ?? existing.rating,
        review: review ?? existing.review,
        updated_date: new Date().toISOString(),
      };
      updated = movies.map((m) => (m.tmdb_id === movie.tmdb_id ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
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
      tmdb_id: movie.tmdb_id,
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
    const existing = movies.find((m) => m.tmdb_id === movie.tmdb_id);
    let isNowFavorite = true;
    let updated: Movie[];
    let targetMovie: Movie;

    if (existing) {
      isNowFavorite = !existing.is_favorite;
      targetMovie = {
        ...existing,
        is_favorite: isNowFavorite,
        updated_date: new Date().toISOString(),
      };
      updated = movies.map((m) => (m.tmdb_id === movie.tmdb_id ? targetMovie : m));
    } else {
      targetMovie = {
        ...movie,
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
      if (m.tmdb_id === tmdbId) {
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
      if (m.tmdb_id === tmdbId) {
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
