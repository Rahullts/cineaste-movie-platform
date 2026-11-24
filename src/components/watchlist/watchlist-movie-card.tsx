"use client";

import * as React from "react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import type { Movie } from "@/types";

export interface WatchlistMovieCardProps {
  movie: Movie;
  index?: number;
  onOpenDetail?: (movie: Movie) => void;
  onRemove?: (id: number) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
}

export function WatchlistMovieCard({
  movie,
  index,
  onOpenDetail,
  onRemove,
  onToggleWatched,
  onToggleFavorite,
  onToggleWatchlist,
}: WatchlistMovieCardProps) {
  return (
    <MoviePosterCard
      movie={movie}
      index={index}
      onOpenDetail={onOpenDetail}
      onRemove={onRemove}
      onToggleWatched={onToggleWatched}
      onToggleFavorite={onToggleFavorite}
      onToggleWatchlist={onToggleWatchlist}
    />
  );
}
