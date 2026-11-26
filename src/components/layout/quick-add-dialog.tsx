"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  Check,
  Eye,
  Heart,
  Film,
  ArrowRight,
  Star,
  Loader2,
  Bookmark,
  Command,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { getTmdbImageUrl } from "@/lib/image-util";
import { useLibrary } from "@/lib/library-store";
import type { Movie } from "@/types";
import { cn } from "@/lib/utils";

export interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommandPalette?: () => void;
}

type ShelfTab = "trending" | "acclaimed" | "popular";

const SHELF_CONFIG: Record<
  ShelfTab,
  {
    label: string;
    payload: Record<string, any>;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  trending: {
    label: "Trending This Week",
    payload: { action: "trending", window: "week", page: 1 },
    icon: TrendingUp,
  },
  acclaimed: {
    label: "Critically Acclaimed",
    payload: { action: "discover", sort_by: "vote_average.desc", min_votes: 1500, page: 1 },
    icon: Award,
  },
  popular: {
    label: "Popular Picks",
    payload: { action: "discover", sort_by: "popularity.desc", page: 1 },
    icon: Sparkles,
  },
};

export function QuickAddDialog({
  isOpen,
  onClose,
  onOpenCommandPalette,
}: QuickAddDialogProps) {
  if (!isOpen) return null;
  return (
    <QuickAddDialogContent
      onClose={onClose}
      onOpenCommandPalette={onOpenCommandPalette}
    />
  );
}

