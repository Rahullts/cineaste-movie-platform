"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import type { Movie } from "@/types";

interface RecentlyAddedSectionProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onOpenQuickAdd?: () => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

export function RecentlyAddedSection({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: RecentlyAddedSectionProps) {
  // Sort by actual added date, newest first
  const addedMovies = React.useMemo(() => {
    return [...movies]
      .sort((a, b) => {
        const dateA = new Date(a.created_date || a.updated_date || 0).getTime();
        const dateB = new Date(b.created_date || b.updated_date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 15);
  }, [movies]);

  // Adaptive rule: hide when empty
  if (addedMovies.length === 0) {
    return null;
  }

  return (
    <section
      id="section-recently-added"
      aria-label="Recently Added Movies"
      className="space-y-3.5 sm:space-y-4 w-full"
    >
      {/* Unified Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-[18px] h-[18px] text-[#00D664] shrink-0" strokeWidth={1.9} />
            <h2 className="font-heading text-lg sm:text-xl md:text-[1.375rem] font-semibold tracking-[-0.015em] leading-snug text-foreground">
              Recently Added
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-muted-foreground font-normal mt-0.5">
            Films recently saved to your personal watchlist
          </p>
        </div>

        <Link
          href="/library?tab=all-films"
          className="text-[13px] text-foreground/80 hover:text-[#00D664] font-semibold transition inline-flex items-center gap-1.5 group shrink-0"
        >
          <span>View All Films</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.9] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content Carousel */}
      <PosterCarousel>
        {addedMovies.map((movie, idx) => (
          <MoviePosterCard
            key={movie.tmdb_id || movie.id}
            movie={movie}
            variant="carousel"
            index={idx}
            subLabel={movie.status === "watching" ? "Watching" : "Watchlist"}
            editorialDashboard={true}
            strictRatingSource={true}
            enableWatchedAction={true}
            onOpenDetail={onOpenDetail}
            onToggleWatchlist={onToggleWatchlist}
            onToggleWatched={onToggleWatched}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </PosterCarousel>
    </section>
  );
}
