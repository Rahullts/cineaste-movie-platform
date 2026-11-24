"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Bookmark, Plus, ChevronLeft, ChevronRight, Gem, ArrowRight } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie } from "@/types";

interface HiddenGemsRailProps {
  movies: Movie[];
  loading?: boolean;
  watchlistMap: Record<number, Movie>;
  onAdd: (movie: Movie) => void;
  onRemove: (id: number) => void;
}

/**
 * Cineaste Hidden Gems Editorial Rail
 * Cinematic widescreen 16:10 frame composition breaking visual monotony,
 * showcasing scene stills, discreet ratings, and fluid navigation.
 */
export function HiddenGemsRail({
  movies = [],
  loading = false,
  watchlistMap = {},
  onAdd,
  onRemove,
}: HiddenGemsRailProps) {
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
            <Gem className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#F3F4F6]">
            Hidden Gems
          </h2>
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
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="shrink-0 w-[260px] sm:w-[300px] md:w-[320px] aspect-[16/10] rounded-2xl bg-[#101118] border border-[#1E1F2A] animate-pulse"
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

              const imageUrl = getTmdbImageUrl(movie.backdrop_path || movie.poster_path, "w780");

              const primaryGenre = movie.genre_ids?.[0]
                ? TMDB_GENRES.find((g) => g.id === movie.genre_ids?.[0])?.name
                : null;

              return (
                <div
                  key={`${movie.tmdb_id}-${idx}`}
                  className="w-[260px] sm:w-[300px] md:w-[320px] shrink-0 group/card flex flex-col"
                >
                  {/* Widescreen Cinematic Card */}
                  <Link
                    href={`/movie/${movie.tmdb_id}`}
                    className="block relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#101118] border border-[#1E1F2A] transition-all duration-300 group-hover/card:border-[#00D878]/40 group-hover/card:shadow-xl group-hover/card:shadow-black/60"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={movie.title}
                        width={320}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#181820] flex items-center justify-center p-3 text-center">
                        <span className="text-xs text-[#9496A1] line-clamp-2">
                          {movie.title}
                        </span>
                      </div>
                    )}

                    {/* Gradient Depth Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Discreet Rating Badge (Top-Right) */}
                    {movie.vote_average !== undefined && movie.vote_average > 0 && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/70 backdrop-blur text-xs font-semibold tabular-nums px-1.5 py-0.5 border border-white/10 text-[#FBBF24]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{formatScore(movie.vote_average)}</span>
                        </span>
                      </div>
                    )}

                    {/* Lower Card Information */}
                    <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate leading-tight text-[#F3F4F6] group-hover/card:text-[#00D878] transition-colors">
                          {movie.title}
                        </h3>
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

                      {/* Quick Watchlist Action */}
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
                        className={`w-7 h-7 rounded-full shrink-0 grid place-items-center backdrop-blur-md transition-all duration-200 hover:scale-110 ${
                          isWatchlist
                            ? "bg-[#00D878] text-black"
                            : "bg-black/70 text-white hover:bg-[#00D878] hover:text-black border border-white/20"
                        }`}
                      >
                        {isWatchlist ? (
                          <Bookmark className="w-3 h-3 fill-current" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </Link>
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
