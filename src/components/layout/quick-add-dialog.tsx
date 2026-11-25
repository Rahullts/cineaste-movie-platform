"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Check,
  Eye,
  Heart,
  Star,
  Bookmark,
  X,
  Loader2,
  Film,
  ArrowRight,
  Clapperboard,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { useLibrary } from "@/lib/library-store";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie } from "@/types";

export interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommandPalette?: () => void;
}

const POPULAR_PICKS = [
  "Dune: Part Two",
  "Oppenheimer",
  "Interstellar",
  "Fargo",
  "Inception",
  "Past Lives",
];

export function QuickAddDialog({
  isOpen,
  onClose,
}: QuickAddDialogProps) {
  const library = useLibrary();
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const watchlistMap = React.useMemo(
    () => Object.fromEntries(library.movies.map((m) => [m.tmdb_id || m.id, m])),
    [library.movies]
  );

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {}
      }
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      if (dialog.open) dialog.close();
      setSearchValue("");
      setSearchResults([]);
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => {
      if (isOpen) onClose();
    };
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) onClose();
      pressedOutside = false;
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isOpen, onClose]);

  // Live debounced search against TMDB
  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = searchValue.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await tmdbFetch({ action: "search", query: trimmed, page: 1 });
        setSearchResults((res.results || []).slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchValue]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2800);
  };

  const handleAddWatchlist = (movie: Movie) => {
    const id = movie.tmdb_id || movie.id;
    const existing = watchlistMap[id];
    if (existing && (existing.status === "want" || existing.status === "watching")) {
      library.removeFromWatchlist(id);
      showFeedback(`Removed "${movie.title}" from your Watchlist`);
    } else {
      library.addToWatchlist(movie);
      showFeedback(`Added "${movie.title}" to Watchlist`);
    }
  };

  const handleMarkWatched = (movie: Movie) => {
    const id = movie.tmdb_id || movie.id;
    const existing = watchlistMap[id];
    if (existing?.status === "watched") {
      library.updateStatus(id, "want");
      showFeedback(`Removed "${movie.title}" from Watched`);
    } else {
      library.markWatched(movie);
      showFeedback(`Marked "${movie.title}" as Watched`);
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    const id = movie.tmdb_id || movie.id;
    const wasFav = watchlistMap[id]?.is_favorite;
    library.toggleFavorite(movie);
    showFeedback(wasFav ? `Removed "${movie.title}" from Favorites` : `Added "${movie.title}" to Favorites`);
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="quick-add-title"
      {...({ closedby: "any" } as any)}
      data-testid="quick-add-dialog"
      className="mx-auto mt-14 sm:mt-20 mb-auto w-[calc(100%-1.5rem)] max-w-2xl rounded-3xl bg-[#0D0F16] text-white p-0 shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop:bg-black/75 backdrop:backdrop-blur-md overflow-hidden border-0 flex flex-col max-h-[82vh]"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#0B0D14] shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#161924] grid place-items-center shrink-0 text-[#00D878]">
            <Clapperboard className="w-4 h-4" />
          </span>
          <div>
            <h1 id="quick-add-title" className="font-heading text-base font-semibold text-white leading-tight">
              Add Film to Library
            </h1>
            <p className="text-xs text-[#9CA3B8]">
              Search films to update Watchlist, Watched log, or Favorites
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick add"
          className="w-8 h-8 rounded-full bg-white/[0.06] text-[#9CA3B8] hover:text-white hover:bg-white/[0.12] grid place-items-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0D0F16] shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#161923] focus-within:ring-2 focus-within:ring-[#00D878]/50 transition">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[#00D878] animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-[#8D93A8] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by film title (e.g. Dune, Oppenheimer, Fargo)..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B7186] focus:outline-none"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              aria-label="Clear search"
              className="p-1 text-[#8D93A8] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[11px] text-[#8D93A8] bg-[#0D0F16] rounded-md px-2 py-0.5 font-sans font-medium">
            Esc
          </kbd>
        </div>

        {feedbackMsg && (
          <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-[#00D878]/12 text-xs text-[#4ADE80] font-medium flex items-center gap-2 animate-fadeIn">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Body: Results or Popular Picks */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-3">
        {searchValue.trim() ? (
          searchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-medium text-[#9CA3B8]">
                {searchResults.length} matching titles
              </p>
              {searchResults.map((movie) => {
                const mId = movie.tmdb_id || movie.id;
                const watchlistItem = watchlistMap[mId];
                const isSaved = Boolean(
                  watchlistItem &&
                    (watchlistItem.status === "want" || watchlistItem.status === "watching")
                );
                const isWatched = watchlistItem?.status === "watched";
                const isFavorite = Boolean(watchlistItem?.is_favorite);
                const posterUrl = getTmdbImageUrl(movie.poster_path, "w185");

                return (
                  <div
                    key={mId}
                    className="p-3 rounded-2xl bg-[#141722] hover:bg-[#191D2B] transition flex items-center gap-3.5 group/item"
                  >
                    <Link
                      href={`/movie/${mId}`}
                      onClick={onClose}
                      className="w-12 h-[72px] rounded-xl overflow-hidden bg-[#1D2030] shrink-0 relative block"
                    >
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={movie.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8D93A8]">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/movie/${mId}`}
                        onClick={onClose}
                        className="font-heading text-sm font-semibold text-white group-hover/item:text-[#00D878] transition-colors truncate block"
                      >
                        {movie.title}
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-[#C7CCDA] mt-1 font-medium tabular-nums">
                        {movie.vote_average !== undefined && movie.vote_average > 0 && (
                          <>
                            <span
                              title="TMDB Community Score"
                              className="inline-flex items-center gap-1 text-[#FBBF24]"
                            >
                              <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                              <span className="text-[11px] text-[#9CA3B8] font-medium">TMDB</span>
                              <span>{formatScore(movie.vote_average)}</span>
                            </span>
                            <span className="text-white/25" aria-hidden="true">•</span>
                          </>
                        )}
                        <span>{formatYear(movie.release_date)}</span>
                        {isWatched && (
                          <span className="px-2 py-0.5 rounded-full bg-[#00D878]/15 text-[#00D878] text-[11px] font-medium">
                            Watched
                          </span>
                        )}
                      </div>

                      {movie.overview && (
                        <p className="text-xs text-[#8D93A8] line-clamp-1 mt-1">
                          {movie.overview}
                        </p>
                      )}
                    </div>

                    {/* Separated Dark Borderless Circular Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddWatchlist(movie)}
                        title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                        className={`h-9 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                          isSaved
                            ? "bg-[#00D878] text-black"
                            : "bg-[#202433] text-white hover:bg-[#2A2F42]"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                            <span className="hidden sm:inline">In Watchlist</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Watchlist</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkWatched(movie)}
                        title={isWatched ? "Remove from Watched" : "Mark as Watched"}
                        aria-label={isWatched ? "Remove from Watched" : "Mark as Watched"}
                        className={`w-9 h-9 rounded-full grid place-items-center transition cursor-pointer ${
                          isWatched
                            ? "bg-[#00D878] text-black"
                            : "bg-[#202433] text-[#C7CCDA] hover:text-white hover:bg-[#2A2F42]"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(movie)}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        className={`w-9 h-9 rounded-full grid place-items-center transition cursor-pointer ${
                          isFavorite
                            ? "bg-rose-500 text-white"
                            : "bg-[#202433] text-[#C7CCDA] hover:text-rose-400 hover:bg-[#2A2F42]"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !isSearching ? (
            <div className="py-10 text-center space-y-1.5">
              <p className="text-sm font-semibold text-white">No films found for &ldquo;{searchValue}&rdquo;</p>
              <p className="text-xs text-[#9CA3B8]">
                Check your spelling or browse Discover Cinema for curated selections.
              </p>
            </div>
          ) : null
        ) : (
          <div className="space-y-5 py-1">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[#C7CCDA]">
                Popular Titles to Try
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PICKS.map((film) => (
                  <button
                    key={film}
                    type="button"
                    onClick={() => setSearchValue(film)}
                    className="px-3.5 py-2 rounded-full bg-[#161923] hover:bg-[#00D878]/15 text-xs font-medium text-[#E2E6F0] hover:text-[#00D878] transition cursor-pointer"
                  >
                    + {film}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-[#8D93A8]">
                Browse genres, moods, and global trends
              </span>
              <Link
                href="/discover"
                onClick={onClose}
                className="text-xs font-semibold text-[#00D878] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Open Discover Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
