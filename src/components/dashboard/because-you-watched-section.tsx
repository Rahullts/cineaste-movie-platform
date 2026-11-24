"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Film, Clapperboard, Loader2 } from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

interface BecauseYouWatchedSectionProps {
  movies: Movie[];
  onOpenDetail: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleWatched?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
}

/**
 * Section 3: Because You Watched
 * Generates personalized cinema recommendations strictly from the user's actual watched films.
 * Excludes generic trending and filters out films already saved or watched in the user's library.
 */
export function BecauseYouWatchedSection({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: BecauseYouWatchedSectionProps) {
  // 1. Reference Movie: strictly derived from the user's actual watched films
  const referenceMovie = React.useMemo(() => {
    const watched = movies.filter((m) => m.status === "watched");
    if (watched.length === 0) return null;

    return [...watched].sort((a, b) => {
      const dateA = new Date(a.watched_date || a.watched_at || a.updated_date || 0).getTime();
      const dateB = new Date(b.watched_date || b.watched_at || b.updated_date || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [movies]);

  // 2. Recommendations State
  const [recommendations, setRecommendations] = React.useState<Movie[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // 3. Recommendation Fetcher: strictly targeted to the reference watched movie
  React.useEffect(() => {
    let cancelled = false;

    // If the user has not watched any films yet, do not query or display fake recommendations
    if (!referenceMovie) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    const fetchRecs = async () => {
      setIsLoading(true);
      try {
        const refId = referenceMovie.tmdb_id || referenceMovie.id;
        const res: any = await tmdbFetch({
          action: "recommendations",
          id: refId,
        });

        if (cancelled) return;

        const rawResults: Movie[] = res?.results || [];

        // Library exclusion sets: exclude any film already watched or saved in the user's library
        const libraryTmdbIds = new Set(
          movies.map((m) => Number(m.tmdb_id || m.id)).filter(Boolean)
        );
        const libraryTitles = new Set(
          movies.map((m) => m.title?.toLowerCase().trim()).filter(Boolean)
        );

        const seenIds = new Set<number>();
        if (referenceMovie.tmdb_id) seenIds.add(Number(referenceMovie.tmdb_id));
        if (referenceMovie.id) seenIds.add(Number(referenceMovie.id));

        const filteredRecs: Movie[] = [];
        for (const m of rawResults) {
          const mId = Number(m.tmdb_id || m.id);
          const title = m.title?.toLowerCase().trim();

          if (!mId || seenIds.has(mId)) continue;
          if (!m.poster_path && !m.backdrop_path) continue;
          if (libraryTmdbIds.has(mId)) continue;
          if (title && libraryTitles.has(title)) continue;

          seenIds.add(mId);
          filteredRecs.push(m);
          if (filteredRecs.length >= 15) break;
        }

        setRecommendations(filteredRecs);
      } catch {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRecs();

    return () => {
      cancelled = true;
    };
  }, [referenceMovie?.tmdb_id, referenceMovie?.id, referenceMovie?.title, movies]);

  return (
    <section
      id="section-because-you-watched"
      aria-label="Because You Watched Recommendations"
      className="space-y-3 sm:space-y-4 w-full"
    >
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Clapperboard className="w-5 h-5 text-[#00D878] shrink-0" />
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Because You Watched</span>
              {referenceMovie && (
                <span className="text-[#00D878] truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium">
                  &bull; {referenceMovie.title}
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {referenceMovie
              ? `Because you watched "${referenceMovie.title}", here are related cinematic discoveries matching its genre and tone`
              : "Screenings you mark as watched will generate tailored recommendations here"}
          </p>
        </div>

        <Link
          href="/discover"
          className="text-xs text-muted-foreground hover:text-[#00D878] font-medium transition inline-flex items-center gap-1 group shrink-0"
        >
          <span>Explore Discover</span>
          <Compass className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
        </Link>
      </div>

      {/* Content: Loading State, Recommended Posters Carousel, or Zero-Watched State */}
      {isLoading ? (
        <div className="h-64 sm:h-72 rounded-2xl bg-card/40 border border-border/50 animate-pulse grid place-items-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 text-[#00D878] animate-spin" />
            <span>Analyzing cinema recommendations for &ldquo;{referenceMovie?.title}&rdquo;...</span>
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <PosterCarousel>
          {recommendations.map((movie, idx) => {
            const isSaved = movies.some(
              (m) => (m.tmdb_id || m.id) === (movie.tmdb_id || movie.id)
            );
            const isWatched = movies.some(
              (m) => (m.tmdb_id || m.id) === (movie.tmdb_id || movie.id) && m.status === "watched"
            );
            const isFav = movies.some(
              (m) => (m.tmdb_id || m.id) === (movie.tmdb_id || movie.id) && m.is_favorite
            );

            return (
              <MoviePosterCard
                key={movie.tmdb_id || movie.id}
                movie={movie}
                variant="carousel"
                index={idx}
                onOpenDetail={onOpenDetail}
                onToggleWatchlist={onToggleWatchlist}
                onToggleWatched={onToggleWatched}
                onToggleFavorite={onToggleFavorite}
                isWatchlist={isSaved}
                isWatched={isWatched}
                isFavorite={isFav}
                subLabel={
                  Array.isArray(movie.genres) && movie.genres[0]
                    ? typeof movie.genres[0] === "string"
                      ? movie.genres[0]
                      : (movie.genres[0] as any)?.name
                    : undefined
                }
                recommendationReason={referenceMovie ? `Because you watched ${referenceMovie.title}` : undefined}
              />
            );
          })}
        </PosterCarousel>
      ) : referenceMovie ? (
        // Watched film exists, but all top recommendations are already in the library
        <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-[#00D878] grid place-items-center">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-foreground">
              All top recommendations for &ldquo;{referenceMovie.title}&rdquo; are already in your library!
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log more watched screenings to discover new director filmographies and genre gems.
            </p>
          </div>
          <Link
            href="/discover"
            className="mt-1 h-9 px-4 rounded-full bg-card border border-border hover:border-[#00D878]/50 text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-[#00D878]" />
            <span>Explore More Films</span>
          </Link>
        </div>
      ) : (
        // User has not watched any films yet
        <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/30">
          <div className="w-10 h-10 rounded-full bg-[#00D878]/10 text-[#00D878] grid place-items-center">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-foreground">
              Log your first watched film
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Screenings you mark as watched will unlock personalized cinema recommendations based on genres, directors, and related films.
            </p>
          </div>
          <Link
            href="/discover"
            className="mt-1 h-9 px-4 rounded-full bg-card border border-border hover:border-[#00D878]/50 text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-[#00D878]" />
            <span>Explore Films to Watch</span>
          </Link>
        </div>
      )}
    </section>
  );
}

// Backward compatibility alias
export { BecauseYouWatchedSection as ContinueExploringSection };
