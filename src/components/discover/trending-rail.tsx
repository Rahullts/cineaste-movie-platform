"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, Bookmark, Plus, ChevronLeft, ChevronRight, TrendingUp, ArrowRight } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import type { Movie } from "@/types";

interface TrendingRailProps {
  movies: Movie[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  watchlistMap: Record<number, Movie>;
  onAdd: (movie: Movie) => void;
  onRemove: (id: number) => void;
  onToggleFavorite: (movie: Movie) => void;
}

/**
 * Cineaste Trending Today Editorial Rail
 * Distinctive vertical poster composition with editorial rank index, discreet rating,
 * smooth horizontal scrolling, and fluid hover micro-interactions.
 */
export function TrendingRail({
  movies = [],
  title = "Trending Today",
  subtitle,
  loading = false,
  watchlistMap = {},
  onAdd,
  onRemove,
  onToggleFavorite,
}: TrendingRailProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * scrollRef.current.clientWidth * 0.75,
        behavior: "smooth",
      });
    }
  };

  if (!loading && movies.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-[#00D878] grid place-items-center text-black shadow-sm shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-black" />
          </div>
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#F3F4F6]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#9496A1] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleScroll(1)}
          className="text-xs font-semibold text-[#00D878] hover:underline inline-flex items-center gap-1 transition"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="shrink-0 w-[150px] sm:w-[170px] aspect-[2/3] rounded-2xl bg-[#101118] border border-[#1E1F2A] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative group/rail">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            className="hidden md:grid absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition duration-200 shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Rail Items Track */}
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
          >
            {movies.map((movie, idx) => {
              const watchlistItem = watchlistMap[movie.tmdb_id];
              const isWatchlist = !!watchlistItem;
              const isFavorite = watchlistItem?.is_favorite ?? movie.is_favorite;
              const posterUrl = getTmdbImageUrl(movie.poster_path, "w342");

              const primaryGenre = movie.genre_ids?.[0]
                ? TMDB_GENRES.find((g) => g.id === movie.genre_ids?.[0])?.name
                : null;

              const rankNumber = String(idx + 1).padStart(2, "0");

              return (
                <div
                  key={`${movie.tmdb_id}-${idx}`}
                  className="w-[150px] sm:w-[170px] shrink-0 group/card flex flex-col"
                >
                  {/* Poster Card */}
                  <Link
                    href={`/movie/${movie.tmdb_id}`}
                    className="block relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#101118] border border-[#1E1F2A] transition-all duration-300 group-hover/card:border-[#00D878]/40 group-hover/card:shadow-xl group-hover/card:shadow-black/60"
                  >
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={movie.title}
                        width={170}
                        height={255}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#181820] flex items-center justify-center p-3 text-center">
                        <span className="text-xs text-[#9496A1] line-clamp-2">
                          {movie.title}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-70 group-hover/card:opacity-90 transition-opacity" />

                    {/* Expressive Editorial Rank Watermark */}
                    <span className="absolute bottom-1 right-2.5 text-4xl sm:text-5xl font-heading font-black text-white/20 group-hover/card:text-[#00D878]/40 transition-colors pointer-events-none tabular-nums select-none tracking-tighter leading-none">
                      {rankNumber}
                    </span>

                    {/* Discreet Rating Badge (Top-Right) */}
                    {movie.vote_average !== undefined && movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/70 backdrop-blur text-xs font-semibold tabular-nums px-1.5 py-0.5 border border-white/10 text-[#FBBF24]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{formatScore(movie.vote_average)}</span>
                        </span>
                      </div>
                    )}

                    {/* Favorite Gold Badge (Top-Left) */}
                    {isFavorite && (
                      <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur grid place-items-center border border-[#FBBF24]/30">
                        <Heart className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                      </span>
                    )}

                    {/* Hover Quick Action Buttons */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-center gap-2 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isWatchlist) {
                            onRemove(watchlistItem?.id || movie.tmdb_id);
                          } else {
                            onAdd(movie);
                          }
                        }}
                        aria-label={isWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                        title={isWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                        className={`w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition-all duration-200 hover:scale-110 ${
                          isWatchlist
                            ? "bg-[#00D878] text-black"
                            : "bg-black/70 text-white hover:bg-[#00D878] hover:text-black border border-white/20"
                        }`}
                      >
                        {isWatchlist ? (
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(watchlistItem || movie);
                        }}
                        aria-label={isFavorite ? "Remove favorite" : "Add to favorites"}
                        title={isFavorite ? "Remove favorite" : "Add to favorites"}
                        className={`w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition-all duration-200 hover:scale-110 ${
                          isFavorite
                            ? "bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40"
                            : "bg-black/70 text-white hover:bg-[#FBBF24]/25 hover:text-[#FBBF24] border border-white/20"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </Link>

                  {/* Movie Title & Essential Info */}
                  <div className="mt-2.5 px-0.5">
                    <Link href={`/movie/${movie.tmdb_id}`}>
                      <h3 className="text-sm font-semibold truncate leading-tight text-[#F3F4F6] group-hover/card:text-[#00D878] transition-colors">
                        {movie.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-[#9496A1] mt-0.5">
                      <span>{formatYear(movie.release_date)}</span>
                      {primaryGenre && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="truncate">{primaryGenre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => handleScroll(1)}
            className="hidden md:grid absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition duration-200 shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
