"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Film, Eye, Plus, Check } from "lucide-react";
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
  /** Refined Dashboard mode: strict portrait posters, borderless dark action circles, clean editorial metadata */
  editorialDashboard?: boolean;
  /** Strict rating source policy: show IMDb / Letterboxd only when genuinely provided (never TMDB vote_average) */
  strictRatingSource?: boolean;
  /** Show Watched / Rate trigger inside poster quick actions */
  enableWatchedAction?: boolean;
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
 * Clean, borderless 2:3 film poster presentation with separated dark floating
 * action circles, sharp readable release years, and accurate rating labels.
 */
export function MoviePosterCard({
  movie,
  variant = "grid",
  index = 0,
  subLabel,
  watchedDate,
  personalRating,
  isWatchlist,
  isFavorite,
  isWatched,
  showActions = true,
  editorialDashboard = false,
  strictRatingSource = false,
  enableWatchedAction = false,
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

  const resolvedPersonalRating = React.useMemo(() => {
    if (typeof personalRating === "number" && personalRating > 0) return personalRating;
    if (typeof userMovie?.rating === "number" && userMovie.rating > 0) return userMovie.rating;
    if (typeof movie.rating === "number" && movie.rating > 0) return movie.rating;
    return null;
  }, [personalRating, userMovie?.rating, movie.rating]);

  React.useEffect(() => {
    setFallbackIdx(0);
    setHasExhaustedFallbacks(false);
  }, [movie.poster_path, movie.backdrop_path, tmdbId]);

  const candidateUrls = React.useMemo(() => {
    const urls: string[] = [];
    if (movie.poster_path) {
      const cleanP = movie.poster_path.startsWith("/") ? movie.poster_path : `/${movie.poster_path}`;
      urls.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=500`);
      urls.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=780`);
      urls.push(`https://image.tmdb.org/t/p/w500${cleanP}`);
      urls.push(
        `https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/w500${cleanP}`)}&output=webp&q=85`
      );
    }
    if (!editorialDashboard && movie.backdrop_path) {
      const cleanB = movie.backdrop_path.startsWith("/")
        ? movie.backdrop_path
        : `/${movie.backdrop_path}`;
      urls.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=780`);
      urls.push(`https://image.tmdb.org/t/p/w780${cleanB}`);
    }
    return urls;
  }, [movie.poster_path, movie.backdrop_path, editorialDashboard]);

  const posterUrl = !hasExhaustedFallbacks ? candidateUrls[fallbackIdx] || null : null;

  const handleImageError = () => {
    if (fallbackIdx < candidateUrls.length - 1) {
      setFallbackIdx((prev) => prev + 1);
    } else {
      setHasExhaustedFallbacks(true);
    }
  };

  const rawImdb = (movie as any)?.imdb_rating;
  const rawLetterboxd = (movie as any)?.letterboxd_rating;
  const imdbScore = typeof rawImdb === "number" && rawImdb > 0 ? formatScore(rawImdb) : null;
  const letterboxdScore =
    typeof rawLetterboxd === "number" && rawLetterboxd > 0 ? formatScore(rawLetterboxd) : null;
  const tmdbScore =
    !strictRatingSource && movie.vote_average ? formatScore(movie.vote_average) : null;

  const releaseYear = formatYear(movie.release_date);

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

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(movie);
    } else {
      router.push(`/movie/${tmdbId}`);
    }
  };

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

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatched) {
      onToggleWatched(userMovie || movie);
    } else if (isWatchedMovie) {
      library.updateStatus(tmdbId, "want");
    } else {
      library.markWatched(userMovie || movie);
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
      data-movie-id={tmdbId}
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col select-none cursor-pointer outline-none focus:outline-none focus-visible:outline-none",
        showActions ? "transition-all duration-300" : "",
        variant === "carousel"
          ? editorialDashboard
            ? "w-[146px] sm:w-[166px] md:w-[178px] lg:w-[186px] xl:w-[198px] shrink-0"
            : "w-[155px] sm:w-[180px] md:w-[195px] shrink-0"
          : "w-full",
        className
      )}
    >
      {/* 1. Borderless 2:3 Poster Frame (zero ring/outline border) */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#12131D] shadow-lg shadow-black/50 transition-all duration-300",
          showActions && "group-hover:shadow-2xl group-hover:shadow-black/85 group-hover:-translate-y-1"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title || "Movie poster"}
            fill
            sizes={
              variant === "carousel"
                ? "(max-width: 640px) 146px, (max-width: 1024px) 178px, 198px"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            }
            className={cn(
              "object-cover object-center transition-transform duration-500 ease-out",
              showActions && "group-hover:scale-[1.03]"
            )}
            onError={handleImageError}
            priority={index < 4}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between p-4 text-center bg-gradient-to-b from-[#181926] via-[#12131D] to-[#0A0B10]">
            <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#00D664]/70 mt-4">
              <Film className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="space-y-1 my-auto px-1">
              <p className="font-heading font-semibold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                {movie.title}
              </p>
              {releaseYear && releaseYear !== "--" && (
                <p className="text-xs font-medium tabular-nums text-[#D0D4E0]">{releaseYear}</p>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
              Cineaste
            </div>
          </div>
        )}

        {/* Subtle bottom edge contrast scrim on hover */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            editorialDashboard
              ? "bg-gradient-to-t from-black/65 via-transparent to-black/15 opacity-0 group-hover:opacity-100"
              : "bg-gradient-to-t from-black/65 via-transparent to-black/20 opacity-30 group-hover:opacity-50"
          )}
        />

        {/* Upper-Left: Supported External Rating Badge & Watched Indicator */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          {strictRatingSource ? (
            imdbScore ? (
              <span
                data-testid="card-rating-badge"
                title="Verified IMDb Rating"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums bg-black/75 backdrop-blur-md text-[#FBBF24] shadow-md"
              >
                <Star className="w-2.5 h-2.5 fill-[#FBBF24] stroke-none" />
                <span>IMDb {imdbScore}</span>
              </span>
            ) : letterboxdScore ? (
              <span
                data-testid="card-rating-badge"
                title="Verified Letterboxd Rating"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums bg-black/75 backdrop-blur-md text-white shadow-md"
              >
                <span>LB {letterboxdScore}</span>
              </span>
            ) : null
          ) : (
            tmdbScore && (
              <span
                data-testid="card-rating-badge"
                title="TMDB Community Score"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums bg-black/75 backdrop-blur-md text-[#FBBF24] shadow-md"
              >
                <Star className="w-2.5 h-2.5 fill-[#FBBF24] stroke-none" />
                <span className="text-[10px] text-white/80 uppercase font-medium">TMDB</span>
                <span>{tmdbScore}</span>
              </span>
            )
          )}

          {isWatchedMovie && (
            <span
              data-testid="card-watched-badge"
              title="Watched"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md bg-black/75 text-[#00D878] shadow-md"
            >
              <CinematicWatchedCheckIcon size={10} className="stroke-[2.6]" />
              <span className="hidden sm:inline text-[10px] tracking-wide">Watched</span>
            </span>
          )}
        </div>

        {/* Separated Dark Borderless Floating Action Circles (matching Image 4) */}
        {showActions && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={cn(
              "hidden md:flex items-center gap-1.5 absolute top-2.5 right-2.5 z-20 transition-all duration-200",
              activeWatchlist || activeFavorite || (enableWatchedAction && isWatchedMovie)
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            )}
          >
            {enableWatchedAction && (
              <button
                type="button"
                data-testid="card-watched-btn"
                onClick={handleWatchedClick}
                aria-label={isWatchedMovie ? "Mark as Unwatched" : "Mark as Watched"}
                title={isWatchedMovie ? "Watched • Click to Unwatch" : "Mark as Watched"}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer shadow-lg backdrop-blur-md",
                  isWatchedMovie
                    ? "bg-[#00D664] text-black"
                    : "bg-black/75 hover:bg-black/95 text-white"
                )}
              >
                <Eye className="w-4 h-4 stroke-[2]" />
              </button>
            )}

            <button
              type="button"
              data-testid="card-watchlist-btn"
              onClick={handleWatchlistClick}
              aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              title={activeWatchlist ? "In Watchlist • Click to Remove" : "Add to Watchlist"}
              className={cn(
                "w-8 h-8 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer shadow-lg backdrop-blur-md",
                activeWatchlist
                  ? "bg-[#00D878] text-black"
                  : "bg-black/75 hover:bg-black/95 text-white"
              )}
            >
              {activeWatchlist ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.2]" />
              )}
            </button>

            <button
              type="button"
              data-testid="card-favorite-btn"
              onClick={handleFavoriteClick}
              aria-label={activeFavorite ? "Remove from Favorites" : "Add to Favorites"}
              title={activeFavorite ? "Favorited • Click to Remove" : "Add to Favorites"}
              className={cn(
                "w-8 h-8 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer shadow-lg backdrop-blur-md",
                activeFavorite
                  ? "bg-rose-500 text-white"
                  : "bg-black/75 hover:bg-black/95 text-white"
              )}
            >
              <CinematicHeartIcon size={14} filled={activeFavorite} />
            </button>
          </div>
        )}

        {!editorialDashboard && hasHoverMetadata && (
          <div className="hidden md:flex absolute inset-x-0 bottom-0 pt-7 pb-2.5 px-2.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none items-center justify-between text-xs font-medium text-white/90">
            {genreDisplay && <span className="truncate">{genreDisplay}</span>}
            {!genreDisplay && runtimeDisplay && <span className="text-white/80">{runtimeDisplay}</span>}
          </div>
        )}
      </div>

      {/* 2. Movie Information Outside Artwork (Crisp contrast & readable years) */}
      <div className="mt-2.5 px-0.5 space-y-1 cursor-pointer">
        <h3 className="font-heading text-foreground font-semibold text-sm tracking-[-0.01em] leading-snug transition-colors line-clamp-1 group-hover:text-[#00D664]">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-sans font-medium tabular-nums text-foreground/75">
          <span className="shrink-0">{releaseYear || "—"}</span>

          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {resolvedPersonalRating !== null && (
              <span
                title="Your Personal Cineaste Rating"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#00D664] shrink-0"
              >
                <Star className="w-3 h-3 fill-[#00D664] stroke-none" />
                <span>{resolvedPersonalRating.toFixed(1)}</span>
              </span>
            )}

            {watchedDate ? (
              <span className="text-xs text-muted-foreground truncate">
                {watchedDate}
              </span>
            ) : subLabel ? (
              <span className="text-xs text-muted-foreground truncate">{subLabel}</span>
            ) : null}
          </div>
        </div>

        {/* Borderless Mobile Touch Action Strip */}
        {showActions && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex md:hidden items-center justify-between gap-1.5 pt-1.5"
          >
            {enableWatchedAction && (
              <button
                type="button"
                data-testid="card-mobile-watched-btn"
                onClick={handleWatchedClick}
                aria-label={isWatchedMovie ? "Mark as Unwatched" : "Mark as Watched"}
                className={cn(
                  "flex-1 h-8 rounded-lg grid place-items-center transition active:scale-95",
                  isWatchedMovie
                    ? "bg-[#00D664]/20 text-[#00D664]"
                    : "bg-secondary/90 text-foreground/75 hover:text-foreground"
                )}
              >
                <Eye className="w-3.5 h-3.5 stroke-[1.9]" />
              </button>
            )}

            <button
              type="button"
              data-testid="card-mobile-watchlist-btn"
              onClick={handleWatchlistClick}
              aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              className={cn(
                "flex-1 h-8 rounded-lg grid place-items-center transition active:scale-95",
                activeWatchlist
                  ? "bg-[#00D664]/20 text-[#00D664]"
                  : "bg-secondary/90 text-foreground/75 hover:text-foreground"
              )}
            >
              <CinematicBookmarkIcon size={13} filled={activeWatchlist} />
            </button>

            <button
              type="button"
              data-testid="card-mobile-favorite-btn"
              onClick={handleFavoriteClick}
              aria-label={activeFavorite ? "Remove from Favorites" : "Add to Favorites"}
              className={cn(
                "flex-1 h-8 rounded-lg grid place-items-center transition active:scale-95",
                activeFavorite
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-secondary/90 text-foreground/75 hover:text-foreground"
              )}
            >
              <CinematicHeartIcon size={13} filled={activeFavorite} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
