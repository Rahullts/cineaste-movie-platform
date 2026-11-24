"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Film } from "lucide-react";
import {
  CinematicBookmarkIcon,
  CinematicHeartIcon,
  CinematicWatchedCheckIcon,
} from "@/components/icons/cinematic-icons";
import { useLibrary } from "@/lib/library-store";
import { formatScore, formatYear, cn } from "@/lib/utils";
import type { Movie } from "@/types";

export interface MoviePosterCardProps {
  movie: Movie;
  variant?: "carousel" | "grid";
  index?: number;
  subLabel?: string;
  watchedDate?: string;
  personalRating?: number;
  recommendationReason?: string;
  isWatchlist?: boolean;
  isFavorite?: boolean;
  isWatched?: boolean;
  showActions?: boolean;
  onOpenDetail?: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onRemove?: (id: number) => void;
  className?: string;
}

/**
 * Cineaste Editorial Movie Poster Card
 * 
 * Features:
 * - Strict 2:3 portrait ratio with non-distorting artwork fit
 * - Multi-tier resilient URL fallback
 * - Small rating badge in the upper-left
 * - Subtle green watched-status indicator (#00D878)
 * - Two compact action icons in upper-right: Watchlist (bookmark) & Favorite (heart)
 * - Hover metadata reveal: shows genre and runtime only when real data exists
 * - Movie title & release year placed cleanly underneath
 * - Full separation between poster navigation and action-button clicks
 * - Seamless integration with global reactive library state
 */
