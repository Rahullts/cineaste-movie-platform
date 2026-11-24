"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2, Film, Star, Heart } from "lucide-react";
import { formatYear, formatScore } from "@/lib/utils";
import type { Movie } from "@/types";

interface WatchlistCompactViewProps {
  items: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onRemove: (id: number) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

const STATUS_SHORT: Record<string, { label: string; cls: string }> = {
  want: { label: "Want", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  watching: { label: "Watching", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  watched: { label: "Watched", cls: "bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30" },
  dropped: { label: "Dropped", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

/**
 * Cineaste Personal Film Archive — Compact Archive View
 * High-density table presentation for efficient overview of large collections.
 */
export function WatchlistCompactView({
  items,
  onOpenDetail,
  onRemove,
  onToggleFavorite,
}: WatchlistCompactViewProps) {
  return (
    <div className="rounded-2xl bg-[#101118]/90 backdrop-blur-sm overflow-hidden shadow-xl space-y-1">
      {items.map((movie) => {
        const status = STATUS_SHORT[movie.status || "want"] || STATUS_SHORT.want;
        const posterUrl = movie.poster_path
          ? movie.poster_path.startsWith("http")
            ? movie.poster_path
            : `https://image.tmdb.org/t/p/w185${movie.poster_path}`
          : null;

        return (
          <div
            key={movie.tmdb_id || movie.id}
            className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.04] rounded-xl transition group/compact"
          >
            {/* 32px Mini Poster Thumbnail */}
            <button
              type="button"
              onClick={() => onOpenDetail(movie)}
              className="w-8 h-11 rounded-md overflow-hidden bg-[#14151F] shrink-0 relative group-hover/compact:scale-105 transition"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                  <Film className="w-3.5 h-3.5 opacity-40" />
                </div>
              )}
            </button>

            {/* Title */}
            <button
              type="button"
              onClick={() => onOpenDetail(movie)}
              className="flex-1 min-w-0 text-left text-xs sm:text-sm font-semibold text-white hover:text-[#00D878] transition-colors truncate"
            >
              {movie.title}
            </button>

            {/* Release Year */}
            <span className="text-xs text-[#9496A1] font-mono shrink-0">
              {formatYear(movie.release_date)}
            </span>

            {/* Rating */}
            {(movie.vote_average || 0) > 0 && (
              <span className="text-xs text-[#FBBF24] font-mono shrink-0 hidden sm:inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                {formatScore(movie.vote_average)}
              </span>
            )}

            {/* Status Pill */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 font-mono ${status.cls}`}
            >
              {status.label}
            </span>

            {/* Favorite Action */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(movie)}
                title={movie.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                className={`w-7 h-7 grid place-items-center rounded-lg transition shrink-0 ${
                  movie.is_favorite
                    ? "text-rose-400 bg-rose-500/15"
                    : "text-[#9496A1] hover:text-rose-400 hover:bg-white/5"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    movie.is_favorite ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
              </button>
            )}

            {/* Remove Action */}
            <button
              type="button"
              onClick={() => onRemove(movie.tmdb_id || movie.id)}
              title="Remove film"
              className="w-7 h-7 grid place-items-center rounded-lg text-[#9496A1] hover:text-destructive hover:bg-destructive/10 transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
