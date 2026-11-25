import type { Movie, Collection, TimelineActivity } from "@/types";

export const STORAGE_VERSION = "v3";

export const LEGACY_WATCHLIST_KEYS = [
  "cineaste:library:watchlist:v2",
  "cineaste:library:watchlist",
] as const;

export const LEGACY_COLLECTION_KEYS = ["cineaste:library:collections"] as const;
export const LEGACY_ACTIVITY_KEYS = ["cineaste:library:activities"] as const;

export function getWatchlistStorageKey(uid: string | null): string {
  return `cineaste:library:watchlist:${STORAGE_VERSION}:${uid || "guest"}`;
}

export function getCollectionsStorageKey(uid: string | null): string {
  return `cineaste:library:collections:${STORAGE_VERSION}:${uid || "guest"}`;
}

export function getActivitiesStorageKey(uid: string | null): string {
  return `cineaste:library:activities:${STORAGE_VERSION}:${uid || "guest"}`;
}

export function getStorageUpgradeMarkerKey(uid: string | null): string {
  return `cineaste:library:${STORAGE_VERSION}:upgraded:${uid || "guest"}`;
}

export function getUserProfileStorageKey(uid: string | null): string {
  return `cineaste:user_profile:${STORAGE_VERSION}:${uid || "guest"}`;
}

/**
 * Exact fingerprints of the 15 hardcoded demo movies that older Cineaste versions
 * automatically seeded into guest localStorage. Any record matching its seeded
 * fingerprint and untouched by user edits (no updated_date, no review) is stripped.
 */
interface SeededDemoFingerprint {
  status: "want" | "watched";
  is_favorite: boolean;
  rating?: number;
  created_date?: string;
  watched_date?: string;
}

const SEEDED_DEMO_FINGERPRINTS: Record<number, SeededDemoFingerprint> = {
  275: { status: "want", is_favorite: false, created_date: "2026-10-31T12:00:00.000Z" },
  27205: { status: "watched", is_favorite: true, rating: 9.0, watched_date: "2026-10-29T20:00:00.000Z" },
  693134: { status: "watched", is_favorite: true, rating: 9.5, watched_date: "2026-10-30T18:00:00.000Z" },
  872585: { status: "watched", is_favorite: true, rating: 9.0, watched_date: "2026-10-25T19:00:00.000Z" },
  157336: { status: "watched", is_favorite: true, rating: 9.5, watched_date: "2026-10-20T21:00:00.000Z" },
  155: { status: "watched", is_favorite: false, rating: 9.2, watched_date: "2026-10-15T20:30:00.000Z" },
  680: { status: "watched", is_favorite: false, rating: 9.0, watched_date: "2026-10-10T22:00:00.000Z" },
  496243: { status: "watched", is_favorite: false, rating: 8.8, watched_date: "2026-10-05T19:30:00.000Z" },
  129: { status: "watched", is_favorite: false, rating: 8.9, watched_date: "2026-09-28T17:00:00.000Z" },
  244786: { status: "watched", is_favorite: false, rating: 8.7, watched_date: "2026-09-20T20:00:00.000Z" },
  792307: { status: "want", is_favorite: false, created_date: "2026-10-30T10:00:00.000Z" },
  666277: { status: "want", is_favorite: false, created_date: "2026-10-29T10:00:00.000Z" },
  915935: { status: "want", is_favorite: false, created_date: "2026-10-28T10:00:00.000Z" },
  467244: { status: "want", is_favorite: false, created_date: "2026-10-27T10:00:00.000Z" },
  569094: { status: "want", is_favorite: false, created_date: "2026-10-26T10:00:00.000Z" },
};

/**
 * Returns true ONLY if the movie record matches an untouched auto-seeded demo entry.
 * Genuine guest-added or user-modified records always return false.
 */
