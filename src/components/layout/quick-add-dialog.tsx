"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Plus,
  Check,
  Eye,
  Star,
  Bookmark,
  X,
  Loader2,
  Film,
  ArrowRight,
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

export function QuickAddDialog({
  isOpen,
  onClose,
  onOpenCommandPalette,
}: QuickAddDialogProps) {
  const library = useLibrary();
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Watchlist lookup map for instant status tracking
  const watchlistMap = React.useMemo(
    () => Object.fromEntries(library.movies.map((m) => [m.tmdb_id, m])),
    [library.movies]
  );

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setSearchValue("");
      setSearchResults([]);
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAddWatchlist = (movie: Movie) => {
    const isSaved = Boolean(watchlistMap[movie.tmdb_id]);
    if (isSaved) {
      library.removeFromWatchlist(watchlistMap[movie.tmdb_id]?.id || movie.tmdb_id);
      showFeedback(`Removed "${movie.title}" from your library`);
    } else {
      library.addToWatchlist(movie);
      showFeedback(`Added "${movie.title}" to your Watchlist!`);
    }
  };

  const handleMarkWatched = (movie: Movie) => {
    const existing = watchlistMap[movie.tmdb_id];
    if (existing?.status === "watched") {
      library.updateStatus(movie.tmdb_id, "want");
      showFeedback(`Marked "${movie.title}" as to watch`);
    } else {
      library.markWatched(movie, 8); // Default favorable rating
      showFeedback(`Marked "${movie.title}" as Watched!`);
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    library.toggleFavorite(movie);
    const wasFav = watchlistMap[movie.tmdb_id]?.is_favorite;
    showFeedback(wasFav ? `Removed "${movie.title}" from Favorites` : `Favorited "${movie.title}"!`);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Add Movie to Library"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-[#101118] border border-[#1E1F2A] shadow-2xl shadow-black/80 animate-slideDown flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#1E1F2A] bg-[#0D0E14] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#00D664]/15 border border-[#00D664]/30 grid place-items-center shrink-0 text-[#00D664]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <span>Quick Add to Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D664]/10 text-[#00D664] border border-[#00D664]/30 font-mono">
                  Live TMDB
                </span>
              </p>
              <p className="text-xs text-[#9496A1]">
                Search any film to instantly add to Watchlist, Watched, or Favorites
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9496A1] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-4 border-b border-[#1E1F2A] bg-[#101118] shrink-0">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0A0B0F] border border-[#1E1F2A] focus-within:border-[#00D664]/60 focus-within:ring-2 focus-within:ring-[#00D664]/15 transition">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#00D664] animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-[#9496A1] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by title (e.g. Dune, Interstellar, RRR, Oppenheimer)..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#9496A1] focus:outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="text-xs text-[#9496A1] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline text-[10px] text-[#9496A1] border border-[#1E1F2A] bg-[#181820] rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#00D664]/15 border border-[#00D664]/30 text-xs text-[#00D664] flex items-center gap-2 animate-fadeIn">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Content Body: Live Search Results or Vault Shortcuts */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-2">
          {searchValue.trim() ? (
            /* Search Results Mode */
            searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="px-2 text-[11px] font-semibold text-[#9496A1] uppercase tracking-wider">
                  Found {searchResults.length} films
                </p>
                {searchResults.map((movie) => {
                  const watchlistItem = watchlistMap[movie.tmdb_id];
                  const isSaved = Boolean(watchlistItem);
                  const isWatched = watchlistItem?.status === "watched";
                  const isFavorite = Boolean(watchlistItem?.is_favorite);

                  const posterUrl = getTmdbImageUrl(movie.poster_path, "w185");

                  return (
                    <div
                      key={movie.tmdb_id}
                      className="p-3 rounded-2xl border border-[#1E1F2A] bg-[#0A0B0F]/60 hover:bg-[#141520] hover:border-[#00D664]/40 transition flex items-center gap-3.5 group/item"
                    >
                      {/* Movie Poster */}
                      <Link
                        href={`/movie/${movie.tmdb_id || movie.id}`}
                        onClick={onClose}
                        className="w-12 h-18 sm:w-14 sm:h-20 rounded-xl overflow-hidden bg-[#181820] shrink-0 border border-white/10 relative block hover:border-[#00D664]/60 transition"
                      >
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={movie.title}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                            <Film className="w-5 h-5" />
                          </div>
                        )}
                      </Link>

                      {/* Movie Info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/movie/${movie.tmdb_id}`}
                          onClick={onClose}
                          className="font-heading text-sm font-bold text-white group-hover/item:text-[#00D664] transition-colors truncate block"
                        >
                          {movie.title}
                        </Link>

                        <div className="flex items-center gap-2 text-xs text-[#9496A1] mt-1">
                          {movie.vote_average !== undefined && movie.vote_average > 0 && (
                            <>
                              <span
                                title="TMDB Community Score"
                                className="inline-flex items-center gap-1 font-semibold text-white"
                              >
                                <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                                <span className="text-[10px] text-[#9496A1]">TMDB</span>
                                <span>{formatScore(movie.vote_average)}</span>
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatYear(movie.release_date)}</span>
                          {isWatched && (
                            <span className="px-1.5 py-0.2 rounded bg-[#00D664]/15 text-[#00D664] text-[10px] font-medium border border-[#00D664]/30">
                              Watched
                            </span>
                          )}
                        </div>

                        {movie.overview && (
                          <p className="text-xs text-[#9496A1] line-clamp-1 mt-1">
                            {movie.overview}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons (Reference 2 style) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Watchlist toggle */}
                        <button
                          type="button"
                          onClick={() => handleAddWatchlist(movie)}
                          title={isSaved ? "In Watchlist (click to remove)" : "Add to Watchlist"}
                          className={`h-8 sm:h-9 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                            isSaved
                              ? "bg-[#00D664] text-black shadow-md shadow-[#00D664]/20"
                              : "bg-[#1E1F2A] text-white hover:bg-[#00D664] hover:text-black border border-white/10"
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span className="hidden sm:inline">Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Watchlist</span>
                            </>
                          )}
                        </button>

                        {/* Watched toggle */}
                        <button
                          type="button"
                          onClick={() => handleMarkWatched(movie)}
                          title={isWatched ? "Marked as Watched" : "Mark as Watched"}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full grid place-items-center transition border ${
                            isWatched
                              ? "bg-[#00D664]/20 border-[#00D664] text-[#00D664]"
                              : "bg-[#1E1F2A] border-white/10 text-[#9496A1] hover:text-white hover:border-[#00D664]/50"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Favorite toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(movie)}
                          title={isFavorite ? "Favorited" : "Add to Favorites"}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full grid place-items-center transition border ${
                            isFavorite
                              ? "bg-[#FBBF24]/20 border-[#FBBF24] text-[#FBBF24]"
                              : "bg-[#1E1F2A] border-white/10 text-[#9496A1] hover:text-[#FBBF24] hover:border-[#FBBF24]/50"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !isSearching ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-white">No movies found for &quot;{searchValue}&quot;</p>
                <p className="text-xs text-[#9496A1]">
                  Try searching for another film title or explore curated discovery.
                </p>
              </div>
            ) : null
          ) : (
            /* Empty Search Initial Screen: Shortcuts & Quick Add Recommendations */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-gradient-to-br from-[#101118] to-[#0A0B0F] space-y-2">
                <p className="text-xs font-bold text-[#00D664] uppercase tracking-wider">
                  Quick Start Suggestions
                </p>
                <p className="text-xs text-[#9496A1]">
                  Type a title above to search all global cinema via TMDB, or try these quick options:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Dune: Part Two", "Oppenheimer", "Interstellar", "RRR", "Kalki 2898 AD", "Inception"].map((film) => (
                    <button
                      key={film}
                      type="button"
                      onClick={() => setSearchValue(film)}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:border-[#00D664]/50 hover:bg-[#00D664]/10 transition"
                    >
                      + {film}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Link to Discover */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs text-[#9496A1]">
                  Looking for deep discovery?
                </span>
                <Link
                  href="/discover"
                  onClick={onClose}
                  className="text-xs font-semibold text-[#00D664] hover:underline inline-flex items-center gap-1"
                >
                  <span>Go to Discover</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
