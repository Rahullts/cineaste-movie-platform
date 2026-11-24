"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieRailCard } from "./movie-rail-card";
import type { Movie } from "@/types";

interface MovieRailProps {
  movies: Movie[];
  watchlistMap?: Record<number, Movie>;
  onAdd?: (movie: Movie) => void;
  onRemove?: (id: number) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onMarkWatched?: (movie: Movie) => void;
  onOpenDetail?: (movie: Movie) => void;
}

/**
 * Reconstructed 1:1 replica of Cineaste Movie Horizontal Scroll Rail (Fi)
 * Adaptive layout: evenly distributed responsive grid when <= 6 movies,
 * edge-to-edge smooth scroll track with smart navigation when > 6 movies.
 */
export function MovieRail({
  movies,
  watchlistMap = {},
  onAdd,
  onRemove,
  onToggleFavorite,
  onMarkWatched,
  onOpenDetail,
}: MovieRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll, movies]);

  const handleScroll = (direction: number) => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: "smooth",
      });
    }
  };

  // When 1 to 6 movies exist, display an adaptive responsive grid so posters distribute gracefully across desktop
  // without leaving awkward blank space on the right side
  if (movies.length <= 6) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 py-1 w-full max-w-full">
        {movies.map((movie, index) => (
          <div key={movie.tmdb_id || movie.id} className="w-full">
            <MovieRailCard
              movie={movie}
              index={index}
              watchlistItem={watchlistMap[movie.tmdb_id]}
              onAdd={onAdd}
              onRemove={onRemove}
              onToggleFavorite={onToggleFavorite}
              onMarkWatched={onMarkWatched}
              onOpenDetail={onOpenDetail}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative group/rail w-full max-w-full min-w-0">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll(-1)}
          className="hidden md:grid absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Rail Items Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
      >
        {movies.map((movie, index) => (
          <div
            key={movie.tmdb_id || movie.id}
            className="w-[155px] sm:w-[175px] md:w-[195px] lg:w-[215px] xl:w-[230px] shrink-0"
          >
            <MovieRailCard
              movie={movie}
              index={index}
              watchlistItem={watchlistMap[movie.tmdb_id]}
              onAdd={onAdd}
              onRemove={onRemove}
              onToggleFavorite={onToggleFavorite}
              onMarkWatched={onMarkWatched}
              onOpenDetail={onOpenDetail}
            />
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll(1)}
          className="hidden md:grid absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