export function isConfidentlySeededDemoMovie(movie: Partial<Movie> | null | undefined): boolean {
  if (!movie) return false;
  const tmdbId = Number(movie.tmdb_id || movie.id);
  const fp = SEEDED_DEMO_FINGERPRINTS[tmdbId];
  if (!fp) return false;

  // User interactions always stamp updated_date or add a review
  if (movie.updated_date || (typeof movie.review === "string" && movie.review.trim().length > 0)) {
    return false;
  }

  if (movie.status !== fp.status) return false;
  if (Boolean(movie.is_favorite) !== fp.is_favorite) return false;
  if ((movie.rating ?? undefined) !== fp.rating) return false;

  if (fp.watched_date && movie.watched_date !== fp.watched_date) return false;
  if (fp.created_date && movie.created_date !== fp.created_date) return false;

  return true;
}

export function filterSeededDemoMovies(list: Movie[]): Movie[] {
  return list.filter((m) => m && Number(m.tmdb_id || m.id) > 0 && !isConfidentlySeededDemoMovie(m));
}

export function getMovieTimestampMs(movie: Partial<Movie>): number {
  const candidates = [movie.updated_date, movie.watched_date, movie.created_date];
  let best = 0;
  for (const val of candidates) {
    if (!val) continue;
    const ms = new Date(val).getTime();
    if (!Number.isNaN(ms) && ms > best) best = ms;
  }
  return best;
}

export function dedupeMovies(movies: Movie[]): Movie[] {
  const byId = new Map<number, Movie>();
  for (const m of movies) {
    const id = Number(m?.tmdb_id || m?.id);
    if (!id || !m?.title) continue;
    const normalized: Movie = { ...m, id, tmdb_id: id };
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, normalized);
      continue;
    }
    if (getMovieTimestampMs(normalized) > getMovieTimestampMs(existing)) {
      byId.set(id, normalized);
    }
  }
  return Array.from(byId.values());
}

function dedupeCollections(collections: Collection[]): Collection[] {
  const byId = new Map<string, Collection>();
  for (const col of collections) {
    if (!col || !col.id || !col.title) continue;
    const existing = byId.get(col.id);
    if (!existing) {
      byId.set(col.id, col);
      continue;
    }
    const colTime = new Date(col.updated_at || col.created_at || 0).getTime();
    const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
    if (colTime > existingTime) {
      byId.set(col.id, col);
    }
  }
  return Array.from(byId.values());
}

