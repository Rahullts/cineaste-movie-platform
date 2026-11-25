"use client";

import * as React from "react";
import Image from "next/image";
import { Film, ChevronLeft, ChevronRight } from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import { VaultMark } from "./watchlist-icons";
import type { Movie } from "@/types";

interface WatchlistRecentlyAddedRailProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
}

/**
 * Format date nicely e.g. "Oct 31"
 */
function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Cineaste Personal Film Archive — Recently Added Horizontal Rail
 * Elegant scrollable sub-rail displaying up to 10 latest additions to the library.
 */
export function WatchlistRecentlyAddedRail({
  movies,
  onOpenDetail,
}: WatchlistRecentlyAddedRailProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir * scrollRef.current.clientWidth * 0.7,
        behavior: "smooth",
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section aria-label="Recently Added Films" className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00D878]/10 border border-[#00D878]/20 flex items-center justify-center text-[#00D878]">
            <VaultMark size={13} />
          </div>
          <h2 className="text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-white">
            Recently Added to Archive
          </h2>
          <span className="text-xs text-[#9496A1] font-mono">
            ({movies.length})
          </span>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            className="w-7 h-7 rounded-lg bg-[#14151F] border border-[#1E1F2A] text-[#9496A1] hover:text-white hover:border-[#00D878]/40 flex items-center justify-center transition"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll(1)}
            className="w-7 h-7 rounded-lg bg-[#14151F] border border-[#1E1F2A] text-[#9496A1] hover:text-white hover:border-[#00D878]/40 flex items-center justify-center transition"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
      >
        {movies.map((movie) => {
          const posterUrl = getTmdbImageUrl(movie.poster_path, "w185");

          const dateBadge = formatShortDate(movie.created_date);

          return (
            <div
              key={movie.tmdb_id || movie.id}
              onClick={() => onOpenDetail(movie)}
              className="shrink-0 w-28 sm:w-32 group/recent cursor-pointer select-none"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#14151F] border border-[#1E1F2A] group-hover/recent:border-[#00D878]/50 group-hover/recent:-translate-y-1 transition-all duration-300 shadow-md">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    sizes="128px"
                    className="object-cover group-hover/recent:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                    <Film className="w-6 h-6 opacity-40" />
                  </div>
                )}

                {/* Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Added Date Badge */}
                {dateBadge && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/10 backdrop-blur-sm">
                    {dateBadge}
                  </span>
                )}
              </div>

              {/* Title */}
              <p className="text-xs font-medium text-white truncate mt-1.5 group-hover/recent:text-[#00D878] transition-colors">
                {movie.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
