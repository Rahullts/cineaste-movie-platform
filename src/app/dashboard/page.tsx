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
import { useUser } from "@/lib/user-context";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

/**
 * Cineaste Dashboard Creative Redesign V2:
 * Premium Personal Cinema Curator Experience
 *
 * 1. Cinema Spotlight Hero:
 *    Full-width atmospheric backdrop with left-aligned editorial typography,
 *    clearly labeled external scores (TMDB ★), and instant "+ Add to Watchlist".
 * 2. Personal Rating Workflow:
 *    User can add to watchlist directly without rating; when marking watched,
 *    an elegant modal provides personal Cineaste star rating control or skip.
 * 3. Your Next Great Watch:
 *    Compact, curated discovery carousel with instant category switcher tabs
 *    (Trending Now, Critically Acclaimed, Hidden Gems, Popular in Cinema).
 * 4. Adaptive Personal Cinema Vault:
 *    Dynamically adjusts across brand-new user, saved-only, watched-only, and
 *    established user states with zero empty dashed boxes or fake records.
 */
function DashboardContent() {
  const router = useRouter();
  const library = useLibrary();
  const { user } = useUser();

  // Toast feedback state
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Rating modal state
  const [ratingModalMovie, setRatingModalMovie] = React.useState<Movie | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = React.useState(false);

  // Top trending spotlight fallback for brand-new users
  const [spotlightGlobalMovie, setSpotlightGlobalMovie] = React.useState<Movie | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    tmdbFetch({ action: "trending", time_window: "week" })
      .then((res) => {
        if (!cancelled && res.results && res.results.length > 0) {
          // Prioritize visually stunning cinema with real backdrop and established rating
          const topValid =
            res.results.find((m) => Boolean(m.backdrop_path && m.title && (m.vote_average || 0) >= 7.0)) ||
            res.results.find((m) => Boolean(m.backdrop_path && m.title));
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

  /**
   * Adaptive State Detection
   */
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

  /**
   * Spotlight Featured Movie & Mode:
   * - Brand-New User: Featured Cinema Spotlight ("CINEASTE PRESENTS")
   * - Saved Movies: User's priority saved film ("YOUR NEXT SCREENING")
   * - Watched Only: User's latest screened film ("RECENTLY SCREENED")
   */
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

  const isSpotlightInWatchlist = React.useMemo(() => {
    if (!spotlightMovie) return false;
    const id = spotlightMovie.tmdb_id || spotlightMovie.id;
    return savedMovies.some((m) => (m.tmdb_id || m.id) === id);
  }, [spotlightMovie, savedMovies]);

  // Watchlist interaction with immediate feedback
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

  // Watched interaction: opens personal rating modal
  const handleOpenRatingModal = React.useCallback((movie: Movie) => {
    setRatingModalMovie(movie);
    setIsRatingModalOpen(true);
  }, []);

  const handleSaveRating = React.useCallback(
    (movie: Movie, rating?: number, review?: string) => {
      library.markWatched(movie, rating, review);
      setIsRatingModalOpen(false);
      setToastMessage(
        rating
          ? `Screening logged for "${movie.title}" &bull; Rated ${rating.toFixed(1)}/10`
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

  const handleOpenQuickAdd = React.useCallback(() => {
    window.dispatchEvent(new Event("open-quick-add"));
  }, []);

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
      {/* ── 1. CINEMA SPOTLIGHT HERO (High-Impact Featured Experience) ── */}
      <CinemaSpotlightHero
        movie={spotlightMovie}
        mode={spotlightMode}
        isWatchlist={isSpotlightInWatchlist}
        onOpenDetail={handleOpenDetail}
        onToggleWatchlist={handleToggleWatchlist}
        onMarkWatchedRequest={handleOpenRatingModal}
        onDiscoverMore={handleDiscoverMore}
      />

      {/* ── 2. ADAPTIVE CONTENT SECTIONS BELOW SPOTLIGHT ── */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32 pt-4 sm:pt-6 space-y-8 sm:space-y-12 select-none relative z-20">
        {/* ── STATE A: BRAND-NEW USER (Curated Discovery Showcase) ── */}
        {dashboardState === "new_user" && (
          <YourNextGreatWatchSection
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleOpenRatingModal}
            onToggleFavorite={library.toggleFavorite}
          />
        )}

        {/* ── STATE B: USER HAS SAVED MOVIES ── */}
        {dashboardState === "saved_only" && (
          <>
            <RecentlyAddedSection
              movies={savedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <YourNextGreatWatchSection
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}

        {/* ── STATE C: USER HAS WATCHED MOVIES ── */}
        {dashboardState === "watched_only" && (
          <>
            <RecentlyWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <BecauseYouWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <YourNextGreatWatchSection
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}

        {/* ── STATE D: ESTABLISHED USER (Full Personalized Cinema Vault) ── */}
        {dashboardState === "established" && (
          <>
            <RecentlyAddedSection
              movies={savedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <RecentlyWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <BecauseYouWatchedSection
              movies={library.movies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />

            <YourNextGreatWatchSection
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleOpenRatingModal}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}
      </div>

      {/* ── 3. PERSONAL CINEASTE RATING MODAL ── */}
      <MovieRatingModal
        movie={ratingModalMovie}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSaveRating={handleSaveRating}
        onSkipRating={handleSkipRating}
      />

      {/* ── 4. SUBTLE WATCHLIST FLOATING TOAST ── */}
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
