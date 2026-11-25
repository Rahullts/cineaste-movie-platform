"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import type { Movie } from "@/types";

interface RecentlyWatchedSectionProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onOpenQuickAdd?: () => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

function formatWatchedDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return undefined;
  }
}

export function RecentlyWatchedSection({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: RecentlyWatchedSectionProps) {
  // Filter & sort watched movies strictly by actual watched date (newest first)
  const watchedMovies = React.useMemo(() => {
    return movies
      .filter((m) => m.status === "watched")
      .sort((a, b) => {
        const dateA = new Date(a.watched_date || a.watched_at || a.updated_date || 0).getTime();
        const dateB = new Date(b.watched_date || b.watched_at || b.updated_date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 15);
  }, [movies]);

  // Adaptive rule: hide when empty
  if (watchedMovies.length === 0) {
    return null;
  }

  return (
    <section
      id="section-recently-watched"
      aria-label="Recently Watched Movies"
      className="space-y-3.5 sm:space-y-4 w-full"
    >
      {/* Unified Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Eye className="w-[18px] h-[18px] text-[#00D664] shrink-0" strokeWidth={1.9} />
            <h2 className="font-heading text-lg sm:text-xl md:text-[1.375rem] font-semibold tracking-[-0.015em] leading-snug text-foreground">
              Recently Watched
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-muted-foreground font-normal mt-0.5">
            Your screened films, watched dates and personal ratings
          </p>
        </div>

        <Link
          href="/library?tab=watched"
          className="text-[13px] text-foreground/80 hover:text-[#00D664] font-semibold transition inline-flex items-center gap-1.5 group shrink-0"
        >
          <span>View All Watched</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.9] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content Carousel with Watched Dates & Personal Cineaste Ratings */}
      <PosterCarousel>
        {watchedMovies.map((movie, idx) => (
          <MoviePosterCard
            key={movie.tmdb_id || movie.id}
            movie={movie}
            variant="carousel"
            index={idx}
            isWatched={true}
            watchedDate={formatWatchedDate(
              movie.watched_date || movie.watched_at || movie.updated_date
            )}
            personalRating={
              typeof movie.rating === "number" && movie.rating > 0 ? movie.rating : undefined
            }
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
