"use client";

import * as React from "react";
import {
  Bookmark,
  Check,
  Info,
  Star,
  Clock,
  Eye,
  Heart,
  ChevronDown,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { formatYear, formatScore, cn } from "@/lib/utils";
import type { Movie } from "@/types";

export interface CinemaSpotlightHeroProps {
  movie: Movie | null;
  mode?: "spotlight" | "watchlist" | "watched";
  isWatchlist?: boolean;
  isWatched?: boolean;
  isFavorite?: boolean;
  userRating?: number | null;
  onOpenDetail: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onMarkWatchedRequest?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onDiscoverMore?: () => void;
}

function buildImageCandidates(path?: string | null, widths: string[] = ["w780", "w500"]) {
  if (!path) return [];
  const clean = path.startsWith("/") ? path : `/${path}`;
  const urls: string[] = [];
  for (const w of widths) {
    const numeric = w.startsWith("w") ? w.slice(1) : w;
    urls.push(`/api/image?path=${encodeURIComponent(clean)}&w=${numeric}`);
    urls.push(`https://image.tmdb.org/t/p/${w}${clean}`);
  }
  return urls;
}

export function CinemaSpotlightHero({
  movie,
  mode = "spotlight",
  isWatchlist = false,
  isWatched = false,
  isFavorite = false,
  userRating,
  onOpenDetail,
  onToggleWatchlist,
  onMarkWatchedRequest,
  onToggleFavorite,
  onDiscoverMore,
}: CinemaSpotlightHeroProps) {
  const [details, setDetails] = React.useState<any>(null);
  const [backdropFallbackIdx, setBackdropFallbackIdx] = React.useState(0);
  const [posterFallbackIdx, setPosterFallbackIdx] = React.useState(0);
  const [posterExhausted, setPosterExhausted] = React.useState(false);

  const movieTmdbId = movie?.tmdb_id || movie?.id;

  // Fetch enriched details from TMDB (tagline, runtime, high-res artwork, genres)
  React.useEffect(() => {
    let cancelled = false;
    setBackdropFallbackIdx(0);
    setPosterFallbackIdx(0);
    setPosterExhausted(false);
    setDetails(null);

    if (movieTmdbId) {
      tmdbFetch({ action: "details", id: movieTmdbId })
        .then((res: any) => {
          if (!cancelled && res && (res.backdrop_path || res.poster_path || res.title)) {
            setDetails(res);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [movieTmdbId]);

  // Same featured film's backdrop & vertical portrait poster (never cross-fallback)
  const rawBackdrop = details?.backdrop_path || movie?.backdrop_path;
  const rawPoster = details?.poster_path || movie?.poster_path;

  const candidateBackdrops = React.useMemo(
    () => buildImageCandidates(rawBackdrop, ["original", "w1280"]),
    [rawBackdrop]
  );
  const candidatePosters = React.useMemo(
    () => buildImageCandidates(rawPoster, ["w780", "w500"]),
    [rawPoster]
  );

  const activeBackdropUrl = candidateBackdrops[backdropFallbackIdx] || candidateBackdrops[0] || null;
  const activePosterUrl = !posterExhausted
    ? candidatePosters[posterFallbackIdx] || candidatePosters[0] || null
    : null;

  const genresList: string[] = React.useMemo(() => {
    const source =
      Array.isArray(details?.genres) && details.genres.length > 0
        ? details.genres
        : Array.isArray(movie?.genres)
        ? movie.genres
        : [];
    return source
      .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
      .filter(Boolean);
  }, [details, movie]);

  if (!movie) {
    return (
      <section
        id="section-cinema-spotlight"
        aria-label="Cinema Spotlight Loading"
        className="relative w-full min-h-[430px] sm:min-h-[470px] lg:min-h-[490px] lg:max-h-[550px] flex flex-col justify-end overflow-hidden select-none bg-[#0A0B0F]"
      >
        <div className="relative z-20 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 sm:pt-24 pb-6 sm:pb-8 lg:pb-9 flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-12 animate-pulse">
          <div className="flex-1 max-w-2xl space-y-3.5">
            <div className="h-6 w-36 rounded-full bg-white/10" />
            <div className="h-12 w-3/4 rounded-xl bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-14 w-full rounded-xl bg-white/5" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 w-44 rounded-full bg-[#00D664]/20" />
              <div className="h-11 w-36 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="hidden lg:block w-[180px] xl:w-[210px] aspect-[2/3] rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </section>
    );
  }

  const activeMovie = movie;
  const title = details?.title || activeMovie.title;
  const tagline = details?.tagline || (activeMovie as any)?.tagline || null;
  const releaseYear = formatYear(details?.release_date || activeMovie.release_date);
  const runtimeMin = details?.runtime || activeMovie.runtime || null;
  const runtimeDisplay = runtimeMin
    ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60 > 0 ? `${runtimeMin % 60}m` : ""}`.trim()
    : null;

  // Rating Source Accuracy: display IMDb or Letterboxd only when genuinely provided.
  // Never display TMDB vote_average as IMDb or fabricate external scores.
  const rawImdb = details?.imdb_rating ?? (activeMovie as any)?.imdb_rating;
  const imdbRating = typeof rawImdb === "number" && rawImdb > 0 ? formatScore(rawImdb) : null;

  const rawLetterboxd = details?.letterboxd_rating ?? (activeMovie as any)?.letterboxd_rating;
  const letterboxdRating =
    typeof rawLetterboxd === "number" && rawLetterboxd > 0 ? formatScore(rawLetterboxd) : null;

  const resolvedUserRating =
    typeof userRating === "number" && userRating > 0
      ? userRating
      : typeof activeMovie.rating === "number" && activeMovie.rating > 0
      ? activeMovie.rating
      : null;

  const overview = details?.overview || activeMovie.overview || "";

  const handleScrollDown = () => {
    if (onDiscoverMore) {
      onDiscoverMore();
    } else {
      const el = document.getElementById("section-next-great-watch");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const spotlightLabel =
    mode === "watchlist"
      ? "YOUR NEXT SCREENING"
      : mode === "watched"
      ? "RECENTLY SCREENED"
      : "CINEASTE PRESENTS";

  return (
    <section
      id="section-cinema-spotlight"
      aria-label="Cinema Spotlight"
      className="relative w-full min-h-[430px] sm:min-h-[470px] lg:min-h-[490px] lg:max-h-[550px] flex flex-col justify-end overflow-hidden select-none bg-[#0A0B0F]"
    >
      {/* Full-Width Backdrop Artwork */}
      {activeBackdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={activeBackdropUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-[center_35%] lg:object-[70%_35%] scale-[1.01] filter brightness-[0.72] contrast-[1.06] saturate-[1.08] transition-opacity duration-700 ease-out"
            onError={() => {
              if (backdropFallbackIdx < candidateBackdrops.length - 1) {
                setBackdropFallbackIdx((prev) => prev + 1);
              }
            }}
          />
        </div>
      )}

      {/* Atmospheric Gradient Scrims: high legibility on left, artwork clear on right */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0A0B0F] via-[#0A0B0F]/82 via-50% to-[#0A0B0F]/25 pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/55 via-30% to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-28 z-10 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Balanced Desktop Two-Column Hero Content */}
      <div className="relative z-20 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 sm:pt-24 pb-6 sm:pb-8 lg:pb-9 flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-12">
        {/* Left Column: Refined Editorial Movie Information */}
        <div className="flex-1 min-w-0 max-w-2xl space-y-3 sm:space-y-3.5">
          {/* Subtle Label Pill */}
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#00D664] bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D664]" />
              <span>{spotlightLabel}</span>
            </span>

            {isWatchlist && mode !== "watchlist" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-[#00D664] bg-[#00D664]/10 border border-[#00D664]/25 px-2.5 py-0.5 rounded-full">
                In Watchlist
              </span>
            )}
          </div>

          {/* Featured Movie Title: clean modern editorial sans */}
          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3.25rem] text-white tracking-[-0.025em] leading-[1.08] text-balance drop-shadow-sm">
            {title}
          </h1>

          {/* Optional Tagline */}
          {tagline && (
            <p className="text-xs sm:text-sm italic text-white/75 font-normal leading-snug line-clamp-1">
              &ldquo;{tagline}&rdquo;
            </p>
          )}

          {/* Compact Metadata Strip — grouped to avoid dangling trailing bullets when wrapping on mobile */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs sm:text-[13px] text-[#B0B3C2]">
            {imdbRating && (
              <span
                title="Verified IMDb Rating"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/55 border border-white/10 text-[#FBBF24] font-semibold tabular-nums"
              >
                <Star className="w-3 h-3 fill-[#FBBF24] stroke-none" />
                <span>IMDb {imdbRating}</span>
              </span>
            )}

            {letterboxdRating && (
              <span
                title="Verified Letterboxd Rating"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/55 border border-white/10 text-white font-semibold tabular-nums"
              >
                <span>Letterboxd {letterboxdRating}</span>
              </span>
            )}

            {( (releaseYear && releaseYear !== "--") || runtimeDisplay ) && (
              <span className="inline-flex items-center gap-2 shrink-0">
                {releaseYear && releaseYear !== "--" && (
                  <span className="tabular-nums font-medium text-white/90">{releaseYear}</span>
                )}
                {releaseYear && releaseYear !== "--" && runtimeDisplay && (
                  <span className="text-white/30" aria-hidden="true">&bull;</span>
                )}
                {runtimeDisplay && (
                  <span className="inline-flex items-center gap-1.5 tabular-nums text-white/90">
                    <Clock className="w-3.5 h-3.5 text-white/55 stroke-[1.8]" />
                    <span>{runtimeDisplay}</span>
                  </span>
                )}
              </span>
            )}

            {genresList.length > 0 && (
              <span className="inline-flex items-center gap-2 text-white/80 font-normal">
                {((releaseYear && releaseYear !== "--") || runtimeDisplay) && (
                  <span className="hidden sm:inline text-white/30" aria-hidden="true">&bull;</span>
                )}
                <span>{genresList.slice(0, 3).join(", ")}</span>
              </span>
            )}

            {/* Personal Cineaste Rating (Strictly separate from external ratings) */}
            {resolvedUserRating !== null && (
              <span className="inline-flex items-center gap-2">
                <span className="hidden sm:inline text-white/30" aria-hidden="true">&bull;</span>
                <span
                  title="Your Personal Cineaste Rating"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00D664]/15 border border-[#00D664]/30 text-[#00D664] font-medium text-xs tabular-nums"
                >
                  <Star className="w-3 h-3 fill-[#00D664] stroke-none" />
                  <span>Your Rating: {resolvedUserRating.toFixed(1)}/10</span>
                </span>
              </span>
            )}
          </div>

          {/* Synopsis */}
          {overview && (
            <p className="text-[13px] sm:text-sm md:text-[15px] text-[#B8BAC7] font-normal leading-[1.6] line-clamp-3 max-w-xl text-pretty">
              {overview}
            </p>
          )}

          {/* Action Buttons Row */}
          <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Primary Action: Add to Watchlist / In Watchlist */}
            <button
              type="button"
              onClick={() => onToggleWatchlist(activeMovie)}
              className={cn(
                "h-10 sm:h-11 px-5 sm:px-6 rounded-full text-[13px] sm:text-sm font-semibold tracking-[-0.01em] inline-flex items-center gap-2 transition active:scale-[0.98] cursor-pointer",
                isWatchlist
                  ? "bg-white/10 hover:bg-white/15 border border-[#00D664]/45 text-[#00D664]"
                  : "bg-[#00D664] hover:bg-[#00BF59] text-black shadow-lg shadow-[#00D664]/20 hover:shadow-[#00D664]/35"
              )}
            >
              {isWatchlist ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.2]" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 stroke-[2]" />
                  <span>+ Add to Watchlist</span>
                </>
              )}
            </button>

            {/* Secondary Action: Explore Movie */}
            <button
              type="button"
              onClick={() => onOpenDetail(activeMovie)}
              className="h-10 sm:h-11 px-5 rounded-full bg-white/[0.09] hover:bg-white/[0.15] border border-white/15 text-white font-medium text-[13px] sm:text-sm inline-flex items-center gap-2 transition active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              <Info className="w-4 h-4 stroke-[1.8]" />
              <span>Explore Movie</span>
            </button>

            {/* Compact Circular Actions (Letterboxd / Base44 proportions) */}
            {onMarkWatchedRequest && (
              <button
                type="button"
                onClick={() => onMarkWatchedRequest(activeMovie)}
                aria-label={isWatched ? "Update Watched Rating" : "Mark as Watched"}
                title={isWatched ? "Watched • Edit Rating" : "Mark as Watched"}
                className={cn(
                  "h-10 w-10 sm:h-11 sm:w-11 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md border",
                  isWatched
                    ? "bg-[#00D664]/15 border-[#00D664]/40 text-[#00D664]"
                    : "bg-white/[0.08] hover:bg-white/[0.15] border-white/10 text-white/80 hover:text-white"
                )}
              >
                <Eye className="w-4 h-4 stroke-[1.8]" />
              </button>
            )}

            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(activeMovie)}
                aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                title={isFavorite ? "Favorited" : "Favorite"}
                className={cn(
                  "h-10 w-10 sm:h-11 sm:w-11 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md border",
                  isFavorite
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    : "bg-white/[0.08] hover:bg-white/[0.15] border-white/10 text-white/80 hover:text-rose-400"
                )}
              >
                <Heart className={cn("w-4 h-4 stroke-[1.8]", isFavorite && "fill-current")} />
              </button>
            )}

            {/* Subtle Discover More Link */}
            <button
              type="button"
              onClick={handleScrollDown}
              className="hidden sm:inline-flex items-center gap-1.5 ml-1 px-2 py-2 text-xs font-medium text-white/65 hover:text-[#00D664] transition cursor-pointer"
            >
              <span>Discover More</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Right Column (Desktop): Proportionally Framed Vertical Poster for the SAME Film */}
        {activePosterUrl && (
          <div className="hidden lg:block shrink-0 pb-1">
            <button
              type="button"
              onClick={() => onOpenDetail(activeMovie)}
              aria-label={`Open ${title} details`}
              className="group relative block w-[180px] xl:w-[210px] aspect-[2/3] rounded-2xl overflow-hidden bg-[#12131D] shadow-2xl shadow-black/90 ring-1 ring-white/15 hover:ring-[#00D664]/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <img
                src={activePosterUrl}
                alt={`${title} poster`}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                onError={() => {
                  if (posterFallbackIdx < candidatePosters.length - 1) {
                    setPosterFallbackIdx((prev) => prev + 1);
                  } else {
                    setPosterExhausted(true);
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5 pointer-events-none" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
