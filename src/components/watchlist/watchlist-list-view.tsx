"use client";

import * as React from "react";
import Image from "next/image";
import {
  Star,
  Heart,
  Trash2,
  Info,
  Film,
  CheckCircle2,
} from "lucide-react";
import { formatScore, formatYear, formatRuntime } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import {
  VaultMark,
  OrbitMark,
  CompletionFrameMark,
} from "./watchlist-icons";
import type { Movie } from "@/types";

interface WatchlistListViewProps {
  items: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onRemove: (id: number) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

const STATUS_BADGES: Record<
  string,
  { label: string; cls: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  want: {
    label: "In Watchlist",
    cls: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: VaultMark,
  },
  watching: {
    label: "Watching",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: OrbitMark,
  },
  watched: {
    label: "Watched",
    cls: "bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30",
    icon: CompletionFrameMark,
  },
  dropped: {
    label: "Dropped",
    cls: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: Trash2,
  },
};

/**
 * Cineaste Personal Film Archive — Editorial List View
 * Detailed horizontal row presentation for comprehensive archive browsing.
 */
export function WatchlistListView({
  items,
  onOpenDetail,
  onRemove,
  onToggleWatched,
  onToggleFavorite,
}: WatchlistListViewProps) {
  const [failedImages, setFailedImages] = React.useState<Record<number, boolean>>({});

  return (
    <div className="rounded-2xl bg-card/90 border border-border/50 backdrop-blur-sm overflow-hidden shadow-xl space-y-1">
      {items.map((movie) => {
        const mId = movie.tmdb_id || movie.id;
        const status = STATUS_BADGES[movie.status || "want"] || STATUS_BADGES.want;
        const StatusIcon = status.icon;

        const posterUrl = !failedImages[mId]
          ? getTmdbImageUrl(movie.poster_path, "w185")
          : null;

        const genreList = (movie.genres || [])
          .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
          .filter(Boolean);

        return (
          <div
            key={mId}
            className="flex items-center gap-3.5 sm:gap-5 p-3 sm:p-4 hover:bg-muted/40 rounded-xl transition-colors group/row"
          >
            {/* Poster Thumbnail via /api/image proxy */}
            <div
              onClick={() => onOpenDetail(movie)}
              className="relative w-12 sm:w-16 aspect-[2/3] rounded-xl overflow-hidden bg-muted shrink-0 shadow-md cursor-pointer group-hover/row:scale-[1.02] transition"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  sizes="64px"
                  className="object-cover group-hover/row:scale-105 transition-transform duration-300"
                  onError={() => setFailedImages((prev) => ({ ...prev, [mId]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Film className="w-4 h-4 opacity-40" />
                </div>
              )}
            </div>

            {/* Film Main Info */}
            <div
              onClick={() => onOpenDetail(movie)}
              className="flex-1 min-w-0 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover/row:text-[#00D878] transition-colors truncate">
                  {movie.title}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatYear(movie.release_date)}
                </span>
                {movie.runtime ? (
                  <span className="text-xs text-muted-foreground/70 font-mono hidden sm:inline">
                    • {formatRuntime(movie.runtime)}
                  </span>
                ) : null}
              </div>

              {/* Genres & Note Excerpt */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {genreList.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
                {movie.review && (
                  <span className="text-xs text-muted-foreground/75 italic truncate max-w-xs hidden md:inline">
                    &ldquo;{movie.review}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {/* Distinct Personal Cineaste Rating vs Accurately Labeled External / TMDB Score */}
            <div className="shrink-0 flex items-center gap-3">
              {movie.rating ? (
                <div
                  title="Your Personal Cineaste Rating"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D878]/10 border border-[#00D878]/20 text-[#00D878] text-xs font-bold font-mono"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{movie.rating}/10</span>
                </div>
              ) : (movie.imdb_rating || 0) > 0 ? (
                <div
                  title="IMDb Rating"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border border-border text-[#FBBF24] text-xs font-semibold font-mono"
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[9px] text-muted-foreground">IMDb</span>
                  <span>{formatScore(movie.imdb_rating)}</span>
                </div>
              ) : (movie.vote_average || 0) > 0 ? (
                <div
                  title="TMDB Community Score"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border border-border text-[#FBBF24] text-xs font-semibold font-mono"
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[9px] text-muted-foreground">TMDB</span>
                  <span>{formatScore(movie.vote_average)}</span>
                </div>
              ) : null}

              {/* Unified Status Pill */}
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}
              >
                <StatusIcon size={12} />
                <span>{status.label}</span>
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(movie)}
                  title={movie.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                  className={`w-8 h-8 rounded-lg grid place-items-center transition cursor-pointer ${
                    movie.is_favorite
                      ? "text-rose-400 bg-rose-500/15"
                      : "text-muted-foreground hover:text-rose-400 hover:bg-muted"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      movie.is_favorite ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => onToggleWatched(movie)}
                title={movie.status === "watched" ? "Mark as unwatched" : "Mark as watched"}
                className={`w-8 h-8 rounded-lg grid place-items-center transition cursor-pointer ${
                  movie.status === "watched"
                    ? "text-[#00D878] bg-[#00D878]/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(movie)}
                title="View Details"
                className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onRemove(mId)}
                title="Remove film"
                className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
