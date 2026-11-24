"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ArrowRight, Film, Bookmark } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import type { Movie } from "@/types";

interface RecentlyAddedSectionProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onOpenQuickAdd: () => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

export function RecentlyAddedSection({
  movies,
  onOpenDetail,
  onOpenQuickAdd,
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

  return (
    <section
      id="section-recently-added"
      aria-label="Recently Added Movies"
      className="space-y-3 sm:space-y-4 w-full"
    >
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#00D878] shrink-0" />
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Recently Added
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Films recently saved to your personal library
          </p>
        </div>

        <Link
          href="/library?tab=all-films"
          className="text-xs text-muted-foreground hover:text-[#00D878] font-medium transition inline-flex items-center gap-1 group shrink-0"
        >
          <span>View All Films</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content Carousel or Empty State */}
      {addedMovies.length > 0 ? (
        <PosterCarousel>
          {addedMovies.map((movie, idx) => (
            <MoviePosterCard
              key={movie.tmdb_id || movie.id}
              movie={movie}
              variant="carousel"
              index={idx}
              subLabel={movie.status === "watching" ? "Watching" : "In Library"}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              onToggleWatched={onToggleWatched}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </PosterCarousel>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-foreground">
              Your library is empty
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add your favorite films or movies you want to watch to build your personal cinema vault.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="mt-1 h-9 px-4 rounded-full bg-[#00D878] hover:bg-[#00B855] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#00D878]/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Your First Movie</span>
          </button>
        </div>
      )}
    </section>
  );
}