function dedupeActivities(activities: TimelineActivity[]): TimelineActivity[] {
  const seen = new Set<string>();
  const out: TimelineActivity[] = [];
  for (const act of activities) {
    if (!act || !act.type) continue;
    const sig = act.id || `${act.type}:${act.tmdb_id || ""}:${act.occurred_at || ""}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(act);
  }
  return out;
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLegacyKeysForScope(uid: string | null) {
  if (!uid) {
    return {
      movies: [
        "cineaste:library:watchlist:v2:guest",
        "cineaste:library:watchlist:v2",
        "cineaste:library:watchlist",
      ],
      collections: [
        "cineaste:library:collections:guest",
        "cineaste:library:collections",
      ],
      activities: [
        "cineaste:library:activities:guest",
        "cineaste:library:activities",
      ],
    };
  }

  return {
    movies: [`cineaste:library:watchlist:v2:${uid}`],
    collections: [`cineaste:library:collections:${uid}`],
    activities: [`cineaste:library:activities:${uid}`],
  };
}

export interface ScopedLocalLibrary {
  movies: Movie[];
  collections: Collection[];
  activities: TimelineActivity[];
}

/**
 * Loads the local library strictly for `uid` (or `"guest"` when `uid === null`).
 * One-time upgrades v1/v2 legacy keys into v3 while stripping untouched seeded demo records
 * and preserving every real user-added film without duplicating records.
 */
export function loadScopedLocalLibrary(uid: string | null): ScopedLocalLibrary {
  if (typeof window === "undefined") {
    return { movies: [], collections: [], activities: [] };
  }

  const v3MoviesKey = getWatchlistStorageKey(uid);
  const v3ColsKey = getCollectionsStorageKey(uid);
  const v3ActsKey = getActivitiesStorageKey(uid);
  const upgradeMarkerKey = getStorageUpgradeMarkerKey(uid);

  const alreadyUpgraded = localStorage.getItem(upgradeMarkerKey) === "1";

  const v3MoviesRaw = localStorage.getItem(v3MoviesKey);
  const v3ColsRaw = localStorage.getItem(v3ColsKey);
  const v3ActsRaw = localStorage.getItem(v3ActsKey);

  if (alreadyUpgraded) {
    const cleanedMovies = filterSeededDemoMovies(dedupeMovies(safeParseArray<Movie>(v3MoviesRaw)));
    return {
      movies: cleanedMovies,
      collections: dedupeCollections(safeParseArray<Collection>(v3ColsRaw)),
      activities: dedupeActivities(safeParseArray<TimelineActivity>(v3ActsRaw)),
    };
  }

  // Gather candidate arrays from v3 (if any) and legacy keys for THIS scope only
  const legacy = getLegacyKeysForScope(uid);
  const foundLegacyMovies = legacy.movies.some((k) => localStorage.getItem(k) !== null);
  const foundLegacyCols = legacy.collections.some((k) => localStorage.getItem(k) !== null);
  const foundLegacyActs = legacy.activities.some((k) => localStorage.getItem(k) !== null);

  const rawMovieLists: Movie[] = [
    ...safeParseArray<Movie>(v3MoviesRaw),
    ...legacy.movies.flatMap((k) => safeParseArray<Movie>(localStorage.getItem(k))),
  ];
  const rawColLists: Collection[] = [
    ...safeParseArray<Collection>(v3ColsRaw),
    ...legacy.collections.flatMap((k) => safeParseArray<Collection>(localStorage.getItem(k))),
  ];
  const rawActLists: TimelineActivity[] = [
    ...safeParseArray<TimelineActivity>(v3ActsRaw),
    ...legacy.activities.flatMap((k) => safeParseArray<TimelineActivity>(localStorage.getItem(k))),
  ];

  const movies = filterSeededDemoMovies(dedupeMovies(rawMovieLists));
  const collections = dedupeCollections(rawColLists);
  const activities = dedupeActivities(rawActLists);

  // Only persist upgraded keys if any prior data existed for this scope
  if (
    v3MoviesRaw !== null ||
    v3ColsRaw !== null ||
    v3ActsRaw !== null ||
    foundLegacyMovies ||
    foundLegacyCols ||
    foundLegacyActs
  ) {
    try {
      if (movies.length > 0 || v3MoviesRaw !== null) {
        localStorage.setItem(v3MoviesKey, JSON.stringify(movies));
      } else {
        localStorage.removeItem(v3MoviesKey);
      }
      if (collections.length > 0 || v3ColsRaw !== null) {
        localStorage.setItem(v3ColsKey, JSON.stringify(collections));
      }
      if (activities.length > 0 || v3ActsRaw !== null) {
        localStorage.setItem(v3ActsKey, JSON.stringify(activities));
      }
      localStorage.setItem(upgradeMarkerKey, "1");
    } catch {}
  }

  return { movies, collections, activities };
}

export function saveScopedLocalEntity(
  uid: string | null,
  type: "movies" | "collections" | "activities",
  data: unknown
) {
  if (typeof window === "undefined") return;
  try {
    const key =
      type === "movies"
        ? getWatchlistStorageKey(uid)
        : type === "collections"
          ? getCollectionsStorageKey(uid)
          : getActivitiesStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(getStorageUpgradeMarkerKey(uid), "1");
  } catch {}
}

/**
 * Clears guest local library storage ONLY after verified migration into a signed-in account,
 * preventing guest donations from leaking into a second account on the same browser or
 * reappearing after sign-out. Keeps non-library preferences and backups intact.
 */
export function clearConsumedGuestLibraryStorage() {
  if (typeof window === "undefined") return;
  try {
    const guestLegacy = getLegacyKeysForScope(null);
    const keysToClear = [
      getWatchlistStorageKey(null),
      getCollectionsStorageKey(null),
      getActivitiesStorageKey(null),
      ...guestLegacy.movies,
      ...guestLegacy.collections,
      ...guestLegacy.activities,
    ];
    for (const k of keysToClear) {
      localStorage.removeItem(k);
    }
    localStorage.setItem(getStorageUpgradeMarkerKey(null), "1");
  } catch {}
}
