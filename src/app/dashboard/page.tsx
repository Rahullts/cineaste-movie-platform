"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CinemaSpotlightHero } from "@/components/dashboard/cinema-spotlight-hero";
import { YourNextGreatWatchSection } from "@/components/dashboard/your-next-great-watch-section";
import { RecentlyAddedSection } from "@/components/dashboard/recently-added-section";
import { RecentlyWatchedSection } from "@/components/dashboard/recently-watched-section";
import { BecauseYouWatchedSection } from "@/components/dashboard/because-you-watched-section";
import { MovieRatingModal } from "@/components/dashboard/movie-rating-modal";
import { WatchlistToast } from "@/components/dashboard/watchlist-toast";
import { useLibrary } from "@/lib/library-store";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

/**
 * Cineaste Personal Cinema Dashboard
 *
 * Hierarchy & Section Order:
 * 1. Cinema Spotlight Hero (full-width backdrop + matched vertical desktop poster)
 * 2. Your Next Great Watch (Trending Now, Critically Acclaimed, Hidden Gems, Popular Picks)
 * 3. Adaptive Personal Sections (in exact order, hidden cleanly when empty):
 *    a. Recently Added
 *    b. Recently Watched
 *    c. Because You Watched
 */
function DashboardContent() {
  const router = useRouter();
  const library = useLibrary();

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [ratingModalMovie, setRatingModalMovie] = React.useState<Movie | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = React.useState(false);

  // Trending spotlight fallback requiring BOTH backdrop_path AND poster_path for the exact same film
  const [spotlightGlobalMovie, setSpotlightGlobalMovie] = React.useState<Movie | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    tmdbFetch({ action: "trending", time_window: "week" })
      .then((res) => {
        if (!cancelled && res.results && res.results.length > 0) {
          const topValid =
            res.results.find((m) =>
              Boolean(m.backdrop_path && m.poster_path && m.title && (m.vote_average || 0) >= 6.5)
            ) || res.results.find((m) => Boolean(m.backdrop_path && m.poster_path && m.title));
          if (topValid) setSpotlightGlobalMovie(topValid);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenDetail = React.useCallback(
    (movie: Movie) => {
      router.push(`/movie/${movie.tmdb_id || movie.id}`);
    },
    [router]
  );

  // Real user library segments
  const savedMovies = React.useMemo(() => {
    return (library.movies || []).filter(
      (m) => m?.status === "want" || m?.status === "watching"
    );
  }, [library.movies]);

  const watchedMovies = React.useMemo(() => {
    return (library.movies || []).filter((m) => m?.status === "watched");
  }, [library.movies]);

  // Existing 4-state adaptive state detection
  const dashboardState = React.useMemo<"new_user" | "saved_only" | "watched_only" | "established">(() => {
    if (savedMovies.length === 0 && watchedMovies.length === 0) {
      return "new_user";
    }
    if (savedMovies.length > 0 && watchedMovies.length === 0) {
      return "saved_only";
    }
    if (savedMovies.length === 0 && watchedMovies.length > 0) {
      return "watched_only";
    }
    return "established";
  }, [savedMovies.length, watchedMovies.length]);

  // Spotlight hero source derived from real state
  const { spotlightMovie, spotlightMode } = React.useMemo(() => {
    if (dashboardState === "new_user") {
      return {
        spotlightMovie: spotlightGlobalMovie,
        spotlightMode: "spotlight" as const,
      };
    }

    if (savedMovies.length > 0) {
      const watching = savedMovies.find((m) => m?.status === "watching");
      const fav = savedMovies.find((m) => m?.is_favorite);
      return {
        spotlightMovie: watching || fav || savedMovies[0],
        spotlightMode: "watchlist" as const,
      };
    }

    if (watchedMovies.length > 0) {
      return {
        spotlightMovie: watchedMovies[0],
        spotlightMode: "watched" as const,
      };
    }

    return {
      spotlightMovie: spotlightGlobalMovie,
      spotlightMode: "spotlight" as const,
    };
  }, [dashboardState, savedMovies, watchedMovies, spotlightGlobalMovie]);

  // Live library status lookup for featured spotlight movie
  const spotlightLibraryEntry = React.useMemo(() => {
    if (!spotlightMovie || !library.movies) return null;
    const id = spotlightMovie.tmdb_id || spotlightMovie.id;
    return library.movies.find((m) => (m.tmdb_id || m.id) === id) || null;
  }, [spotlightMovie, library.movies]);

  const isSpotlightInWatchlist = Boolean(
    spotlightLibraryEntry &&
      (spotlightLibraryEntry.status === "want" || spotlightLibraryEntry.status === "watching")
  );
  const isSpotlightWatched = spotlightLibraryEntry?.status === "watched";
  const isSpotlightFavorite = Boolean(spotlightLibraryEntry?.is_favorite);
  const spotlightUserRating =
    typeof spotlightLibraryEntry?.rating === "number" && spotlightLibraryEntry.rating > 0
      ? spotlightLibraryEntry.rating
      : null;

  // Watchlist interaction using existing library-store
  const handleToggleWatchlist = React.useCallback(
    (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const isAlreadySaved = (library.movies || []).some(
        (m) => (m.tmdb_id || m.id) === id && (m.status === "want" || m.status === "watching")
      );

      if (isAlreadySaved) {
        library.removeFromWatchlist(id);
        setToastMessage(`Removed "${movie.title}" from your Watchlist`);
      } else {
        library.addToWatchlist(movie);
        setToastMessage(`Added "${movie.title}" to your Watchlist`);
      }
    },
    [library]
  );

  // Favorite interaction with feedback toast
  const handleToggleFavorite = React.useCallback(
    (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const existing = (library.movies || []).find((m) => (m.tmdb_id || m.id) === id);
      const willBeFav = !existing?.is_favorite;
      library.toggleFavorite(existing || movie);
      setToastMessage(
        willBeFav
          ? `Added "${movie.title}" to Favorites`
          : `Removed "${movie.title}" from Favorites`
      );
    },
    [library]
  );

  // Watched & Personal Rating modal workflow
  const handleOpenRatingModal = React.useCallback(
    (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const existing = (library.movies || []).find((m) => (m.tmdb_id || m.id) === id);
      setRatingModalMovie(existing ? { ...movie, ...existing } : movie);
      setIsRatingModalOpen(true);
    },
    [library.movies]
  );

  const handleSaveRating = React.useCallback(
    (movie: Movie, rating?: number, review?: string) => {
      library.markWatched(movie, rating, review);
      setIsRatingModalOpen(false);
      setToastMessage(
        rating
          ? `Screening logged for "${movie.title}" • Rated ${rating.toFixed(1)}/10`
          : `Marked "${movie.title}" as Watched`
      );
    },
    [library]
  );

  const handleSkipRating = React.useCallback(
    (movie: Movie) => {
      library.markWatched(movie, undefined);
      setIsRatingModalOpen(false);
      setToastMessage(`Marked "${movie.title}" as Watched`);
    },
    [library]
  );

  const handleDiscoverMore = React.useCallback(() => {
    const el = document.getElementById("section-next-great-watch");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/discover");
    }
  }, [router]);

  return (
    <AppShell>
      {/* 1. CINEMA SPOTLIGHT HERO */}
      <CinemaSpotlightHero
        movie={spotlightMovie}
        mode={spotlightMode}
        isWatchlist={isSpotlightInWatchlist}
        isWatched={isSpotlightWatched}
        isFavorite={isSpotlightFavorite}
        userRating={spotlightUserRating}
        onOpenDetail={handleOpenDetail}
        onToggleWatchlist={handleToggleWatchlist}
        onMarkWatchedRequest={handleOpenRatingModal}
        onToggleFavorite={handleToggleFavorite}
        onDiscoverMore={handleDiscoverMore}
      />

      {/* 2. DISCOVERY & PERSONAL CINEMA SECTIONS */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32 pt-4 sm:pt-6 space-y-9 sm:space-y-12 select-none relative z-20">
        {/* Always first below Spotlight: Discovery Showcase */}
        <YourNextGreatWatchSection
          onOpenDetail={handleOpenDetail}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleOpenRatingModal}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Personal Section 1: Recently Added (shown only when saved movies exist) */}
        {(dashboardState === "saved_only" || dashboardState === "established") && (
          <RecentlyAddedSection
            movies={savedMovies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleOpenRatingModal}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Personal Section 2: Recently Watched (shown only when watched records exist) */}
        {(dashboardState === "watched_only" || dashboardState === "established") && (
          <RecentlyWatchedSection
            movies={watchedMovies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleOpenRatingModal}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Personal Section 3: Because You Watched (derived from real watched history) */}
        {(dashboardState === "watched_only" || dashboardState === "established") && (
          <BecauseYouWatchedSection
            movies={library.movies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleOpenRatingModal}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>

      {/* 3. PERSONAL CINEASTE RATING MODAL */}
      <MovieRatingModal
        movie={ratingModalMovie}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSaveRating={handleSaveRating}
        onSkipRating={handleSkipRating}
      />

      {/* 4. WATCHLIST & RATING FLOATING TOAST */}
      <WatchlistToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0A0B0F]" />}>
      <DashboardContent />
    </React.Suspense>
  );
}