export function MoviePosterCard({
  movie,
  variant = "grid",
  index = 0,
  subLabel,
  watchedDate,
  personalRating,
  recommendationReason,
  isWatchlist,
  isFavorite,
  isWatched,
  showActions = true,
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
  className,
}: MoviePosterCardProps) {
  const router = useRouter();
  const library = useLibrary();
  const [fallbackIdx, setFallbackIdx] = React.useState(0);
  const [hasExhaustedFallbacks, setHasExhaustedFallbacks] = React.useState(false);

  // Sync with global user library state
  const tmdbId = movie.tmdb_id || movie.id;
  const userMovie = React.useMemo(() => {
    if (!library.movies || !tmdbId) return null;
    return library.movies.find((m) => (m.tmdb_id || m.id) === tmdbId) || null;
  }, [library.movies, tmdbId]);

  const activeWatchlist =
    isWatchlist ??
    Boolean(
      (userMovie && (userMovie.status === "want" || userMovie.status === "watching")) ||
      movie.status === "want" ||
      movie.status === "watching"
    );

  const activeFavorite =
    isFavorite ??
    Boolean(userMovie ? userMovie.is_favorite : movie.is_favorite);

  const isWatchedMovie =
    isWatched ??
    Boolean((userMovie && userMovie.status === "watched") || movie.status === "watched");

  // Multi-tier URL cascade to guarantee image display across restricted networks
  const candidateUrls = React.useMemo(() => {
    const urls: string[] = [];
    if (movie.poster_path) {
      const cleanP = movie.poster_path.startsWith("/") ? movie.poster_path : `/${movie.poster_path}`;
      // Request w780 for razor-sharp Retina/high-DPI display, with w500 and TMDB direct fallbacks
      urls.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=780`);
      urls.push(`https://image.tmdb.org/t/p/w780${cleanP}`);
      urls.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=500`);
      urls.push(`https://image.tmdb.org/t/p/w500${cleanP}`);
      urls.push(`https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/w780${cleanP}`)}&output=webp&q=90`);
    }
    if (movie.backdrop_path) {
      const cleanB = movie.backdrop_path.startsWith("/") ? movie.backdrop_path : `/${movie.backdrop_path}`;
      // TMDB backdrops support w780, w1280, and original
      urls.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=780`);
      urls.push(`https://image.tmdb.org/t/p/w780${cleanB}`);
      urls.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=1280`);
      urls.push(`https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/w780${cleanB}`)}&output=webp&q=90`);
    }
    return urls;
  }, [movie.poster_path, movie.backdrop_path]);

  const posterUrl = !hasExhaustedFallbacks ? candidateUrls[fallbackIdx] || null : null;

  const handleImageError = () => {
    if (fallbackIdx < candidateUrls.length - 1) {
      setFallbackIdx((prev) => prev + 1);
    } else {
      setHasExhaustedFallbacks(true);
    }
  };

  const tmdbScore = movie.vote_average ? formatScore(movie.vote_average) : null;
  const releaseYear = formatYear(movie.release_date);

  // Extract genre and runtime for hover metadata reveal
  const genreDisplay = React.useMemo(() => {
    if (Array.isArray(movie.genres) && movie.genres.length > 0) {
      const first = movie.genres[0];
      return typeof first === "string" ? first : first.name;
    }
    return null;
  }, [movie.genres]);

  const runtimeDisplay = React.useMemo(() => {
    if (!movie.runtime || movie.runtime <= 0) return null;
    const hrs = Math.floor(movie.runtime / 60);
    const mins = movie.runtime % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, [movie.runtime]);

  const hasHoverMetadata = Boolean(genreDisplay || runtimeDisplay);

  // Card click: opens Movie Details
  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(movie);
    } else {
      router.push(`/movie/${movie.tmdb_id || movie.id}`);
    }
  };

  // Action clicks: prevent bubbling and invoke callbacks or library mutations
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(movie);
    } else if (activeWatchlist) {
      library.removeFromWatchlist(tmdbId);
    } else {
      library.addToWatchlist(movie);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(movie);
    } else {
      library.toggleFavorite(userMovie || movie);
    }
  };

  return (
    <article
      data-testid="movie-card"
      data-movie-id={movie.tmdb_id || movie.id}
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col select-none cursor-pointer",
        showActions ? "transition-all duration-300" : "",
        variant === "carousel"
          ? "w-[155px] sm:w-[180px] md:w-[195px] shrink-0"
          : "w-full",
        className
      )}
    >
      {/* =================================================================== */}
      {/* 1. Poster Artwork Container (Strict 2:3 Aspect Ratio)              */}
      {/* =================================================================== */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#12131D] shadow-lg shadow-black/50 transition-all duration-300",
          showActions && "group-hover:shadow-2xl group-hover:shadow-black/90 group-hover:-translate-y-1"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title || "Movie poster"}
            fill
            sizes={
              variant === "carousel"
                ? "(max-width: 640px) 155px, 195px"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            }
            className={cn(
              "object-cover object-center transition-transform duration-500 ease-out",
              showActions && "group-hover:scale-[1.03]"
            )}
            onError={handleImageError}
            priority={index < 4}
          />
        ) : (
          /* Movie-Specific Elegant Fallback (Never unrelated placeholder) */
          <div className="w-full h-full flex flex-col items-center justify-between p-4 text-center bg-gradient-to-b from-[#181926] via-[#12131D] to-[#0A0B10]">
            <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#00D878]/70 mt-4">
              <Film className="w-4 h-4" />
            </div>
            <div className="space-y-1 my-auto px-1">
              <p className="font-heading font-bold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                {movie.title}
              </p>
              {releaseYear && (
                <p className="text-[11px] font-mono text-[#9496A1]">
                  {releaseYear}
                </p>
              )}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">
              Cineaste Vault
            </div>
          </div>
        )}

        {/* Subtle Ambient Contrast Gradients (Keeps artwork vivid) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none opacity-40 group-hover:opacity-50 transition-opacity" />

        {/* ================================================================= */}
        {/* Upper-Left: Rating & Watched Indicators                           */}
        {/* ================================================================= */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          {tmdbScore && (
            <span
              data-testid="card-rating-badge"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold bg-black/75 backdrop-blur-md text-[#FBBF24] shadow-md ring-1 ring-white/10"
            >
              <Star className="w-2.5 h-2.5 fill-[#FBBF24] stroke-none" />
              <span>{tmdbScore}</span>
            </span>
          )}

          {isWatchedMovie && (
            <span
              data-testid="card-watched-badge"
              title="Watched"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#00D878]/20 text-[#00D878] backdrop-blur-md ring-1 ring-[#00D878]/40 shadow-md"
            >
              <CinematicWatchedCheckIcon size={10} className="stroke-[3]" />
              <span className="hidden sm:inline text-[9px] uppercase tracking-wider">Watched</span>
            </span>
          )}
        </div>

        {/* ================================================================= */}
        {/* Upper-Right: Exactly TWO Compact Action Icons (Watchlist, Favorite)*/}
        {/* ================================================================= */}
        {showActions && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={cn(
              "absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20 transition-all duration-200",
              activeWatchlist || activeFavorite
                ? "opacity-100"
                : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
            )}
          >
            {/* 1. Watchlist (Custom Bookmark) */}
            <button
              type="button"
              data-testid="card-watchlist-btn"
              onClick={handleWatchlistClick}
              aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              title={activeWatchlist ? "In Watchlist" : "Add to Watchlist"}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer",
                activeWatchlist
                  ? "bg-[#00D878] text-black shadow-[#00D878]/30 ring-1 ring-[#00D878]"
                  : "bg-black/60 hover:bg-black/85 text-white/80 hover:text-[#00D878] ring-1 ring-white/10 hover:ring-white/20"
              )}
            >
              <CinematicBookmarkIcon
                size={14}
                filled={activeWatchlist}
                className={cn("transition-colors", activeWatchlist && "text-black")}
              />
            </button>

            {/* 2. Favorite (Custom Heart) */}
            <button
              type="button"
              data-testid="card-favorite-btn"
              onClick={handleFavoriteClick}
              aria-label={activeFavorite ? "Remove from Favorites" : "Add to Favorites"}
              title={activeFavorite ? "Favorited" : "Add to Favorites"}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer",
                activeFavorite
                  ? "bg-rose-500 text-white shadow-rose-500/30 ring-1 ring-rose-500"
                  : "bg-black/60 hover:bg-black/85 text-white/80 hover:text-rose-400 ring-1 ring-white/10 hover:ring-white/20"
              )}
            >
              <CinematicHeartIcon
                size={14}
                filled={activeFavorite}
                className={cn("transition-colors", activeFavorite && "text-white")}
              />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* Hover Metadata Reveal: Genre & Runtime (Only when data exists)    */}
        {/* Keeps artwork completely visible while revealing key specifications */}
        {/* ================================================================= */}
        {hasHoverMetadata && (
          <div className="absolute inset-x-0 bottom-0 pt-6 pb-2 px-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-between text-[10px] font-mono font-medium text-white/90">
            {genreDisplay && <span className="truncate max-w-[65%]">{genreDisplay}</span>}
            {runtimeDisplay && <span className="shrink-0 text-white/70">{runtimeDisplay}</span>}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. Movie Information (Cleanly positioned outside the poster)       */}
      {/* =================================================================== */}
      <div className="mt-2.5 px-0.5 space-y-0.5 cursor-pointer">
        <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground group-hover:text-[#00D878] transition-colors line-clamp-1">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>{releaseYear || "—"}</span>

          {watchedDate ? (
            <span className="text-[10px] text-[#00D878] truncate max-w-[100px]">
              {watchedDate}
            </span>
          ) : subLabel ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              {subLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}