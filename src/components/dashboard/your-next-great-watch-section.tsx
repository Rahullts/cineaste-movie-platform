"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Award,
  Compass,
  ArrowRight,
  Flame,
} from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

interface YourNextGreatWatchSectionProps {
  onOpenDetail: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
}

type CategoryKey = "trending" | "acclaimed" | "gems" | "popular";

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  payload: Record<string, any>;
  viewAllHref: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "trending",
    label: "Trending Now",
    icon: Flame,
    payload: { action: "trending", time_window: "week" },
    viewAllHref: "/discover?filter=trending",
  },
  {
    key: "acclaimed",
    label: "Critically Acclaimed",
    icon: Award,
    payload: { action: "top_rated" },
    viewAllHref: "/discover?sort=vote_average.desc",
  },
  {
    key: "gems",
    label: "Hidden Gems",
    icon: Compass,
    payload: { action: "ai_search", query: "festival indie gems mystery drama" },
    viewAllHref: "/discover",
  },
  {
    key: "popular",
    label: "Popular in Cinema",
    icon: Sparkles,
    payload: { action: "popular" },
    viewAllHref: "/discover?sort=popularity.desc",
  },
];

export function YourNextGreatWatchSection({
  onOpenDetail,
  onToggleWatchlist,
  onToggleWatched,
  onToggleFavorite,
}: YourNextGreatWatchSectionProps) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>("trending");

  // In-memory cache per category to provide instantaneous tab switching
  const [cache, setCache] = React.useState<Record<CategoryKey, Movie[]>>({
    trending: [],
    acclaimed: [],
    gems: [],
    popular: [],
  });
  const [loadingMap, setLoadingMap] = React.useState<Record<CategoryKey, boolean>>({
    trending: false,
    acclaimed: false,
    gems: false,
    popular: false,
  });

  const activeConfig = CATEGORIES.find((c) => c.key === activeCategory) || CATEGORIES[0];
  const activeMovies = cache[activeCategory] || [];
  const isLoading = loadingMap[activeCategory];

  // Fetch movies for category if not already in cache
  React.useEffect(() => {
    let cancelled = false;

    if (cache[activeCategory].length > 0) return;

    setLoadingMap((prev) => ({ ...prev, [activeCategory]: true }));

    tmdbFetch(activeConfig.payload)
      .then((res) => {
        if (!cancelled && res.results && res.results.length > 0) {
          const valid = res.results.filter(
            (m) => Boolean(m.poster_path || m.backdrop_path)
          );
          setCache((prev) => ({ ...prev, [activeCategory]: valid.slice(0, 16) }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingMap((prev) => ({ ...prev, [activeCategory]: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeConfig]);

  // Pre-fetch other categories in background after initial render
  React.useEffect(() => {
    const prefetch = async () => {
      for (const cat of CATEGORIES) {
        if (cat.key !== "trending") {
          try {
            const res = await tmdbFetch(cat.payload);
            if (res.results && res.results.length > 0) {
              const valid = res.results.filter(
                (m) => Boolean(m.poster_path || m.backdrop_path)
              );
              setCache((prev) => ({
                ...prev,
                [cat.key]: prev[cat.key].length > 0 ? prev[cat.key] : valid.slice(0, 16),
              }));
            }
          } catch {}
        }
      }
    };
    const timer = setTimeout(prefetch, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="section-next-great-watch"
      aria-label="Your Next Great Watch"
      className="space-y-4 sm:space-y-5 w-full select-none"
    >
      {/* ── Section Header with Category Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#00D664] shrink-0" />
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              Your Next Great Watch
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A2B0] mt-1">
            Handpicked films worth adding to your cinema journey.
          </p>
        </div>

        <Link
          href={activeConfig.viewAllHref}
          className="text-xs text-[#A0A2B0] hover:text-[#00D664] font-medium transition inline-flex items-center gap-1 group self-start sm:self-auto shrink-0"
        >
          <span>View Catalog</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Compact Category Switcher Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === activeCategory;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={
                isActive
                  ? "h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#00D664]/15 border border-[#00D664]/40 text-[#00D664] font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
                  : "h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-heading font-medium text-xs tracking-wider inline-flex items-center gap-2 transition shrink-0 cursor-pointer"
              }
            >
              <Icon className={isActive ? "w-3.5 h-3.5 text-[#00D664]" : "w-3.5 h-3.5 text-white/50"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Visual Poster Carousel or Smooth Skeleton Loaders ── */}
      {isLoading && activeMovies.length === 0 ? (
        <div className="flex items-start gap-3.5 sm:gap-4 md:gap-5 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[140px] sm:w-[160px] md:w-[185px] shrink-0 space-y-2.5 animate-pulse"
            >
              <div className="w-full aspect-[2/3] rounded-2xl bg-white/5 border border-white/5" />
              <div className="h-3 w-4/5 rounded bg-white/5" />
              <div className="h-2.5 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <PosterCarousel>
          {activeMovies.map((movie, idx) => (
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
