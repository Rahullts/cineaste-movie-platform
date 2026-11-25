"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Clapperboard, Loader2 } from "lucide-react";
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
 * Because You Watched
 * Generates personalized cinema recommendations strictly from the user's actual watched history,
 * excluding films already saved or watched in the user's library.
 */
export function BecauseYouWatchedSection({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: BecauseYouWatchedSectionProps) {
  // Reference Movie: derived strictly from the user's actual watched films
  const referenceMovie = React.useMemo(() => {
    const watched = movies.filter((m) => m.status === "watched");
    if (watched.length === 0) return null;

    return [...watched].sort((a, b) => {
      const dateA = new Date(a.watched_date || a.watched_at || a.updated_date || 0).getTime();
      const dateB = new Date(b.watched_date || b.watched_at || b.updated_date || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [movies]);

  const refId = referenceMovie ? Number(referenceMovie.tmdb_id || referenceMovie.id) : null;

  const libraryIdsKey = React.useMemo(() => {
    return movies
      .map((m) => Number(m.tmdb_id || m.id))
      .filter(Boolean)
      .sort((a, b) => a - b)
      .join(",");
  }, [movies]);

  const [rawRecommendations, setRawRecommendations] = React.useState<Movie[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch recommendations only when reference watched film ID changes (prevents duplicate API calls)
  React.useEffect(() => {
    let cancelled = false;

    if (!refId) {
      setRawRecommendations([]);
      setIsLoading(false);
      return;
    }

    const fetchRecs = async () => {
      setIsLoading(true);
      try {
        const res: any = await tmdbFetch({
          action: "recommendations",
          id: refId,
        });

        if (cancelled) return;
        setRawRecommendations(res?.results || []);
      } catch {
        if (!cancelled) setRawRecommendations([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRecs();

    return () => {
      cancelled = true;
    };
  }, [refId]);

  // Derive filtered recommendations excluding already saved/watched films & requiring portrait posters
  const recommendations = React.useMemo(() => {
    if (!referenceMovie || rawRecommendations.length === 0) return [];

    const libraryTmdbIds = new Set(
      movies.map((m) => Number(m.tmdb_id || m.id)).filter(Boolean)
    );
    const libraryTitles = new Set(
      movies.map((m) => m.title?.toLowerCase().trim()).filter(Boolean)
    );

    const seenIds = new Set<number>();
    if (refId) seenIds.add(refId);

    const filtered: Movie[] = [];
    for (const m of rawRecommendations) {
      const mId = Number(m.tmdb_id || m.id);
      const title = m.title?.toLowerCase().trim();

      if (!mId || seenIds.has(mId)) continue;
      if (!m.poster_path) continue;
      if (libraryTmdbIds.has(mId)) continue;
      if (title && libraryTitles.has(title)) continue;

      seenIds.add(mId);
      filtered.push(m);
      if (filtered.length >= 15) break;
    }

    return filtered;
  }, [rawRecommendations, referenceMovie, refId, libraryIdsKey]);

  // Adaptive rule: hide when no watched reference movie or no valid recommendations exist
  if (!referenceMovie || (!isLoading && recommendations.length === 0)) {
    return null;
  }

  return (
    <section
      id="section-because-you-watched"
      aria-label="Because You Watched Recommendations"
      className="space-y-3.5 sm:space-y-4 w-full"
    >
      {/* Unified Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Clapperboard className="w-[18px] h-[18px] text-[#00D664] shrink-0" strokeWidth={1.9} />
            <h2 className="font-heading text-lg sm:text-xl md:text-[1.375rem] font-semibold tracking-[-0.015em] leading-snug text-foreground flex items-baseline gap-2 min-w-0">
              <span>Because You Watched</span>
              <span className="text-[#00D664] truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium">
                &bull; {referenceMovie.title}
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-muted-foreground font-normal mt-0.5">
            Curated discoveries matching the tone and craft of &ldquo;{referenceMovie.title}&rdquo;
          </p>
        </div>

        <Link
          href="/discover"
          className="text-[13px] text-foreground/80 hover:text-[#00D664] font-semibold transition inline-flex items-center gap-1.5 group shrink-0"
        >
          <span>Explore Discover</span>
          <Compass className="w-3.5 h-3.5 stroke-[1.9] group-hover:rotate-45 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeleton or Poster Carousel */}
      {isLoading ? (
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 overflow-hidden py-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-[144px] sm:w-[164px] md:w-[176px] lg:w-[184px] xl:w-[196px] shrink-0 space-y-2.5 animate-pulse"
            >
              <div className="w-full aspect-[2/3] rounded-2xl bg-white/5 border border-white/5" />
              <div className="h-3.5 w-4/5 rounded bg-white/5" />
              <div className="h-2.5 w-1/2 rounded bg-white/5" />
            </div>
          ))}
          <span className="sr-only">
            <Loader2 className="animate-spin" /> Loading recommendations
          </span>
        </div>
      ) : (
        <PosterCarousel>
          {recommendations.map((movie, idx) => (
            <MoviePosterCard
              key={movie.tmdb_id || movie.id}
              movie={movie}
              variant="carousel"
              index={idx}
              editorialDashboard={true}
              strictRatingSource={true}
              enableWatchedAction={true}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              onToggleWatched={onToggleWatched}
              onToggleFavorite={onToggleFavorite}
              subLabel={
                Array.isArray(movie.genres) && movie.genres[0]
                  ? typeof movie.genres[0] === "string"
                    ? movie.genres[0]
                    : (movie.genres[0] as any)?.name
                  : undefined
              }
            />
          ))}
        </PosterCarousel>
      )}
    </section>
  );
}

// Backward compatibility alias
export { BecauseYouWatchedSection as ContinueExploringSection };
