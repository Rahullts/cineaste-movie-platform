"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Film, Eye } from "lucide-react";
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
  /** Refined Dashboard mode: strict portrait posters, Letterboxd hover dock, clean editorial metadata */
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
 * Supports both default shared presentation (Discover Cinema / My Library)
 * and refined Dashboard mode (strict 2:3 portrait posters, unobscured artwork,
 * Letterboxd-inspired hover dock, IMDb/Letterboxd-accurate external scores,
 * and distinct personal Cineaste rating display).
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

  const resolvedPersonalRating = React.useMemo(() => {
    if (typeof personalRating === "number" && personalRating > 0) return personalRating;
    if (typeof userMovie?.rating === "number" && userMovie.rating > 0) return userMovie.rating;
    if (typeof movie.rating === "number" && movie.rating > 0) return movie.rating;
    return null;
  }, [personalRating, userMovie?.rating, movie.rating]);

  // Reset image fallback state when movie artwork path changes
  React.useEffect(() => {
    setFallbackIdx(0);
    setHasExhaustedFallbacks(false);
  }, [movie.poster_path, movie.backdrop_path, tmdbId]);

  // Portrait-only URLs in Dashboard mode (never crop landscape backdrop inside 2:3 poster slot)
  // Prefer w500 first for faster carousel decoding and lower bandwidth contention
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

  // External Rating Source Accuracy
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
        "group relative flex flex-col select-none cursor-pointer",
        showActions ? "transition-all duration-300" : "",
        variant === "carousel"
          ? editorialDashboard
            ? "w-[144px] sm:w-[164px] md:w-[176px] lg:w-[184px] xl:w-[196px] shrink-0"
            : "w-[155px] sm:w-[180px] md:w-[195px] shrink-0"
          : "w-full",
        className
      )}
    >
      {/* =================================================================== */}
      {/* 1. Poster Artwork Container (Strict 2:3 Portrait Aspect Ratio)       */}
      {/* =================================================================== */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#12131D] shadow-lg shadow-black/50 ring-1 ring-white/[0.06] transition-all duration-300",
          showActions &&
            "group-hover:shadow-2xl group-hover:shadow-black/85 group-hover:-translate-y-1 group-hover:ring-white/20"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title || "Movie poster"}
            fill
            sizes={
              variant === "carousel"
                ? "(max-width: 640px) 144px, (max-width: 1024px) 176px, 196px"
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
          /* Clean Poster-Formatted Fallback (never cropped landscape artwork) */
          <div className="w-full h-full flex flex-col items-center justify-between p-4 text-center bg-gradient-to-b from-[#181926] via-[#12131D] to-[#0A0B10]">
            <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#00D664]/70 mt-4">
              <Film className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="space-y-1 my-auto px-1">
              <p className="font-heading font-semibold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                {movie.title}
              </p>
              {releaseYear && releaseYear !== "--" && (
                <p className="text-[11px] tabular-nums text-[#9496A1]">{releaseYear}</p>
              )}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">
              Cineaste Vault
            </div>
          </div>
        )}

        {/* Subtle bottom edge contrast scrim on hover */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            editorialDashboard
              ? "bg-gradient-to-t from-black/75 via-transparent to-black/15 opacity-0 group-hover:opacity-100"
              : "bg-gradient-to-t from-black/70 via-transparent to-black/25 opacity-40 group-hover:opacity-50"
          )}
        />

        {/* ================================================================= */}
        {/* Upper-Left: Supported External Rating Badge & Watched Status      */}
        {/* ================================================================= */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          {strictRatingSource ? (
            imdbScore ? (
              <span
                data-testid="card-rating-badge"
                title="Verified IMDb Rating"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold tabular-nums bg-black/75 backdrop-blur-md text-[#FBBF24] shadow-md ring-1 ring-white/10"
              >
                <Star className="w-2.5 h-2.5 fill-[#FBBF24] stroke-none" />
                <span>IMDb {imdbScore}</span>
              </span>
            ) : letterboxdScore ? (
              <span
                data-testid="card-rating-badge"
                title="Verified Letterboxd Rating"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold tabular-nums bg-black/75 backdrop-blur-md text-white shadow-md ring-1 ring-white/10"
              >
                <span>LB {letterboxdScore}</span>
              </span>
            ) : null
          ) : (
            tmdbScore && (
              <span
                data-testid="card-rating-badge"
                title="TMDB Community Score"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold bg-black/75 backdrop-blur-md text-[#FBBF24] shadow-md ring-1 ring-white/10"
              >
                <Star className="w-2.5 h-2.5 fill-[#FBBF24] stroke-none" />
                <span className="text-[9px] text-white/75 uppercase">TMDB</span>
                <span>{tmdbScore}</span>
              </span>
            )
          )}

          {isWatchedMovie && (
            <span
              data-testid="card-watched-badge"
              title="Watched"
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md shadow-md",
                editorialDashboard
                  ? "bg-black/70 text-[#00D664] ring-1 ring-[#00D664]/45"
                  : "bg-[#00D878]/20 text-[#00D878] font-mono font-bold ring-1 ring-[#00D878]/40"
              )}
            >
              <CinematicWatchedCheckIcon size={10} className="stroke-[2.8]" />
              <span className="hidden sm:inline text-[9px] uppercase tracking-wider">Watched</span>
            </span>
          )}
        </div>

        {/* ================================================================= */}
        {/* Actions Layout: Letterboxd Dock (Dashboard) vs Classic Corner     */}
        {/* ================================================================= */}
        {editorialDashboard ? (
          <>
            {/* Resting Watchlist Distinguishability Indicator (unobstructive top-right dot/badge) */}
            {activeWatchlist && (
              <button
                type="button"
                data-testid="card-watchlist-indicator"
                onClick={handleWatchlistClick}
                aria-label="In Watchlist — click to remove"
                title="In Watchlist"
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-[#00D664] text-black grid place-items-center shadow-lg shadow-black/50 ring-1 ring-black/10 transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <CinematicBookmarkIcon size={13} filled={true} className="text-black" />
              </button>
            )}

            {/* Desktop Letterboxd-Inspired Bottom Hover Action Dock */}
            {showActions && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="hidden md:flex items-center gap-1.5 absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-2 py-1.5 rounded-full bg-[#0A0B0F]/85 backdrop-blur-xl border border-white/15 shadow-2xl opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200"
              >
                {enableWatchedAction && (
                  <button
                    type="button"
                    data-testid="card-watched-btn"
                    onClick={handleWatchedClick}
                    aria-label={isWatchedMovie ? "Edit watched rating" : "Mark as Watched"}
                    title={isWatchedMovie ? "Watched • Rate / Edit" : "Mark as Watched"}
                    className={cn(
                      "w-7 h-7 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer",
                      isWatchedMovie
                        ? "bg-[#00D664] text-black"
                        : "text-white/85 hover:text-[#00D664] hover:bg-white/10"
                    )}
                  >
                    <Eye className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                )}

                <button
                  type="button"
                  data-testid="card-watchlist-btn"
                  onClick={handleWatchlistClick}
                  aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                  title={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                  className={cn(
                    "w-7 h-7 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer",
                    activeWatchlist
                      ? "bg-[#00D664] text-black"
                      : "text-white/85 hover:text-[#00D664] hover:bg-white/10"
                  )}
                >
                  <CinematicBookmarkIcon size={14} filled={activeWatchlist} />
                </button>

                <button
                  type="button"
                  data-testid="card-favorite-btn"
                  onClick={handleFavoriteClick}
                  aria-label={activeFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  title={activeFavorite ? "Favorited" : "Add to Favorites"}
                  className={cn(
                    "w-7 h-7 rounded-full grid place-items-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer",
                    activeFavorite
                      ? "bg-rose-500 text-white"
                      : "text-white/85 hover:text-rose-400 hover:bg-white/10"
                  )}
                >
                  <CinematicHeartIcon size={14} filled={activeFavorite} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Discover & My Library Controls: Positioned at bottom dock on hover so they never overlap upper-left Watched / Rating badges */
          <>
            {/* Subtle resting Watchlist dot top-right when saved (unobstructive, never collides with top-left badges) */}
            {activeWatchlist && (
              <span
                aria-hidden="true"
                className="absolute top-2.5 right-2.5 z-10 w-2.5 h-2.5 rounded-full bg-[#00D878] ring-2 ring-black/60 shadow md:group-hover:opacity-0 transition-opacity pointer-events-none"
              />
            )}

            {hasHoverMetadata && (
              <div className="hidden md:flex absolute inset-x-0 bottom-0 pt-7 pb-2.5 px-2.5 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none items-center justify-between text-[10px] font-mono font-medium text-white/90 pr-20">
                {genreDisplay && <span className="truncate">{genreDisplay}</span>}
                {!genreDisplay && runtimeDisplay && <span className="text-white/70">{runtimeDisplay}</span>}
              </div>
            )}

            {showActions && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="hidden md:flex absolute bottom-2 right-2 z-20 items-center gap-1.5 px-1.5 py-1 rounded-full bg-[#0A0B0F]/85 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200"
              >
                <button
                  type="button"
                  data-testid="card-watchlist-btn"
                  onClick={handleWatchlistClick}
                  aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                  title={activeWatchlist ? "In Watchlist" : "Add to Watchlist"}
                  className={cn(
                    "w-7 h-7 rounded-full grid place-items-center shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer",
                    activeWatchlist
                      ? "bg-[#00D878] text-black shadow-[#00D878]/30 ring-1 ring-[#00D878]"
                      : "bg-black/60 hover:bg-black/85 text-white/85 hover:text-[#00D878]"
                  )}
                >
                  <CinematicBookmarkIcon
                    size={13}
                    filled={activeWatchlist}
                    className={cn("transition-colors", activeWatchlist && "text-black")}
                  />
                </button>

                <button
                  type="button"
                  data-testid="card-favorite-btn"
                  onClick={handleFavoriteClick}
                  aria-label={activeFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  title={activeFavorite ? "Favorited" : "Add to Favorites"}
                  className={cn(
                    "w-7 h-7 rounded-full grid place-items-center shadow-md transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer",
                    activeFavorite
                      ? "bg-rose-500 text-white shadow-rose-500/30 ring-1 ring-rose-500"
                      : "bg-black/60 hover:bg-black/85 text-white/85 hover:text-rose-400"
                  )}
                >
                  <CinematicHeartIcon
                    size={13}
                    filled={activeFavorite}
                    className={cn("transition-colors", activeFavorite && "text-white")}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. Movie Information Outside Artwork (Refined Typography)          */}
      {/* =================================================================== */}
      <div className="mt-2.5 px-0.5 space-y-0.5 cursor-pointer">
        <h3
          className={cn(
            "font-heading text-foreground transition-colors line-clamp-1",
            editorialDashboard
              ? "font-medium text-[13px] sm:text-sm tracking-[-0.01em] leading-snug group-hover:text-[#00D664]"
              : "font-semibold text-xs sm:text-sm group-hover:text-[#00D878]"
          )}
        >
          {movie.title}
        </h3>

        <div
          className={cn(
            "flex items-center justify-between gap-2 text-muted-foreground",
            editorialDashboard
              ? "text-[11px] sm:text-xs font-sans tabular-nums"
              : "text-[11px] font-mono"
          )}
        >
          <span className="shrink-0">{releaseYear || "—"}</span>

          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {/* Personal Cineaste Rating (Clearly separated from external ratings) */}
            {resolvedPersonalRating !== null && (
              <span
                title="Your Personal Cineaste Rating"
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#00D664] shrink-0"
              >
                <Star className="w-2.5 h-2.5 fill-[#00D664] stroke-none" />
                <span>{resolvedPersonalRating.toFixed(1)}</span>
              </span>
            )}

            {watchedDate ? (
              <span className="text-[11px] text-muted-foreground truncate">
                {watchedDate}
              </span>
            ) : subLabel ? (
              <span className="text-[11px] text-muted-foreground truncate">{subLabel}</span>
            ) : null}
          </div>
        </div>

        {/* Accessible Touch Action Strip on Mobile (unobstructed poster artwork) */}
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
                aria-label={isWatchedMovie ? "Edit watched rating" : "Mark as Watched"}
                className={cn(
                  "flex-1 h-7 rounded-lg grid place-items-center transition active:scale-95 border",
                  isWatchedMovie
                    ? "bg-[#00D664]/15 border-[#00D664]/40 text-[#00D664]"
                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="w-3.5 h-3.5 stroke-[1.8]" />
              </button>
            )}

            <button
              type="button"
              data-testid="card-mobile-watchlist-btn"
              onClick={handleWatchlistClick}
              aria-label={activeWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              className={cn(
                "flex-1 h-7 rounded-lg grid place-items-center transition active:scale-95 border",
                activeWatchlist
                  ? "bg-[#00D664]/15 border-[#00D664]/40 text-[#00D664]"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
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
                "flex-1 h-7 rounded-lg grid place-items-center transition active:scale-95 border",
                activeFavorite
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
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
