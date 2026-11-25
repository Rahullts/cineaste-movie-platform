"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Award,
  Compass,
  ArrowRight,
  Flame,
  ChevronRight,
} from "lucide-react";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { tmdbFetch } from "@/lib/tmdb-service";
import { cn } from "@/lib/utils";
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  payload: Record<string, any>;
  viewAllHref: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "trending",
    label: "Trending Now",
    icon: Flame,
    payload: { action: "trending", window: "week", page: 1 },
    viewAllHref: "/discover?filter=trending",
  },
  {
    key: "acclaimed",
    label: "Critically Acclaimed",
    icon: Award,
    payload: { action: "discover", sort_by: "vote_average.desc", min_votes: 1500, page: 1 },
    viewAllHref: "/discover?sort=vote_average.desc",
  },
  {
    key: "gems",
    label: "Hidden Gems",
    icon: Compass,
    payload: { action: "discover", sort_by: "vote_average.desc", min_votes: 400, max_votes: 1600, page: 1 },
    viewAllHref: "/discover",
  },
  {
    key: "popular",
    label: "Popular Picks",
    icon: Sparkles,
    payload: { action: "discover", sort_by: "popularity.desc", page: 1 },
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
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [canScrollTabsRight, setCanScrollTabsRight] = React.useState(false);

  const checkTabsOverflow = React.useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollTabsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    checkTabsOverflow();
    window.addEventListener("resize", checkTabsOverflow);
    return () => window.removeEventListener("resize", checkTabsOverflow);
  }, [checkTabsOverflow]);

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

  // Fetch active category movies if not cached
  React.useEffect(() => {
    let cancelled = false;

    if (cache[activeCategory].length > 0) return;

    setLoadingMap((prev) => ({ ...prev, [activeCategory]: true }));

    tmdbFetch(activeConfig.payload)
      .then((res) => {
        if (!cancelled && res.results && res.results.length > 0) {
          // Strict portrait poster filter so 2:3 cards never show cropped landscape backdrops
          const valid = res.results.filter((m) => Boolean(m.poster_path));
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

  // Background pre-fetch of remaining tabs for instant switching
  React.useEffect(() => {
    const prefetch = async () => {
      for (const cat of CATEGORIES) {
        if (cat.key !== "trending") {
          try {
            const res = await tmdbFetch(cat.payload);
            if (res.results && res.results.length > 0) {
              const valid = res.results.filter((m) => Boolean(m.poster_path));
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
      className="space-y-3.5 sm:space-y-4 w-full select-none"
    >
      {/* Unified Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-[18px] h-[18px] text-[#00D664] shrink-0" strokeWidth={1.9} />
            <h2 className="font-heading text-lg sm:text-xl md:text-[1.375rem] font-semibold tracking-[-0.015em] leading-snug text-foreground">
              Your Next Great Watch
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-muted-foreground font-normal mt-0.5">
            Handpicked films worth adding to your cinema journey.
          </p>
        </div>

        <Link
          href={activeConfig.viewAllHref}
          className="text-xs text-muted-foreground hover:text-[#00D664] font-medium transition inline-flex items-center gap-1.5 group self-start sm:self-auto shrink-0"
        >
          <span>View Catalog</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.9] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Category Switcher Tabs (Wrapped on tablet/desktop, scrollable with cue on narrow mobile) */}
      <div className="relative">
        <div
          ref={tabsRef}
          onScroll={checkTabsOverflow}
          className="flex items-center sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar py-0.5 pr-8 sm:pr-0"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.key === activeCategory;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "h-8 sm:h-9 px-3.5 sm:px-4 rounded-full text-xs tracking-[-0.01em] inline-flex items-center gap-2 transition shrink-0 cursor-pointer border whitespace-nowrap",
                  isActive
                    ? "bg-[#00D664]/15 border-[#00D664]/40 text-[#00D664] font-semibold shadow-sm"
                    : "bg-card/80 hover:bg-muted border-border text-muted-foreground hover:text-foreground font-medium"
                )}
              >
                <Icon
                  className={cn("w-3.5 h-3.5", isActive ? "text-[#00D664]" : "text-muted-foreground")}
                  strokeWidth={1.85}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        {canScrollTabsRight && (
          <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/85 to-transparent flex items-center justify-end">
            <button
              type="button"
              aria-label="Scroll discovery categories right"
              onClick={() => tabsRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
              className="pointer-events-auto w-7 h-7 rounded-full bg-card border border-border text-foreground grid place-items-center shadow-md cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Poster Carousel or Matched Skeletons */}
      {isLoading && activeMovies.length === 0 ? (
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
        </div>
      ) : (
        <PosterCarousel>
          {activeMovies.map((movie, idx) => (
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
            />
          ))}
        </PosterCarousel>
      )}
    </section>
  );
}
