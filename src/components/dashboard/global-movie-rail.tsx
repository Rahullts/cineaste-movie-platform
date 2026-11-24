"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

interface GlobalMovieRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  index?: string;
  fetchPayload: Record<string, any>;
  viewAllHref?: string;
  viewAllText?: string;
  onOpenDetail: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
}

export function GlobalMovieRail({
  id,
  title,
  subtitle,
  icon: Icon,
  index,
  fetchPayload,
  viewAllHref = "/discover",
  viewAllText = "Explore More",
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: GlobalMovieRailProps) {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchRailData = async () => {
      setIsLoading(true);
      try {
        const res = await tmdbFetch(fetchPayload);
        if (!cancelled && res.results && res.results.length > 0) {
          // Filter out entries without poster and backdrop
          const validMovies = res.results.filter(
            (m) => Boolean(m.poster_path || m.backdrop_path)
          );
          setMovies(validMovies.slice(0, 16));
        }
      } catch {
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRailData();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(fetchPayload)]);

  if (!isLoading && movies.length === 0) {
    return null;
  }

  return (
    <section id={id} aria-label={title} className="space-y-3 sm:space-y-4 w-full">
      {/* ── Section Header ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-5 h-5 text-[#00D664] shrink-0" />}
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
              {index && (
                <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground/75 tracking-wider">
                  [{index}]
                </span>
              )}
              <span>{title}</span>
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground hover:text-[#00D664] font-medium transition inline-flex items-center gap-1 group shrink-0"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* ── Carousel Track or Skeleton Loaders ── */}
      {isLoading ? (
        <div className="flex items-start gap-3.5 sm:gap-4 md:gap-5 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0 space-y-2.5 animate-pulse"
            >
              <div className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/5" />
              <div className="h-3 w-4/5 rounded bg-white/5" />
              <div className="h-2.5 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <PosterCarousel>
          {movies.map((movie, idx) => (
            <MoviePosterCard
              key={movie.tmdb_id || movie.id}
              movie={movie}
              variant="carousel"
              index={idx}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              onToggleWatched={onToggleWatched}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </PosterCarousel>
      )}
    </section>
  );
}
