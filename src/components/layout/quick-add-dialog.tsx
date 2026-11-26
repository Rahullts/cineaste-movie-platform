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
  const [trendingShowcase, setTrendingShowcase] = React.useState<Movie[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLoadingShowcase, setIsLoadingShowcase] = React.useState(true);
  const [searchError, setSearchError] = React.useState<string | null>(null);

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

  // Load curated trending film visuals for the empty state
  React.useEffect(() => {
    let active = true;
    setIsLoadingShowcase(true);

    tmdbFetch({ action: "trending", window: "week", page: 1 })
      .then((res) => {
        if (!active) return;
        const picked = (res.results || [])
          .filter((m) => Boolean(m.poster_path))
          .slice(0, 6);
        setTrendingShowcase(picked);
      })
      .catch(() => {
        if (active) setTrendingShowcase([]);
      })
      .finally(() => {
        if (active) setIsLoadingShowcase(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
    } else {
      void addToWatchlist(film);
    }
  };

  const handleWatchedToggle = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    const existing = getLibraryEntry(id);
    if (existing?.status === "watched") {
      updateStatus(id, "want");
    } else {
      markWatched(film);
    }
  };

  const handleOpenFilm = (film: Movie) => {
    const id = film.tmdb_id || film.id;
    onClose();
    router.push(`/movie/${id}`);
  };

  const trimmedQuery = query.trim();

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
      className="fixed inset-0 m-auto w-[min(94vw,680px)] max-h-[86vh] p-0 border-0 bg-transparent text-foreground rounded-3xl overflow-visible backdrop:bg-black/75 backdrop:backdrop-blur-md open:flex open:flex-col animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-full max-h-[86vh] flex flex-col rounded-3xl bg-popover dark:bg-[#11131C] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.88)] overflow-hidden">
        {/* Top Bar — borderless tonal header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#00D878]/12 text-[#00D878] grid place-items-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="quick-add-title"
                className="font-heading text-base font-semibold text-foreground tracking-tight truncate"
              >
                Add Film to Vault
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Log watched films, save to Watchlist, or mark Favorites
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick add"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-muted-foreground hover:text-foreground grid place-items-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seamless Search Input — zero green border/ring outline */}
        <div className="px-6 pb-4">
          <div className="relative flex items-center h-12 rounded-2xl bg-secondary focus-within:bg-accent dark:bg-[#171A26] dark:focus-within:bg-[#1D2130] transition-colors px-4 gap-3">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#00D878] animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any film title (e.g. Fargo, Dune, Past Lives)..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-background dark:bg-white/[0.08] transition cursor-pointer shrink-0"
              >
                Clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-background dark:bg-white/[0.08] text-[10px] font-medium text-muted-foreground shrink-0">
                Esc
              </kbd>
            )}
          </div>
        </div>

        {/* Content Body — visual trending showcase or live TMDB search results */}
        <div className="px-6 pb-5 overflow-y-auto flex-1 space-y-3">
          {!trimmedQuery ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Popular This Week
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Tap an icon for instant logging
                </span>
              </div>

              {isLoadingShowcase ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-20 rounded-2xl bg-secondary dark:bg-[#171A26] animate-pulse"
                    />
                  ))}
                </div>
              ) : trendingShowcase.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {trendingShowcase.map((film) => (
                    <QuickAddFilmRow
                      key={film.tmdb_id || film.id}
                      film={film}
                      entry={getLibraryEntry(film.tmdb_id || film.id)}
                      onOpenFilm={handleOpenFilm}
                      onToggleWatchlist={handleWatchlistToggle}
                      onToggleWatched={handleWatchedToggle}
                      onToggleFavorite={toggleFavorite}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-secondary dark:bg-[#171A26] p-6 text-center text-xs text-muted-foreground">
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
                  className="h-20 rounded-2xl bg-secondary dark:bg-[#171A26] animate-pulse"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl bg-secondary dark:bg-[#171A26] p-8 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                No matching films found
              </p>
              <p className="text-xs text-muted-foreground">
                Try another title or browse the curated catalog in Discover.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((film) => (
                <QuickAddFilmRow
                  key={film.tmdb_id || film.id}
                  film={film}
                  entry={getLibraryEntry(film.tmdb_id || film.id)}
                  onOpenFilm={handleOpenFilm}
                  onToggleWatchlist={handleWatchlistToggle}
                  onToggleWatched={handleWatchedToggle}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

        {/* Seamless Footer — no divider line */}
        <div className="px-6 py-4 bg-muted dark:bg-[#0C0E15] flex items-center justify-between gap-3">
          {onOpenCommandPalette ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCommandPalette();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <Command className="w-3.5 h-3.5" />
              <span>Command Palette</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Browse genres, moods, and collections
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/discover");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D878] hover:text-[#00BF6A] transition cursor-pointer"
          >
            <span>Open Discover Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </dialog>
  );
}

function QuickAddFilmRow({
  film,
  entry,
  onOpenFilm,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
  compact = false,
}: {
  film: Movie;
  entry?: Movie;
  onOpenFilm: (film: Movie) => void;
  onToggleWatchlist: (film: Movie) => void;
  onToggleWatched: (film: Movie) => void;
  onToggleFavorite: (film: Movie) => void;
  compact?: boolean;
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
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl bg-secondary hover:bg-accent dark:bg-[#171A26] dark:hover:bg-[#1E2232] transition-colors p-2.5",
        compact ? "pr-2.5" : "px-3"
      )}
    >
      <button
        type="button"
        onClick={() => onOpenFilm(film)}
        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
      >
        <div className="w-11 h-16 rounded-xl overflow-hidden bg-background shrink-0">
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

        <div className="min-w-0 space-y-1">
          <p className="font-heading text-sm font-semibold text-foreground group-hover:text-[#00D878] transition-colors truncate">
            {film.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {year && <span>{year}</span>}
            {rating && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400" />
                {rating}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Borderless tactile circular quick-log actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onToggleWatchlist(film)}
          title={isInLibrary ? "Remove from Library" : "Add to Watchlist"}
          aria-label={isInLibrary ? "Remove from Watchlist" : "Add to Watchlist"}
          className={cn(
            "w-8 h-8 rounded-full grid place-items-center transition cursor-pointer",
            isInLibrary
              ? "bg-[#00D878] text-[#050608] shadow-sm shadow-[#00D878]/20"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.16] text-muted-foreground hover:text-foreground"
          )}
        >
          {isInLibrary ? (
            compact ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            )
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleWatched(film)}
          title={isWatched ? "Unmark Watched" : "Mark as Watched"}
          aria-label={isWatched ? "Unmark Watched" : "Mark as Watched"}
          className={cn(
            "w-8 h-8 rounded-full grid place-items-center transition cursor-pointer",
            isWatched
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.16] text-muted-foreground hover:text-foreground"
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
            "w-8 h-8 rounded-full grid place-items-center transition cursor-pointer",
            isFavorite
              ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
              : "bg-background hover:bg-muted dark:bg-white/[0.08] dark:hover:bg-white/[0.16] text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
        </button>
      </div>
    </div>
  );
}
