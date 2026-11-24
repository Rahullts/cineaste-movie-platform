"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Eye } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import type { Movie } from "@/types";

interface RecentlyWatchedSectionProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onOpenQuickAdd: () => void;
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
  onOpenQuickAdd,
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

  // In an adaptive dashboard, hide empty personal section
  if (watchedMovies.length === 0) {
    return null;
  }

  return (
    <section
      id="section-recently-watched"
      aria-label="Recently Watched Movies"
      className="space-y-3 sm:space-y-4 w-full"
    >
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-[#00D878] shrink-0" />
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Recently Watched
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Your screened films, watched dates and personal ratings
          </p>
        </div>

        <Link
          href="/library?tab=watched"
          className="text-xs text-muted-foreground hover:text-[#00D878] font-medium transition inline-flex items-center gap-1 group shrink-0"
        >
          <span>View All Watched</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content Carousel */}
      <PosterCarousel>
        {watchedMovies.map((movie, idx) => (
          <MoviePosterCard
            key={movie.tmdb_id || movie.id}
            movie={movie}
            variant="carousel"
            index={idx}
            isWatched={true}
            showActions={false}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </PosterCarousel>
    </section>
  );
}
