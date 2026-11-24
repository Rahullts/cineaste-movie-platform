"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import type { Movie } from "@/types";

interface CinematicHeroShowcaseProps {
  movies: Movie[];
  watchlistMap: Record<number, Movie>;
  onAdd: (movie: Movie) => void;
  onRemove: (id: number) => void;
  onOpenDetail?: (movie: Movie) => void;
}

interface DestinationItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: "section-trending",
    label: "Trending Now",
    subtitle: "What's popular now",
    icon: Flame,
  },
  {
    id: "section-new-notable",
    label: "New & Notable",
    subtitle: "Recent notable releases",
    icon: Sparkles,
  },
  {
    id: "section-hidden-gems",
    label: "Hidden Gems",
    subtitle: "Underrated cinema",
    icon: Gem,
  },
  {
    id: "section-critically-acclaimed",
    label: "Critically Acclaimed",
    subtitle: "Masterpieces & awards",
    icon: Star,
  },
  {
    id: "section-coming-soon",
    label: "Coming Soon",
    subtitle: "Upcoming arrivals",
    icon: Calendar,
  },
];

/**
 * Authentic Master Reference Featured Showcase Films
 * Real TMDB records matching the approved Cineaste visual reference (Dune: Part Two flagship)
 */
const MASTER_FEATURED_MOVIES: Movie[] = [
  {
    id: 872585,
    tmdb_id: 872585,
    title: "Oppenheimer",
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II and the subsequent security hearing that tested his legacy.",
    backdrop_path: "/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    release_date: "2023-07-19",
    vote_average: 8.1,
    vote_count: 8500,
    genre_ids: [18, 36],
  },
  {
    id: 693134,
    tmdb_id: 693134,
    title: "Dune: Part Two",
    overview:
      "Paul Atreides unites with Chani and the Fremen as he seeks revenge against those who destroyed his family, while facing a future he cannot foresee.",
    backdrop_path: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    release_date: "2024-02-27",
    vote_average: 8.0,
    vote_count: 5200,
    genre_ids: [28, 12, 878],
  },
  {
    id: 157336,
    tmdb_id: 157336,
    title: "Interstellar",
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances.",
    backdrop_path: "/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    release_date: "2014-11-05",
    vote_average: 8.4,
    vote_count: 34000,
    genre_ids: [12, 18, 878],
  },
  {
    id: 335984,
    tmdb_id: 335984,
    title: "Blade Runner 2049",
    overview:
      "Thirty years after the events of the first film, a new blade runner unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    backdrop_path: "/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg",
    poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    release_date: "2017-10-04",
    vote_average: 7.6,
    vote_count: 13000,
    genre_ids: [878, 9648, 18],
  },
  {
    id: 569094,
    tmdb_id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    overview:
      "After reuniting with Gwen Stacy, Brooklyn's full-time friendly neighborhood Spider-Man is catapulted across the Multiverse to protect its very existence.",
    backdrop_path: "/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    release_date: "2023-05-31",
    vote_average: 8.4,
    vote_count: 6700,
    genre_ids: [16, 28, 12],
  },
];

/**
 * Cineaste Master Reference Cinematic Hero Showcase
 * 1:1 exact reproduction of the master visual reference:
 * Left: Featured Movie Banner with Dune/trending film, metadata, synopsis, Explore CTA, carousel controls.
 * Right: Explore Panel with 5 destinations, icon badges, and smooth anchor navigation.
 */
