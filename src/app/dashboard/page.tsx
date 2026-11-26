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
import { getGreeting } from "@/lib/utils";
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
  const { user, isAuthenticated } = useUser();

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [ratingModalMovie, setRatingModalMovie] = React.useState<Movie | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = React.useState(false);
  const [timeGreeting, setTimeGreeting] = React.useState<string>("");

  React.useEffect(() => {
    setTimeGreeting(getGreeting());
  }, []);

  const greetingName = React.useMemo(() => {
    if (isAuthenticated && user?.display_name && !user.display_name.toLowerCase().includes("guest")) {
      return user.display_name;
    }
    if (isAuthenticated && user?.handle && user.handle !== "guest") {
      return user.handle;
    }
    return null;
  }, [isAuthenticated, user?.display_name, user?.handle]);

  // Trending spotlight candidate pool for interactive multi-film carousel
  const [spotlightGlobalMovies, setSpotlightGlobalMovies] = React.useState<Movie[]>([]);
  const [spotlightIndex, setSpotlightIndex] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    tmdbFetch({ action: "trending", time_window: "week" })
      .then((res) => {
        if (!cancelled && res.results && res.results.length > 0) {
          const valid = res.results.filter((m: Movie) =>
            Boolean(m.backdrop_path && m.poster_path && m.title)
          );
          if (valid.length > 0) {
            setSpotlightGlobalMovies(valid.slice(0, 8));
          }
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

  // Curated spotlight candidate pool with multi-film carousel switching
  const spotlightCandidates = React.useMemo<Movie[]>(() => {
    const list: Movie[] = [];
    if (savedMovies.length > 0) {
      const watching = savedMovies.find((m) => m?.status === "watching");
      const fav = savedMovies.find((m) => m?.is_favorite);
      const primary = watching || fav || savedMovies[0];
      if (primary) list.push(primary);
    }
    if (spotlightGlobalMovies.length > 0) {
      for (const m of spotlightGlobalMovies) {
        if (!list.some((existing) => (existing.tmdb_id || existing.id) === (m.tmdb_id || m.id))) {
          list.push(m);
        }
        if (list.length >= 6) break;
      }
    }
    // Curated verified fallback classics if API has not responded yet
    if (list.length === 0) {
      list.push(
        {
          id: 693134,
          tmdb_id: 693134,
          title: "Dune: Part Two",
          release_date: "2024-03-01",
          vote_average: 8.2,
          overview:
            "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
          backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg",
          poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        },
        {
          id: 157336,
          tmdb_id: 157336,
          title: "Interstellar",
          release_date: "2014-11-05",
          vote_average: 8.4,
          overview:
            "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
          backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
          poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        },
        {
          id: 275,
          tmdb_id: 275,
          title: "Fargo",
          release_date: "1996-03-08",
          vote_average: 7.8,
          overview:
            "Jerry, a small-town Minnesota car salesman is bursting at the seams with debt... but he's got a plan. He's going to hire two thugs to kidnap his wife in a scheme to collect a hefty ransom from his wealthy father-in-law.",
          backdrop_path: "/747dgDfL5d8esobk7h4odaOFhUq.jpg",
          poster_path: "/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg",
        }
      );
    }
    return list;
  }, [savedMovies, spotlightGlobalMovies]);

  const activeIndex = spotlightIndex % (spotlightCandidates.length || 1);
  const spotlightMovie = spotlightCandidates[activeIndex] || null;

  const spotlightMode = React.useMemo<"spotlight" | "watchlist" | "watched">(() => {
    if (!spotlightMovie) return "spotlight";
    const id = spotlightMovie.tmdb_id || spotlightMovie.id;
    const inSaved = savedMovies.some((m) => (m.tmdb_id || m.id) === id);
    if (inSaved) return "watchlist";
    const inWatched = watchedMovies.some((m) => (m.tmdb_id || m.id) === id);
    if (inWatched) return "watched";
    return "spotlight";
  }, [spotlightMovie, savedMovies, watchedMovies]);

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
    async (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const isAlreadySaved = (library.movies || []).some(
        (m) => (m.tmdb_id || m.id) === id && (m.status === "want" || m.status === "watching")
      );

      if (isAlreadySaved) {
        const res = await library.removeFromWatchlist(id);
        if (res.ok) {
          setToastMessage(`Removed "${movie.title}" from your Watchlist`);
        }
      } else {
        const res = await library.addToWatchlist(movie);
        if (res.ok) {
          setToastMessage(`Added "${movie.title}" to your Watchlist`);
        }
      }
    },
    [library]
  );

  // Favorite interaction with verified feedback toast
  const handleToggleFavorite = React.useCallback(
    async (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const existing = (library.movies || []).find((m) => (m.tmdb_id || m.id) === id);
      const willBeFav = !existing?.is_favorite;
      const res = await library.toggleFavorite(existing || movie);
      if (res.ok) {
        setToastMessage(
          willBeFav
            ? `Added "${movie.title}" to Favorites`
            : `Removed "${movie.title}" from Favorites`
        );
      }
    },
    [library]
  );

  // Watched & Personal Rating toggle workflow:
  // If already watched, clicking Eye immediately toggles Watched off -> Watchlist.
  // If not watched yet, opens Rating Modal (allowing rating or skip).
  const handleToggleWatchedIcon = React.useCallback(
    async (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const existing = (library.movies || []).find((m) => (m.tmdb_id || m.id) === id);
      if (existing?.status === "watched") {
        const res = await library.updateStatus(id, "want");
        if (res.ok) {
          setToastMessage(`Removed "${movie.title}" from Watched`);
        }
        return;
      }
      setRatingModalMovie(existing ? { ...movie, ...existing } : movie);
      setIsRatingModalOpen(true);
    },
    [library]
  );

  const handleUnmarkWatched = React.useCallback(
    async (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      setIsRatingModalOpen(false);
      const res = await library.updateStatus(id, "want");
      if (res.ok) {
        setToastMessage(`Removed "${movie.title}" from Watched`);
      }
    },
    [library]
  );

  const handleSaveRating = React.useCallback(
    async (movie: Movie, rating?: number, review?: string) => {
      setIsRatingModalOpen(false);
      const res = await library.markWatched(movie, rating, review);
      if (res.ok) {
        setToastMessage(
          rating
            ? `Screening logged for "${movie.title}" • Rated ${rating.toFixed(1)}/10`
            : `Marked "${movie.title}" as Watched`
        );
      }
    },
    [library]
  );

  const handleSkipRating = React.useCallback(
    async (movie: Movie) => {
      setIsRatingModalOpen(false);
      const res = await library.markWatched(movie, undefined);
      if (res.ok) {
        setToastMessage(`Marked "${movie.title}" as Watched`);
      }
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
      {/* 1. CINEMA SPOTLIGHT HERO BANNER (Full-Bleed, Multi-Film Carousel) */}
      <CinemaSpotlightHero
        movie={spotlightMovie}
        movies={spotlightCandidates}
        currentIndex={activeIndex}
        onSelectIndex={(idx) => setSpotlightIndex(idx)}
        onNextMovie={() =>
          setSpotlightIndex((prev) => (prev + 1) % spotlightCandidates.length)
        }
        onPrevMovie={() =>
          setSpotlightIndex(
            (prev) => (prev - 1 + spotlightCandidates.length) % spotlightCandidates.length
          )
        }
        mode={spotlightMode}
        greeting={timeGreeting}
        userName={greetingName}
        isWatchlist={isSpotlightInWatchlist}
        isWatched={isSpotlightWatched}
        isFavorite={isSpotlightFavorite}
        userRating={spotlightUserRating}
        onOpenDetail={handleOpenDetail}
        onToggleWatchlist={handleToggleWatchlist}
        onMarkWatchedRequest={handleToggleWatchedIcon}
        onToggleFavorite={handleToggleFavorite}
        onDiscoverMore={handleDiscoverMore}
      />

      {/* 2. DISCOVERY & PERSONAL CINEMA SECTIONS */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32 pt-4 sm:pt-6 space-y-9 sm:space-y-12 select-none relative z-20">
        {/* Always first below Spotlight: Discovery Showcase */}
        <YourNextGreatWatchSection
          onOpenDetail={handleOpenDetail}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleToggleWatchedIcon}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Personal Section 1: Recently Added (shown only when saved movies exist) */}
        {(dashboardState === "saved_only" || dashboardState === "established") && (
          <RecentlyAddedSection
            movies={savedMovies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatchedIcon}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Personal Section 2: Recently Watched (shown only when watched records exist) */}
        {(dashboardState === "watched_only" || dashboardState === "established") && (
          <RecentlyWatchedSection
            movies={watchedMovies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatchedIcon}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Personal Section 3: Because You Watched (derived from real watched history) */}
        {(dashboardState === "watched_only" || dashboardState === "established") && (
          <BecauseYouWatchedSection
            movies={library.movies}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatchedIcon}
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
        onUnmarkWatched={handleUnmarkWatched}
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