function QuickAddDialogContent({
  onClose,
  onOpenCommandPalette,
}: {
  onClose: () => void;
  onOpenCommandPalette?: () => void;
}) {
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    movies: libraryMovies,
    addToWatchlist,
    removeFromWatchlist,
    markWatched,
    updateStatus,
    toggleFavorite,
  } = useLibrary();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Movie[]>([]);
  const [activeShelf, setActiveShelf] = React.useState<ShelfTab>("trending");
  const [shelfCache, setShelfCache] = React.useState<Partial<Record<ShelfTab, Movie[]>>>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLoadingShowcase, setIsLoadingShowcase] = React.useState(true);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);

  // Open native modal dialog in top-layer cleanly
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  // Load curated shelf films for visual poster deck
  React.useEffect(() => {
    let active = true;
    const cached = shelfCache[activeShelf];
    if (cached && cached.length > 0) {
      setIsLoadingShowcase(false);
      return;
    }

    setIsLoadingShowcase(true);
    tmdbFetch(SHELF_CONFIG[activeShelf].payload)
      .then((res) => {
        if (!active) return;
        const picked = (res.results || [])
          .filter((m) => Boolean(m.poster_path && m.title))
          .slice(0, 8);
        setShelfCache((prev) => ({ ...prev, [activeShelf]: picked }));
      })
      .catch(() => {
        if (active) {
          setShelfCache((prev) => ({ ...prev, [activeShelf]: [] }));
        }
      })
      .finally(() => {
        if (active) setIsLoadingShowcase(false);
      });

    return () => {
      active = false;
    };
  }, [activeShelf, shelfCache]);

  // Debounced TMDB film search
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const res = await tmdbFetch({
          action: "search",
          query: trimmed,
          page: 1,
        });
        if (cancelled) return;
        if (res.error) {
          setSearchError(res.error);
          setResults([]);
        } else {
          setResults((res.results || []).slice(0, 12));
        }
      } catch {
        if (!cancelled) {
          setSearchError("Unable to search TMDB right now.");
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  // Auto-hide inline quick confirmation pill
  React.useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 2200);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  const getLibraryEntry = React.useCallback(
    (tmdbId: number) =>
      libraryMovies.find((m) => (m.tmdb_id || m.id) === tmdbId),
    [libraryMovies]
  );

  const handleWatchlistToggle = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    const existing = getLibraryEntry(id);
    if (existing && (existing.status === "want" || existing.status === "watching")) {
      void removeFromWatchlist(id);
      setFeedbackMsg(`Removed "${film.title}" from Watchlist`);
    } else {
      void addToWatchlist(film);
      setFeedbackMsg(`Added "${film.title}" to Watchlist`);
    }
  };

  const handleWatchedToggle = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    const existing = getLibraryEntry(id);
    if (existing?.status === "watched") {
      updateStatus(id, "want");
      setFeedbackMsg(`Moved "${film.title}" back to Watchlist`);
    } else {
      markWatched(film);
      setFeedbackMsg(`Logged "${film.title}" as Watched`);
    }
  };

  const handleFavoriteToggle = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    const existing = getLibraryEntry(id);
    const willBeFav = !existing?.is_favorite;
    void toggleFavorite(existing || film);
    setFeedbackMsg(
      willBeFav
        ? `Added "${film.title}" to Favorites`
        : `Removed "${film.title}" from Favorites`
    );
  };

  const handleOpenFilm = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    onClose();
    router.push(`/movie/${id}`);
  };

  const trimmedQuery = query.trim();
  const showcaseMovies = shelfCache[activeShelf] || [];

  return (
    <dialog
      ref={dialogRef}
      data-testid="quick-add-dialog"
      aria-labelledby="quick-add-title"
      {...({ closedby: "any" } as any)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 m-auto w-[min(95vw,840px)] max-h-[88vh] p-0 border-0 bg-transparent text-foreground rounded-[28px] overflow-visible backdrop:bg-black/80 backdrop:backdrop-blur-md open:flex open:flex-col animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="relative w-full max-h-[88vh] flex flex-col rounded-[28px] bg-popover dark:bg-[#0B0D14]/98 shadow-[0_40px_120px_-15px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">
        {/* Subtle Ambient Cinema Projection Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[220px] bg-[radial-gradient(ellipse_at_center,rgba(0,224,84,0.14),transparent_70%)] blur-2xl"
        />

        {/* Sleek Studio Header + Close */}
        <div className="relative z-10 px-6 sm:px-7 pt-6 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#00D878]/14 text-[#00D878] grid place-items-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="quick-add-title"
                className="font-brand text-lg font-bold text-foreground tracking-tight truncate"
              >
                Quick Log &amp; Vault Stage
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Instant Watchlist saving, screening logs, and Favorites across global cinema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick add"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent dark:bg-white/[0.07] dark:hover:bg-white/[0.14] text-muted-foreground hover:text-foreground grid place-items-center transition active:scale-90 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Tactile Search Trough — soft specular depth glow, zero green outline borders */}
        <div className="relative z-10 px-6 sm:px-7 pb-4">
          <div className="relative flex items-center h-[52px] sm:h-14 rounded-2xl bg-secondary/90 focus-within:bg-accent dark:bg-[#131622]/90 dark:focus-within:bg-[#181C2C] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_-8px_rgba(0,0,0,0.45)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_-10px_rgba(0,224,84,0.18)] transition-all px-4 gap-3">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-[#00D878] animate-spin shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-[#00D878] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any film title, director, or classic (e.g. Fargo, Interstellar, Dune)..."
              className="w-full bg-transparent text-sm sm:text-[15px] text-foreground placeholder:text-muted-foreground/80 outline-none border-0 focus:outline-none focus:ring-0"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl bg-background/70 dark:bg-white/[0.08] hover:dark:bg-white/[0.14] transition active:scale-95 cursor-pointer shrink-0"
              >
                Clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-background/60 dark:bg-white/[0.06] text-[10px] font-mono text-muted-foreground shrink-0">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Content Body — 4-column visual poster stage OR full-width live TMDB search rows */}
        <div className="relative z-10 px-6 sm:px-7 pb-5 overflow-y-auto flex-1 space-y-4">
          {/* Live Feedback Banner */}
          {feedbackMsg && (
            <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#00D878]/14 text-[#00D878] text-xs font-semibold animate-fadeIn">
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                {feedbackMsg}
              </span>
            </div>
          )}

          {!trimmedQuery ? (
            <div className="space-y-4">
              {/* Interactive Curation Shelf Switcher Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(Object.keys(SHELF_CONFIG) as ShelfTab[]).map((tabKey) => {
                    const cfg = SHELF_CONFIG[tabKey];
                    const Icon = cfg.icon;
                    const active = activeShelf === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setActiveShelf(tabKey)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer",
                          active
                            ? "bg-[#00D878] text-[#050608] shadow-md shadow-[#00D878]/20"
                            : "bg-secondary hover:bg-accent dark:bg-white/[0.06] dark:hover:bg-white/[0.11] text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  One-tap logging on any poster
                </span>
              </div>

              {/* 4-Column Haptic Poster Grid (Zero Truncated Clipped Text!) */}
              {isLoadingShowcase ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <div className="aspect-[2/3] w-full rounded-2xl bg-secondary dark:bg-[#141722]" />
                      <div className="h-3.5 w-4/5 rounded bg-secondary dark:bg-[#141722]" />
                    </div>
                  ))}
                </div>
              ) : showcaseMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                  {showcaseMovies.map((film) => (
                    <QuickAddPosterCard
                      key={film.tmdb_id || film.id}
                      film={film}
                      entry={getLibraryEntry(film.tmdb_id || film.id)}
                      onOpenFilm={handleOpenFilm}
                      onToggleWatchlist={handleWatchlistToggle}
                      onToggleWatched={handleWatchedToggle}
                      onToggleFavorite={handleFavoriteToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-secondary dark:bg-[#141722] p-8 text-center text-xs text-muted-foreground">
                  Start typing any movie title above to search global cinema.
                </div>
              )}
            </div>
          ) : searchError ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-6 text-center text-xs text-destructive">
              {searchError}
            </div>
          ) : isSearching && results.length === 0 ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-2xl bg-secondary dark:bg-[#141722] animate-pulse"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl bg-secondary dark:bg-[#141722] p-10 text-center space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                No matching films found
              </p>
              <p className="text-xs text-muted-foreground">
                Try another title or explore the curated catalog in Discover.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground px-1">
                {results.length} matching {results.length === 1 ? "film" : "films"}
              </p>
              {results.map((film) => (
                <QuickAddFilmRow
                  key={film.tmdb_id || film.id}
                  film={film}
                  entry={getLibraryEntry(film.tmdb_id || film.id)}
                  onOpenFilm={handleOpenFilm}
                  onToggleWatchlist={handleWatchlistToggle}
                  onToggleWatched={handleWatchedToggle}
                  onToggleFavorite={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Seamless Footer Bar */}
        <div className="relative z-10 px-6 sm:px-7 py-3.5 bg-muted/80 dark:bg-[#080A10]/90 flex items-center justify-between gap-3">
          {onOpenCommandPalette ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCommandPalette();
              }}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/70 dark:bg-white/[0.07] font-mono text-[10px]">
                <Command className="w-3 h-3" />K
              </span>
              <span>Command Palette</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Synced instantly with your Cinema Vault
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/discover");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D878] hover:text-[#00F084] transition cursor-pointer group"
          >
            <span>Explore Full Discover Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Tactile 2:3 Poster Card for Quick Add Showcase
 */
function QuickAddPosterCard({
  film,
  entry,
  onOpenFilm,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: {
  film: Movie;
  entry?: Movie;
  onOpenFilm: (film: Movie) => void;
  onToggleWatchlist: (film: Movie) => void;
  onToggleWatched: (film: Movie) => void;
  onToggleFavorite: (film: Movie) => void;
}) {
  const posterUrl = getTmdbImageUrl(film.poster_path, "w500");
  const year = film.release_date ? film.release_date.slice(0, 4) : null;
  const rating =
    typeof film.vote_average === "number" && film.vote_average > 0
      ? film.vote_average.toFixed(1)
      : null;

  const isInLibrary = Boolean(entry);
  const isWatched = entry?.status === "watched";
  const isFavorite = Boolean(entry?.is_favorite);

  return (
    <div className="group flex flex-col gap-2 select-none">
      {/* Poster Frame + Floating Haptic Action Dock */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-secondary dark:bg-[#141722] shadow-lg shadow-black/50 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-0.5">
        <button
          type="button"
          onClick={() => onOpenFilm(film)}
          aria-label={`Open ${film.title}`}
          className="w-full h-full block cursor-pointer focus-visible:outline-none"
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={film.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground">
              <Film className="w-6 h-6 opacity-40" />
            </div>
          )}
        </button>

        {/* Bottom Scrim for Contrast Behind Haptic Action Dock */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

        {/* Top-Left Rating Badge */}
        {rating && (
          <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-amber-400 tabular-nums">
            <Star className="w-2.5 h-2.5 fill-amber-400" />
            {rating}
          </span>
        )}

        {/* Bottom Haptic Action Pill Dock */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 px-1.5 py-1 rounded-full bg-black/65 backdrop-blur-xl shadow-lg"
        >
          <button
            type="button"
            onClick={() => onToggleWatchlist(film)}
            title={isInLibrary ? "In Vault — Click to remove" : "Add to Watchlist"}
            aria-label={isInLibrary ? "Remove from Watchlist" : "Add to Watchlist"}
            className={cn(
              "flex-1 h-7 rounded-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold transition-all duration-150 active:scale-90 cursor-pointer",
              isInLibrary
                ? "bg-[#00D878] text-[#050608] shadow-sm shadow-[#00D878]/30"
                : "text-white/90 hover:bg-white/15 hover:text-white"
            )}
          >
            {isInLibrary ? (
              <>
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleWatched(film)}
            title={isWatched ? "Unmark Watched" : "Mark as Watched"}
            aria-label={isWatched ? "Unmark Watched" : "Mark as Watched"}
            className={cn(
              "w-7 h-7 rounded-full grid place-items-center transition-all duration-150 active:scale-90 cursor-pointer shrink-0",
              isWatched
                ? "bg-sky-500 text-white"
                : "text-white/80 hover:bg-white/15 hover:text-white"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(film)}
            title={isFavorite ? "Remove Favorite" : "Add to Favorites"}
            aria-label={isFavorite ? "Remove Favorite" : "Add to Favorites"}
            className={cn(
              "w-7 h-7 rounded-full grid place-items-center transition-all duration-150 active:scale-90 cursor-pointer shrink-0",
              isFavorite
                ? "bg-rose-500 text-white"
                : "text-white/80 hover:bg-white/15 hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Full Clean 2-Line Title + Year (Never clipped like Avengers: Doo...) */}
      <button
        type="button"
        onClick={() => onOpenFilm(film)}
        className="text-left px-0.5 space-y-0.5 cursor-pointer group/title"
      >
        <p className="font-heading text-xs sm:text-[13px] font-semibold text-foreground group-hover/title:text-[#00D878] transition-colors line-clamp-2 leading-snug">
          {film.title}
        </p>
        {year && (
          <p className="text-[11px] text-muted-foreground tabular-nums">{year}</p>
        )}
      </button>
    </div>
  );
}

/**
 * Full-Width Editorial Row for Search Results (Zero Clipped Titles)
 */
function QuickAddFilmRow({
  film,
  entry,
  onOpenFilm,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: {
  film: Movie;
  entry?: Movie;
  onOpenFilm: (film: Movie) => void;
  onToggleWatchlist: (film: Movie) => void;
  onToggleWatched: (film: Movie) => void;
  onToggleFavorite: (film: Movie) => void;
}) {
  const posterUrl = getTmdbImageUrl(film.poster_path, "w185");
  const year = film.release_date ? film.release_date.slice(0, 4) : null;
  const rating =
    typeof film.vote_average === "number" && film.vote_average > 0
      ? film.vote_average.toFixed(1)
      : null;

  const isInLibrary = Boolean(entry);
  const isWatched = entry?.status === "watched";
  const isFavorite = Boolean(entry?.is_favorite);

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl bg-secondary/75 hover:bg-accent dark:bg-[#131622]/90 dark:hover:bg-[#191D2D] transition-colors p-3">
      <button
        type="button"
        onClick={() => onOpenFilm(film)}
        className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 text-left cursor-pointer"
      >
        <div className="w-12 sm:w-14 h-[72px] sm:h-[82px] rounded-xl overflow-hidden bg-background shrink-0 shadow-md">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={film.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground">
              <Film className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-sm sm:text-[15px] font-semibold text-foreground group-hover:text-[#00D878] transition-colors">
              {film.title}
            </p>
            {year && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({year})
              </span>
            )}
            {rating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-400 text-[11px] font-semibold tabular-nums">
                <Star className="w-3 h-3 fill-amber-400" />
                {rating}
              </span>
            )}
          </div>
          {film.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {film.overview}
            </p>
          )}
        </div>
      </button>

      {/* Tactile Pill Controls */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onToggleWatchlist(film)}
          title={isInLibrary ? "Remove from Library" : "Add to Watchlist"}
          aria-label={isInLibrary ? "Remove from Watchlist" : "Add to Watchlist"}
          className={cn(
            "h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer",
            isInLibrary
              ? "bg-[#00D878] text-[#050608] shadow-sm shadow-[#00D878]/25"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-foreground"
          )}
        >
          {isInLibrary ? (
            <>
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>In Vault</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Watchlist</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleWatched(film)}
          title={isWatched ? "Unmark Watched" : "Mark as Watched"}
          aria-label={isWatched ? "Unmark Watched" : "Mark as Watched"}
          className={cn(
            "w-9 h-9 rounded-full grid place-items-center transition-all duration-150 active:scale-90 cursor-pointer",
            isWatched
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onToggleFavorite(film)}
          title={isFavorite ? "Remove Favorite" : "Add to Favorites"}
          aria-label={isFavorite ? "Remove Favorite" : "Add to Favorites"}
          className={cn(
            "w-9 h-9 rounded-full grid place-items-center transition-all duration-150 active:scale-90 cursor-pointer",
            isFavorite
              ? "bg-rose-500 text-white shadow-sm shadow-rose-500/25"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-muted-foreground hover:text-rose-400"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </div>
    </div>
  );
}
