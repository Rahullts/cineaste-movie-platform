"use client";

import * as React from "react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import type { Movie } from "@/types";

export interface MovieCardProps {
  movie: Movie;
  className?: string;
  onWantToWatch?: (movie: Movie) => void;
  onMarkWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onOpenDetail?: (movie: Movie) => void;
  priority?: boolean;
}

/**
 * Cineaste Unified Movie Card
 * Proxies to the core editorial MoviePosterCard component.
 */
export function MovieCard({
  movie,
  className,
  onWantToWatch,
  onMarkWatched,
  onToggleFavorite,
  onOpenDetail,
}: MovieCardProps) {
  return (
    <MoviePosterCard
      movie={movie}
      className={className}
      onToggleWatchlist={onWantToWatch}
      onToggleWatched={onMarkWatched}
      onToggleFavorite={onToggleFavorite}
      onOpenDetail={onOpenDetail}
    />
  );
}
