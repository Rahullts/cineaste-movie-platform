"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  Check,
  Film,
  Loader2,
  RotateCcw,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { getTmdbImageUrl } from "@/lib/image-util";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import { useLibrary } from "@/lib/library-store";
import { CineasteLogo } from "@/components/ui/cineaste-logo";
import type { Movie } from "@/types";
import { cn } from "@/lib/utils";

const QUICK_RECENT_KEY = "cineaste_quick_add_recent_v1";

const GENRE_NAME_MAP = new Map<number, string>(
  TMDB_GENRES.map((g) => [g.id, g.name])
);

function getFilmGenreText(film: Movie): string | null {
  if (Array.isArray(film.genres) && film.genres.length > 0) {
    const names = film.genres
      .slice(0, 2)
      .map((g: any) => (typeof g === "string" ? g : g?.name))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  const ids = (film as any)?.genre_ids;
  if (Array.isArray(ids) && ids.length > 0) {
    const names = ids
      .slice(0, 2)
      .map((id: number) => GENRE_NAME_MAP.get(id))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  return null;
}

function readRecentQueries(): string[] {
  try {
    const raw = localStorage.getItem(QUICK_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function recordRecentQuery(term: string) {
  const clean = term.trim();
  if (!clean) return;
  try {
    const existing = readRecentQueries().filter(
      (q) => q.toLowerCase() !== clean.toLowerCase()
    );
    localStorage.setItem(
      QUICK_RECENT_KEY,
      JSON.stringify([clean, ...existing].slice(0, 4))
    );
  } catch {
    // ignore storage errors
  }
}

export interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommandPalette?: () => void;
}

export function QuickAddDialog({
  isOpen,
  onClose,
}: QuickAddDialogProps) {
  if (!isOpen) return null;
  return <MovieCommandDockContent onClose={onClose} />;
}

/**
 * CINEASTE — MOVIE COMMAND DOCK
 *
 * Compact, keyboard-first vertical command surface (560-680px desktop,
 * mobile bottom-sheet) powered cleanly by LibraryProvider + TMDB live search.
 */
function MovieCommandDockContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const pressedOutsideRef = React.useRef(false);

  const { movies: libraryMovies, addToWatchlist } = useLibrary();

  const [query, setQuery] = React.useState("");
  const [recentQueries, setRecentQueries] = React.useState<string[]>([]);
  const [popularSuggestions, setPopularSuggestions] = React.useState<Movie[]>([]);
  const [results, setResults] = React.useState<Movie[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = React.useState(0);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [actionStatus, setActionStatus] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Show modal in top layer & focus input immediately
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    setRecentQueries(readRecentQueries());

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(timer);
      if (dialog.open) dialog.close();
    };
  }, []);

  // Load compact default film suggestions when idle
  React.useEffect(() => {
    let active = true;
    setIsLoadingPopular(true);

    tmdbFetch({ action: "trending", window: "week", page: 1 })
      .then((res) => {
        if (!active) return;
        const picked = (res.results || [])
          .filter((m) => Boolean(m.title))
          .slice(0, 5);
        setPopularSuggestions(picked);
      })
      .catch(() => {
        if (active) setPopularSuggestions([]);
      })
      .finally(() => {
        if (active) setIsLoadingPopular(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Debounced live TMDB search
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setActiveIndex(0);
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
          setResults((res.results || []).slice(0, 10));
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) {
          setSearchError("Unable to reach film catalog. Check your connection and retry.");
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, searchAttempt]);

  // Auto-dismiss transient feedback
  React.useEffect(() => {
    if (!actionStatus) return;
    const t = window.setTimeout(() => setActionStatus(null), 3200);
    return () => window.clearTimeout(t);
  }, [actionStatus]);

  const trimmedQuery = query.trim();
  const visibleMovies = trimmedQuery ? results : popularSuggestions;

  // Keep active row visible while stepping with ArrowUp / ArrowDown
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-dock-index="${activeIndex}"]`
    ) as HTMLElement | null;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, visibleMovies.length]);

  const getLibraryEntry = React.useCallback(
    (tmdbId: number) =>
      libraryMovies.find((m) => (m.tmdb_id || m.id) === tmdbId),
    [libraryMovies]
  );

  const handleOpenDetail = React.useCallback(
    (film: Movie) => {
      const id = film.tmdb_id || film.id;
      if (trimmedQuery) {
        recordRecentQuery(trimmedQuery);
      }
      onClose();
      router.push(`/movie/${id}`);
    },
    [onClose, router, trimmedQuery]
  );

  const handleAddFilm = React.useCallback(
    async (film: Movie) => {
      const id = film.tmdb_id || film.id;
      if (!id || savingId === id) return;

      // Prevent duplicate additions when already saved in Vault
      const existing = getLibraryEntry(id);
      if (
        existing &&
        (existing.status === "want" ||
          existing.status === "watching" ||
          existing.status === "watched")
      ) {
        setActionStatus({
          type: "success",
          text: `"${film.title}" is already in your ${
            existing.status === "watched" ? "Watched archive" : "Watchlist"
          }`,
        });
        return;
      }

      if (trimmedQuery) {
        recordRecentQuery(trimmedQuery);
        setRecentQueries(readRecentQueries());
      }

      setSavingId(id);
      setActionStatus(null);
      try {
        const res = await addToWatchlist(film);
        if (res.ok) {
          setActionStatus({
            type: "success",
            text: `Saved "${film.title}" to Watchlist`,
          });
        } else {
          setActionStatus({
            type: "error",
            text: res.error || `Failed to save "${film.title}".`,
          });
        }
      } catch {
        setActionStatus({
          type: "error",
          text: `Failed to save "${film.title}".`,
        });
      } finally {
        setSavingId(null);
      }
    },
    [addToWatchlist, getLibraryEntry, savingId, trimmedQuery]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (visibleMovies.length > 0) {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % visibleMovies.length);
      }
    } else if (e.key === "ArrowUp") {
      if (visibleMovies.length > 0) {
        e.preventDefault();
        setActiveIndex(
          (prev) => (prev - 1 + visibleMovies.length) % visibleMovies.length
        );
      }
    } else if (e.key === "Enter") {
      const selected = visibleMovies[activeIndex];
      if (!selected) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        handleOpenDetail(selected);
      } else {
        const id = selected.tmdb_id || selected.id;
        const existing = getLibraryEntry(id);
        if (
          existing &&
          (existing.status === "want" ||
            existing.status === "watching" ||
            existing.status === "watched")
        ) {
          handleOpenDetail(selected);
        } else {
          void handleAddFilm(selected);
        }
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      data-testid="quick-add-dialog"
      aria-labelledby="quick-add-title"
      {...({ closedby: "any" } as any)}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        if ("closedBy" in HTMLDialogElement.prototype || !dialogRef.current) return;
        const r = dialogRef.current.getBoundingClientRect();
        pressedOutsideRef.current =
          e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      }}
      onPointerUp={(e) => {
        if ("closedBy" in HTMLDialogElement.prototype || !dialogRef.current) return;
        const r = dialogRef.current.getBoundingClientRect();
        const releasedOutside =
          e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (pressedOutsideRef.current && releasedOutside) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className={cn(
        "fixed p-0 border-0 bg-transparent text-foreground overflow-visible backdrop:bg-black/75 backdrop:backdrop-blur-[2px]",
        "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:m-0 max-sm:w-full max-sm:max-w-full max-sm:max-h-[82vh]",
        "sm:inset-0 sm:m-auto sm:w-[min(92vw,620px)] sm:max-h-[470px]",
        "open:flex open:flex-col animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-150"
      )}
    >
      <div className="w-full max-h-[82vh] sm:max-h-[470px] flex flex-col rounded-t-2xl sm:rounded-xl bg-popover dark:bg-[#101118] border border-border dark:border-[#1E1F2A] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Minimal Dock Header */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-border/70 dark:border-[#1E1F2A] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CineasteLogo size={15} />
            <h2
              id="quick-add-title"
              className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground font-semibold truncate"
            >
              Movie Command Dock
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick add"
            className="h-6 px-2 rounded-md text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.07] inline-flex items-center gap-1 transition cursor-pointer shrink-0"
          >
            <span>ESC</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Focused Search Field */}
        <div className="px-4 py-3 border-b border-border/70 dark:border-[#1E1F2A] shrink-0">
          <div className="flex items-center gap-2.5">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#00D664] animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label="Search films to add"
              placeholder="Search film title, director, or year..."
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/75 outline-none border-0 focus:outline-none focus:ring-0"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.08] transition cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Idle Recent Search Chips */}
          {!trimmedQuery && recentQueries.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/50 dark:border-[#1E1F2A]/70">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
                <Clock className="w-3 h-3" />
                Recent
              </span>
              {recentQueries.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    inputRef.current?.focus();
                  }}
                  className="px-2 py-0.5 rounded bg-secondary dark:bg-[#171924] hover:text-[#00D664] text-[11px] text-muted-foreground transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical Index Results Area — no boxy rounded cards per row */}
        <div
          ref={listRef}
          role="listbox"
          aria-label={trimmedQuery ? "Search results" : "Suggested films"}
          className="flex-1 overflow-y-auto divide-y divide-border/40 dark:divide-[#1E1F2A]/60"
        >
          {searchError ? (
            <div className="px-5 py-10 text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSearchAttempt((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary dark:bg-[#191C28] hover:bg-[#00D664] hover:text-[#050608] text-xs font-medium text-foreground transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            </div>
          ) : isSearching && results.length === 0 ? (
            <div className="px-4 py-3 space-y-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-12 flex items-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-11 rounded-sm bg-secondary dark:bg-[#181A25] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/5 rounded bg-secondary dark:bg-[#181A25]" />
                    <div className="h-2.5 w-1/4 rounded bg-secondary dark:bg-[#181A25]" />
                  </div>
                </div>
              ))}
            </div>
          ) : trimmedQuery && results.length === 0 ? (
            <div className="px-5 py-10 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                No matching films found for &ldquo;{trimmedQuery}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Check spelling or search by director or release title.
              </p>
            </div>
          ) : !trimmedQuery && isLoadingPopular && popularSuggestions.length === 0 ? (
            <div className="px-4 py-3 space-y-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-12 flex items-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-11 rounded-sm bg-secondary dark:bg-[#181A25] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/5 rounded bg-secondary dark:bg-[#181A25]" />
                    <div className="h-2.5 w-1/4 rounded bg-secondary dark:bg-[#181A25]" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleMovies.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-muted-foreground">
              Type any film title above to add it directly to your Watchlist.
            </div>
          ) : (
            <div>
              <div className="px-4 py-1.5 bg-muted/30 dark:bg-[#0C0D13] text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                {trimmedQuery
                  ? `${results.length} matching ${results.length === 1 ? "title" : "titles"}`
                  : "Quick Suggestions — Trending This Week"}
              </div>
              {visibleMovies.map((film, idx) => {
                const filmId = film.tmdb_id || film.id;
                const entry = getLibraryEntry(filmId);
                const isWatched = entry?.status === "watched";
                const isAdded = Boolean(
                  entry &&
                    (entry.status === "want" ||
                      entry.status === "watching" ||
                      entry.status === "watched")
                );
                const isSaving = savingId === filmId;
                const isActive = idx === activeIndex;
                const posterUrl = getTmdbImageUrl(film.poster_path, "w92");
                const year = film.release_date?.slice(0, 4);
                const genreText = getFilmGenreText(film);

                return (
                  <div
                    key={filmId}
                    data-dock-index={idx}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "relative flex items-center justify-between gap-3 px-4 py-2.5 min-h-[56px] transition-colors",
                      isActive
                        ? "bg-secondary/90 dark:bg-[#171A25]"
                        : "hover:bg-secondary/50 dark:hover:bg-[#141720]"
                    )}
                  >
                    {/* Crisp active indicator rail */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 inset-y-1.5 w-[2px] bg-[#00D664]"
                      />
                    )}

                    {/* Left: Thumbnail + Title + Metadata */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(film)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      <div className="w-8 h-12 rounded-sm overflow-hidden bg-background dark:bg-[#0A0B0F] border border-border/60 dark:border-[#1E1F2A] shrink-0">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={film.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground">
                            <Film className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-[#00D664] transition-colors truncate flex items-center gap-1.5">
                          <span className="truncate">{film.title}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-70 shrink-0 transition-opacity" />
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
                          {[year, genreText].filter(Boolean).join(" • ") || "Feature Film"}
                        </p>
                      </div>
                    </button>

                    {/* Right: Priority Single Action */}
                    <div className="shrink-0">
                      {isAdded ? (
                        <span
                          aria-label={`${film.title} is ${isWatched ? "Watched" : "Added"}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#00D664]/12 text-[#00D664] text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{isWatched ? "Watched" : "Added"}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void handleAddFilm(film)}
                          className={cn(
                            "h-8 px-3.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-[0.97] cursor-pointer disabled:opacity-60",
                            isActive
                              ? "bg-[#00D664] text-[#050608] hover:bg-[#00BF59]"
                              : "bg-secondary dark:bg-[#191C28] text-foreground hover:bg-[#00D664] hover:text-[#050608]"
                          )}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 stroke-[2.3]" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard-Navigation Status & Hint Footer */}
        <div className="px-4 py-2 border-t border-border/70 dark:border-[#1E1F2A] bg-muted/40 dark:bg-[#0A0B0F]/80 flex items-center justify-between gap-3 text-[11px] text-muted-foreground shrink-0">
          {actionStatus ? (
            <span
              role="status"
              className={cn(
                "inline-flex items-center gap-1.5 font-medium truncate",
                actionStatus.type === "error"
                  ? "text-rose-400"
                  : "text-[#00D664]"
              )}
            >
              {actionStatus.type === "error" ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              )}
              <span className="truncate">{actionStatus.text}</span>
            </span>
          ) : (
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span>↑↓ Navigate</span>
              <span>↵ Add</span>
              <span className="hidden sm:inline">⌘↵ Open</span>
            </div>
          )}

          <span className="font-mono text-[10px] opacity-75 shrink-0">
            ⌘K
          </span>
        </div>
      </div>
    </dialog>
  );
}
