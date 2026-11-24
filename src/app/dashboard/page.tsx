"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WatchNextHero } from "@/components/dashboard/watch-next-hero";
import { RecentlyAddedSection } from "@/components/dashboard/recently-added-section";
import { RecentlyWatchedSection } from "@/components/dashboard/recently-watched-section";
import { BecauseYouWatchedSection } from "@/components/dashboard/because-you-watched-section";
import { useLibrary } from "@/lib/library-store";
import { useUser } from "@/lib/user-context";
import type { Movie } from "@/types";

/**
 * Cineaste Personal Cinema Dashboard
 * 
 * 1. Full-Screen Cinematic Movie Hero (Watch Next queue priority with working high-res backdrop)
 * 2. Section 1: Recently Added (newest added from watchlist/library)
 * 3. Section 2: Recently Watched (newest watched with dates & ratings)
 * 4. Section 3: Because You Watched (recommendations based strictly on watched films)
 * 
 * Collections are completely removed from the Dashboard.
 */
function DashboardContent() {
  const router = useRouter();
  const library = useLibrary();
  const { user } = useUser();

  const handleOpenDetail = (movie: Movie) => {
    router.push(`/movie/${movie.tmdb_id || movie.id}`);
  };

  // Derive time-of-day greeting safely to prevent timezone-based hydration mismatch
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
      : "RAHUL TS";

  // Pick exactly ONE featured movie for the full-screen cinematic hero:
  // Strictly from the user's Watchlist ("watching" or "want").
  // Never fallback to a non-watchlist movie. If empty, returns null to show minimal invitation.
  const featuredMovie = React.useMemo(() => {
    if (!library.movies || library.movies.length === 0) return null;

    const watching = library.movies.find((m) => m?.status === "watching");
    if (watching) return watching;

    const favoriteWatchlist = library.movies.find(
      (m) => m?.status === "want" && m?.is_favorite
    );
    if (favoriteWatchlist) return favoriteWatchlist;

    const watchlist = library.movies.filter((m) => m?.status === "want");
    if (watchlist.length > 0) return watchlist[0];

    return null;
  }, [library.movies]);

  const handleOpenQuickAdd = () => {
    window.dispatchEvent(new Event("open-quick-add"));
  };

  const handleToggleWatchlist = (movie: Movie) => {
    const isSaved = library.movies.some(
      (m) => (m.tmdb_id || m.id) === (movie.tmdb_id || movie.id)
    );
    if (isSaved) {
      library.removeFromWatchlist(movie.tmdb_id || movie.id);
    } else {
      library.addToWatchlist(movie);
    }
  };

  const handleToggleWatched = (movie: Movie) => {
    if (movie.status === "watched") {
      library.updateStatus(movie.tmdb_id || movie.id, "want");
    } else {
      library.markWatched(movie, typeof movie.rating === "number" ? movie.rating : 8);
    }
  };

  return (
    <AppShell>
      {/* ================================================================= */}
      {/* FULL-BLEED CINEMATIC HERO — no surrounding padding, edge-to-edge  */}
      {/* ================================================================= */}
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

      {/* Content sections below the hero — smoothly accessible upon scroll (Snug layout, no dark voids) */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32 pt-3 sm:pt-5 -mt-3 sm:-mt-5 space-y-8 sm:space-y-10 select-none relative z-20">
        {/* SECTION 1: RECENTLY ADDED */}
        <RecentlyAddedSection
          movies={library.movies}
          onOpenDetail={handleOpenDetail}
          onOpenQuickAdd={handleOpenQuickAdd}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleToggleWatched}
          onToggleFavorite={library.toggleFavorite}
        />

        {/* SECTION 2: RECENTLY WATCHED */}
        <RecentlyWatchedSection
          movies={library.movies}
          onOpenDetail={handleOpenDetail}
          onOpenQuickAdd={handleOpenQuickAdd}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleToggleWatched}
          onToggleFavorite={library.toggleFavorite}
        />

        {/* SECTION 3: BECAUSE YOU WATCHED */}
        <BecauseYouWatchedSection
          movies={library.movies}
          onOpenDetail={handleOpenDetail}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleToggleWatched}
          onToggleFavorite={library.toggleFavorite}
        />
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