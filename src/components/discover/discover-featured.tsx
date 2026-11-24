"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import type { Movie } from "@/types";

interface DiscoverFeaturedProps {
  movies: Movie[];
  watchlistMap: Record<number, Movie>;
  onAdd: (movie: Movie) => void;
  onRemove: (id: number) => void;
}

/**
 * Cineaste Editorial Featured Showcase
 * Immersive, cinematic centerpiece with large backdrop artwork, sophisticated typography,
 * essential metadata, quick watchlist toggle, and cross-fade image transitions.
 */
export function DiscoverFeatured({
  movies = [],
  watchlistMap = {},
  onAdd,
  onRemove,
}: DiscoverFeaturedProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const featured = React.useMemo(
    () => movies.filter((m) => !!m.backdrop_path).slice(0, 5),
    [movies]
  );

  // Auto-rotation every 7 seconds, pausing on hover
  React.useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length, isPaused]);

  if (featured.length === 0) {
    return (
      <section
        aria-label="Featured Movie Showcase"
        className="relative w-full h-[280px] sm:h-[330px] md:h-[370px] lg:h-[400px] rounded-3xl overflow-hidden border border-[#1E1F2A] bg-[#101118] animate-pulse"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 sm:p-7 md:p-8 space-y-3 w-full max-w-md z-10">
          <div className="h-4 w-32 bg-[#1E1F2A]/60 rounded-md" />
          <div className="h-8 w-64 bg-[#1E1F2A]/80 rounded-lg" />
          <div className="h-4 w-80 bg-[#1E1F2A]/50 rounded-md" />
        </div>
      </section>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % featured.length);
  };

  return (
    <section
      aria-label="Featured Movie Showcase"
      className="relative w-full rounded-3xl overflow-hidden border border-[#1E1F2A] bg-[#101118] shadow-2xl shadow-black/80 group/featured select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Featured Artwork & Slide Container (Calibrated height to leave room for rails below) */}
      <div className="relative w-full h-[280px] sm:h-[330px] md:h-[370px] lg:h-[400px] overflow-hidden">
        {featured.map((movie, idx) => {
          const isActive = idx === activeIdx;
          const backdropUrl = getTmdbImageUrl(movie.backdrop_path, "w1280");

          const isWatchlisted = Boolean(watchlistMap[movie.tmdb_id]);
          const primaryGenreId = movie.genre_ids?.[0];
          const primaryGenreName = primaryGenreId
            ? TMDB_GENRES.find((g) => g.id === primaryGenreId)?.name
            : null;

          return (
            <div
              key={movie.tmdb_id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Cinematic Backdrop Image with subtle zoom on card hover */}
              {backdropUrl && (
                <div className="absolute inset-0">
                  <Image
                    src={backdropUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority={idx === 0}
                    className="object-cover object-[center_30%] scale-100 group-hover/featured:scale-[1.02] transition-transform duration-1000 ease-out"
                  />
                </div>
              )}

              {/* Layered Gradient Vignettes for text contrast and depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/90 via-[#0A0B0F]/35 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

              {/* Sophisticated Movie Information Composition (Lower-Left) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 md:p-8 z-20 flex flex-col justify-end gap-2.5 max-w-2xl">
                {/* Essential Metadata: Rating, Release Year, Genre */}
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {movie.vote_average !== undefined && movie.vote_average > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md text-[#FBBF24] font-medium tabular-nums px-2 py-0.5 border border-[#FBBF24]/20 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[#F3F4F6] font-semibold">
                        {formatScore(movie.vote_average)}
                      </span>
                    </span>
                  )}
                  {movie.release_date && (
                    <span className="text-[#F3F4F6]/90 font-medium px-1">
                      {formatYear(movie.release_date)}
                    </span>
                  )}
                  {primaryGenreName && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="text-[#00D878] font-medium tracking-wide">
                        {primaryGenreName}
                      </span>
                    </>
                  )}
                </div>

                {/* Expressive Title */}
                <Link
                  href={`/movie/${movie.tmdb_id}`}
                  className="block group/title"
                >
                  <h2 className="font-heading text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.1] group-hover/title:text-[#00D878] transition-colors">
                    {movie.title}
                  </h2>
                </Link>

                {/* Short Overview (Maximum 2 lines) */}
                {movie.overview && (
                  <p className="text-xs sm:text-sm text-[#F3F4F6]/80 line-clamp-2 max-w-xl leading-relaxed font-normal">
                    {movie.overview}
                  </p>
                )}

                {/* Clear Actions: Explore & Watchlist */}
                <div className="pt-1 flex items-center gap-2.5">
                  <Link
                    href={`/movie/${movie.tmdb_id}`}
                    className="h-9 px-4 rounded-xl bg-[#00D878] text-black font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-[#00B855] transition shadow-lg shadow-[#00D878]/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isWatchlisted) {
                        onRemove(watchlistMap[movie.tmdb_id]?.id || movie.tmdb_id);
                      } else {
                        onAdd(movie);
                      }
                    }}
                    className={`h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-md transition border ${
                      isWatchlisted
                        ? "bg-[#00D878]/15 border-[#00D878]/40 text-[#00D878] hover:bg-[#00D878]/25"
                        : "bg-black/60 border-white/15 text-[#F3F4F6] hover:border-[#00D878]/50 hover:text-[#00D878]"
                    }`}
                  >
                    {isWatchlisted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#00D878]" />
                        <span>In Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Previous / Next Arrow Controls */}
        {featured.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:grid absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 place-items-center rounded-full bg-black/60 border border-white/15 text-white backdrop-blur-md opacity-0 group-hover/featured:opacity-100 transition duration-200 hover:bg-[#00D878] hover:text-black hover:border-transparent hover:scale-105"
              aria-label="Previous movie"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:grid absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 place-items-center rounded-full bg-black/60 border border-white/15 text-white backdrop-blur-md opacity-0 group-hover/featured:opacity-100 transition duration-200 hover:bg-[#00D878] hover:text-black hover:border-transparent hover:scale-105"
              aria-label="Next movie"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Elegant Slide Indicators (Bottom-Right) */}
        {featured.length > 1 && (
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 flex items-center gap-3 z-30 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="text-[11px] font-mono text-[#9496A1] tabular-nums">
              0{activeIdx + 1} <span className="text-white/20">/</span> 0{featured.length}
            </span>
            <div className="flex items-center gap-1.5">
              {featured.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-5 bg-[#00D878]"
                      : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
