"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Sparkles, Award, Compass } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WatchNextHero } from "@/components/dashboard/watch-next-hero";
import { CinematicWelcomeHero } from "@/components/dashboard/cinematic-welcome-hero";
import { RecentlyAddedSection } from "@/components/dashboard/recently-added-section";
import { RecentlyWatchedSection } from "@/components/dashboard/recently-watched-section";
import { BecauseYouWatchedSection } from "@/components/dashboard/because-you-watched-section";
import { GlobalMovieRail } from "@/components/dashboard/global-movie-rail";
import { useLibrary } from "@/lib/library-store";
import { useUser } from "@/lib/user-context";
import type { Movie } from "@/types";

/**
 * Cineaste Adaptive Personal Cinema Dashboard
 *
 * Automatically detects real user activity and adapts across 4 states:
 * - State A (Brand-new user): Zero saved/watched -> Cinematic Welcome Hero + 4 Global TMDB Recommendation Rails.
 * - State B (User has saved movies): Watch Next Hero + Recently Added + Global recommendations.
 * - State C (User has watched movies): Watch Next / Screened Hero + Recently Watched + Because You Watched + Discovery rails.
 * - State D (Established user): Full personalized Dashboard with personal library + targeted recommendations.
 */
function DashboardContent() {
  const router = useRouter();
  const library = useLibrary();
  const { user } = useUser();

  const handleOpenDetail = React.useCallback(
    (movie: Movie) => {
      router.push(`/movie/${movie.tmdb_id || movie.id}`);
    },
    [router]
  );

  // Time-of-day greeting (safely set after mount to prevent hydration mismatch)
  const [greeting, setGreeting] = React.useState("Good evening");
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const userName =
    user?.display_name && !user.display_name.toLowerCase().includes("guest")
      ? user.display_name
      : "Rahul";

  // Real database activity segments
  const savedMovies = React.useMemo(() => {
    return (library.movies || []).filter(
      (m) => m?.status === "want" || m?.status === "watching"
    );
  }, [library.movies]);

  const watchedMovies = React.useMemo(() => {
    return (library.movies || []).filter((m) => m?.status === "watched");
  }, [library.movies]);

  /**
   * Adaptive Dashboard State Detection:
   * A: Brand-new user (zero saved, zero watched)
   * B: User has saved movies, but no watched history yet
   * C: User has watched movies, emerging history
   * D: Established user (both saved and multiple watched films)
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

  // Featured movie strictly derived from real user records
  const featuredMovie = React.useMemo(() => {
    if (dashboardState === "new_user") return null;

    if (savedMovies.length > 0) {
      // Prioritize currently watching
      const watching = savedMovies.find((m) => m?.status === "watching");
      if (watching) return watching;

      // Prioritize favorite watchlist items
      const fav = savedMovies.find((m) => m?.is_favorite);
      if (fav) return fav;

      return savedMovies[0];
    }

    if (watchedMovies.length > 0) {
      // For watched-only state: feature top-rated or most recently screened film
      const highestRated = [...watchedMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      return highestRated || watchedMovies[0];
    }

    return null;
  }, [dashboardState, savedMovies, watchedMovies]);

  const handleOpenQuickAdd = React.useCallback(() => {
    window.dispatchEvent(new Event("open-quick-add"));
  }, []);

  const handleToggleWatchlist = React.useCallback(
    (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      const isSaved = (library.movies || []).some((m) => (m.tmdb_id || m.id) === id);
      if (isSaved) {
        library.removeFromWatchlist(id);
      } else {
        library.addToWatchlist(movie);
      }
    },
    [library]
  );

  const handleToggleWatched = React.useCallback(
    (movie: Movie) => {
      const id = movie.tmdb_id || movie.id;
      if (movie.status === "watched") {
        library.updateStatus(id, "want");
      } else {
        library.markWatched(movie, typeof movie.rating === "number" ? movie.rating : 8);
      }
    },
    [library]
  );

  const handleExploreTrending = React.useCallback(() => {
    const el = document.getElementById("section-trending-now");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/discover?filter=trending");
    }
  }, [router]);

  return (
    <AppShell>
      {/* ================================================================= */}
      {/* 1. HERO REGION: WELCOME HERO (State A) or WATCH NEXT HERO (B, C, D) */}
      {/* ================================================================= */}
      {dashboardState === "new_user" ? (
        <CinematicWelcomeHero
          userName={userName}
          greeting={greeting}
          onExploreTrending={handleExploreTrending}
        />
      ) : (
        <WatchNextHero
          movie={featuredMovie}
          greeting={greeting}
          userName={userName}
          onOpenDetail={handleOpenDetail}
          onWatch={(m) => library.markWatched(m, 8)}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleFavorite={library.toggleFavorite}
          onRemoveFromWatchlist={(id) => library.removeFromWatchlist(id)}
          onOpenQuickAdd={handleOpenQuickAdd}
        />
      )}

      {/* ================================================================= */}
      {/* 2. ADAPTIVE CONTENT SECTIONS BELOW HERO (Snug layout, no voids)  */}
      {/* ================================================================= */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32 pt-3 sm:pt-5 -mt-3 sm:-mt-5 space-y-8 sm:space-y-10 select-none relative z-20">
        {/* ── STATE A: BRAND-NEW USER (Global Recommendations Only, No Empty Boxes) ── */}
        {dashboardState === "new_user" && (
          <>
            <GlobalMovieRail
              id="section-trending-now"
              title="Trending Now"
              subtitle="What audiences and cinephiles are watching worldwide today"
              icon={TrendingUp}
              index="01"
              fetchPayload={{ action: "trending", time_window: "week" }}
              viewAllHref="/discover?filter=trending"
              viewAllText="Explore Trending"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-popular-picks"
              title="Popular Picks"
              subtitle="Most sought-after cinema and blockbuster hits across genres"
              icon={Sparkles}
              index="02"
              fetchPayload={{ action: "popular" }}
              viewAllHref="/discover?sort=popularity.desc"
              viewAllText="View Popular"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-critically-acclaimed"
              title="Critically Acclaimed"
              subtitle="Highest-rated masterpieces celebrated by critics and festivals"
              icon={Award}
              index="03"
              fetchPayload={{ action: "top_rated" }}
              viewAllHref="/discover?sort=vote_average.desc"
              viewAllText="View Acclaimed"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-hidden-gems"
              title="Hidden Gems"
              subtitle="Under-the-radar cinematic treasures and festival discoveries"
              icon={Compass}
              index="04"
              fetchPayload={{ action: "ai_search", query: "festival indie gems mystery drama" }}
              viewAllHref="/discover"
              viewAllText="Explore Gems"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}

        {/* ── STATE B: USER HAS SAVED MOVIES (Saved Movies + Emerging Discovery) ── */}
        {dashboardState === "saved_only" && (
          <>
            <RecentlyAddedSection
              movies={savedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-trending-now"
              title="Trending Now"
              subtitle="Keep exploring what is capturing audiences worldwide"
              icon={TrendingUp}
              index="01"
              fetchPayload={{ action: "trending", time_window: "week" }}
              viewAllHref="/discover?filter=trending"
              viewAllText="Explore Trending"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-popular-picks"
              title="Popular Picks"
              subtitle="Highly anticipated releases to expand your watchlist"
              icon={Sparkles}
              index="02"
              fetchPayload={{ action: "popular" }}
              viewAllHref="/discover?sort=popularity.desc"
              viewAllText="View Popular"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-critically-acclaimed"
              title="Critically Acclaimed"
              subtitle="Timeless cinema to enrich your watchlist"
              icon={Award}
              index="03"
              fetchPayload={{ action: "top_rated" }}
              viewAllHref="/discover?sort=vote_average.desc"
              viewAllText="View Acclaimed"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}

        {/* ── STATE C: USER HAS WATCHED MOVIES (Watched History + Because You Watched + Discovery) ── */}
        {dashboardState === "watched_only" && (
          <>
            <RecentlyWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <BecauseYouWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-trending-now"
              title="Trending Now"
              subtitle="Discover more films to log in your screened history"
              icon={TrendingUp}
              index="01"
              fetchPayload={{ action: "trending", time_window: "week" }}
              viewAllHref="/discover?filter=trending"
              viewAllText="Explore Trending"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-hidden-gems"
              title="Hidden Gems"
              subtitle="Under-the-radar cinematic treasures and festival discoveries"
              icon={Compass}
              index="02"
              fetchPayload={{ action: "ai_search", query: "festival indie gems mystery drama" }}
              viewAllHref="/discover"
              viewAllText="Explore Gems"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}

        {/* ── STATE D: ESTABLISHED USER (Full Personalized Experience) ── */}
        {dashboardState === "established" && (
          <>
            <RecentlyAddedSection
              movies={savedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <RecentlyWatchedSection
              movies={watchedMovies}
              onOpenDetail={handleOpenDetail}
              onOpenQuickAdd={handleOpenQuickAdd}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <BecauseYouWatchedSection
              movies={library.movies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />

            <GlobalMovieRail
              id="section-trending-now"
              title="Trending Now"
              subtitle="Continuous cinema discovery to expand your universe"
              icon={TrendingUp}
              index="04"
              fetchPayload={{ action: "trending", time_window: "week" }}
              viewAllHref="/discover?filter=trending"
              viewAllText="Explore Trending"
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onToggleFavorite={library.toggleFavorite}
            />
          </>
        )}
      </div>
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
