"use client";

import * as React from "react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import type { Movie } from "@/types";

export interface MovieRailCardProps {
  movie: Movie;
  index?: number;
  watchlistItem?: Movie;
  onAdd?: (movie: Movie) => void;
  onRemove?: (id: number) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onMarkWatched?: (movie: Movie) => void;
  onOpenDetail?: (movie: Movie) => void;
}

export function MovieRailCard({
  movie,
  index,
  watchlistItem,
  onAdd,
  onToggleFavorite,
  onMarkWatched,
  onOpenDetail,
}: MovieRailCardProps) {
  const activeMovie = watchlistItem || movie;
  return (
    <MoviePosterCard
      movie={activeMovie}
      index={index}
      onOpenDetail={onOpenDetail}
      onToggleWatchlist={onAdd}
      onToggleFavorite={onToggleFavorite}
      onToggleWatched={onMarkWatched}
    />
  );
}