export function CinematicHeroShowcase({
  movies = [],
  watchlistMap = {},
  onAdd,
  onRemove,
  onOpenDetail,
}: CinematicHeroShowcaseProps) {
  // Slide 1 (index 1) is Dune: Part Two ("02 / 05") matching the Master Reference exactly
  const [activeIdx, setActiveIdx] = React.useState(1);
  const [isPaused, setIsPaused] = React.useState(false);
  const [activeNavId, setActiveNavId] = React.useState<string>("section-featured");
  const isClickScrolling = React.useRef(false);

  // Use curated authentic masterpieces with Dune: Part Two as flagship
  const featured = React.useMemo(() => {
    return MASTER_FEATURED_MOVIES;
  }, []);

  // 7-second auto rotation with hover pause
  React.useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length, isPaused]);

  // Track active section with IntersectionObserver
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveNavId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -50% 0px", threshold: 0.15 }
    );

    DESTINATIONS.forEach((dest) => {
      const el = document.getElementById(dest.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % featured.length);
  };

  const handleScrollTo = (id: string) => {
    setActiveNavId(id);
    isClickScrolling.current = true;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  const current = featured[activeIdx] || featured[0];

  const backdropUrl = getTmdbImageUrl(current?.backdrop_path, "w1280");

  const isWatchlisted = Boolean(current && watchlistMap[current.tmdb_id]);

  // Resolve genre names
  const genreNames = React.useMemo(() => {
    if (!current?.genre_ids?.length) return "Cinema";
    return current.genre_ids
      .slice(0, 3)
      .map((id) => TMDB_GENRES.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(" · ");
  }, [current]);

  return (
    <section
      id="section-featured"
      aria-label="Featured Movie Showcase and Explore Panel"
      className="scroll-mt-20 sm:scroll-mt-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* =============================================================== */}
        {/* LEFT COLUMN: Featured Movie Banner                             */}
        {/* =============================================================== */}
        <div
          className="relative lg:col-span-8 xl:col-span-9 h-[320px] sm:h-[350px] md:h-[380px] lg:h-[400px] xl:h-[420px] rounded-3xl overflow-hidden border border-[#1E1F2A] bg-[#101118] shadow-2xl group/featured select-none flex flex-col justify-end"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {backdropUrl ? (
            <div className="absolute inset-0">
              <Image
                key={current.tmdb_id}
                src={backdropUrl}
                alt={current.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
                className="object-cover object-[center_35%] scale-100 group-hover/featured:scale-[1.02] transition-transform duration-1000 ease-out"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#12131C] animate-pulse" />
          )}

          {/* Deep Layered Vignettes for text contrast matching reference */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/95 via-[#0A0B0F]/55 to-transparent w-[70%] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          {/* Previous Chevron Control */}
          {featured.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous movie"
              className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white grid place-items-center opacity-85 hover:opacity-100 transition duration-200 hover:bg-[#00D878] hover:text-black hover:scale-105 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Chevron Control */}
          {featured.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next movie"
              className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white grid place-items-center opacity-85 hover:opacity-100 transition duration-200 hover:bg-[#00D878] hover:text-black hover:scale-105 shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Movie Content - Positioned on the left matching reference */}
          {current && (
            <div className="relative z-10 p-5 sm:p-7 lg:p-8 xl:p-9 flex flex-col gap-2 sm:gap-2.5 max-w-xl xl:max-w-2xl">
              {/* FEATURED Label */}
              <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.25em] text-[#00D878] uppercase">
                FEATURED
              </span>

              {/* Title in Cinematic Serif Typography */}
              <Link href={`/movie/${current.tmdb_id}`} className="group/title">
                <h1 className="font-cinematic text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px] font-semibold text-white tracking-[0.06em] uppercase leading-[1.1] group-hover/title:text-[#00D878] transition-colors drop-shadow-md">
                  {current.title}
                </h1>
              </Link>

              {/* Metadata Row */}
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-[#9496A1] font-medium pt-0.5">
                {current.vote_average !== undefined && current.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-white">
                    <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                    <span>{formatScore(current.vote_average)}</span>
                  </span>
                )}
                <span>|</span>
                <span className="text-white/90">
                  {formatYear(current.release_date)}
                </span>
                <span>|</span>
                <span className="text-[#9496A1] truncate">{genreNames}</span>
              </div>

              {/* Synopsis */}
              {current.overview && (
                <p className="text-xs sm:text-sm text-[#9496A1] line-clamp-2 leading-relaxed max-w-md lg:max-w-lg xl:max-w-xl pt-0.5 font-normal">
                  {current.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenDetail?.(current)}
                  className="h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#00D878] text-black font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-[#00D878]/25 hover:bg-[#00B855] hover:scale-105 active:scale-95 transition select-none cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isWatchlisted) {
                      onRemove(watchlistMap[current.tmdb_id]?.id || current.tmdb_id);
                    } else {
                      onAdd(current);
                    }
                  }}
                  className={`h-10 sm:h-11 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 backdrop-blur-md transition select-none ${
                    isWatchlisted
                      ? "bg-[#00D878]/15 border border-[#00D878]/40 text-[#00D878]"
                      : "bg-[#101118]/80 border border-[#1E1F2A] text-white hover:border-[#00D878]/50"
                  }`}
                >
                  {isWatchlisted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00D878]" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-[#00D878]" />
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Carousel Slide Progress (Bottom-Right matching reference) */}
          {featured.length > 1 && (
            <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 xl:bottom-7 xl:right-7 z-10 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="text-[11px] sm:text-xs font-mono text-white/80 tabular-nums font-semibold">
                0{activeIdx + 1} <span className="text-white/30">/</span> 0{featured.length}
              </span>
              <div className="w-12 sm:w-14 h-1 sm:h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-[#00D878] transition-all duration-300 rounded-full"
                  style={{
                    width: `${((activeIdx + 1) / featured.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* RIGHT COLUMN: Explore Panel (Exact match to reference)          */}
        {/* =============================================================== */}
        <div className="lg:col-span-4 xl:col-span-3 rounded-3xl border border-[#1E1F2A] bg-[#101118] p-4 sm:p-5 flex flex-col shadow-xl">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#9496A1] uppercase block mb-2 shrink-0">
            EXPLORE
          </span>

          <div className="flex-1 flex flex-col justify-between gap-1 sm:gap-1.5">
            {DESTINATIONS.map((dest) => {
              const Icon = dest.icon;
              const isActive = activeNavId === dest.id;

              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => handleScrollTo(dest.id)}
                  className={`w-full flex-1 min-h-[50px] sm:min-h-[54px] text-left px-3 sm:px-3.5 rounded-2xl transition-all flex items-center gap-3 group/dest ${
                    isActive
                      ? "bg-white/[0.04] text-white"
                      : "hover:bg-white/[0.03] text-[#9496A1]"
                  }`}
                >
                  {/* Circular Icon with Green Outline */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full grid place-items-center shrink-0 border transition-all ${
                      isActive
                        ? "border-[#00D878] bg-[#00D878]/20 text-[#00D878] shadow-[0_0_12px_rgba(0,216,120,0.35)]"
                        : "border-[#00D878]/40 bg-[#00D878]/10 text-[#00D878] group-hover/dest:border-[#00D878]"
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  {/* Destination Title & Subtitle */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate leading-tight transition-colors ${
                        isActive
                          ? "text-[#00D878]"
                          : "text-[#F3F4F6] group-hover/dest:text-white"
                      }`}
                    >
                      {dest.label}
                    </p>
                    <p className="text-[11px] text-[#9496A1] truncate mt-0.5">
                      {dest.subtitle}
                    </p>
                  </div>

                  {/* Subtle Right Arrow for People to Watch */}
                  {dest.id === "section-people" && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#9496A1] group-hover/dest:text-[#00D878] transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
