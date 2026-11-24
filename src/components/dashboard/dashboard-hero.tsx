"use client";

import * as React from "react";
import Image from "next/image";
import { Star, Play, Plus, Check, Info } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import type { Movie } from "@/types";

interface DashboardHeroProps {
  movies?: Movie[];
  watchlistMap?: Record<number, Movie>;
  onAdd?: (movie: Movie) => void;
  onRemove?: (id: number) => void;
  onOpenDetail?: (movie: Movie) => void;
}

interface FeaturedHeroItem {
  id: number;
  tmdb_id: number;
  title: string;
  stylizedTitle?: string;
  titleColor?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  format: string;
  indexTag: string; // e.g. "03 / 06"
}

// 6 Curated Authentic Masterpiece Films matching Image 1 Source of Truth
const FEATURED_HERO_ITEMS: FeaturedHeroItem[] = [
  {
    id: 1384216,
    tmdb_id: 1384216,
    title: "The Dog Stars",
    stylizedTitle: "T H E   D O G   S T A R S",
    overview:
      "A pilot survives a pandemic in an abandoned Colorado airpark with his dog and a gun-toting neighbor. When a mysterious transmission crackles through his Cessna's radio, hope sparks for a better life.",
    backdrop_path: "/3k7GzxOdLZkN3eZsuhLi2eRzkXO.jpg",
    poster_path: "/5O616X9vmRzQdB68PHzBewPittd.jpg",
    release_date: "2026-08-26",
    vote_average: 7.0,
    vote_count: 420,
    format: "MOVIE",
    indexTag: "01 / 06",
  },
  {
    id: 1283515,
    tmdb_id: 1283515,
    title: "Verity",
    stylizedTitle: "V E R I T Y",
    overview:
      "A struggling writer accepts the job of a lifetime: completing the remaining books of an injured author's successful series, only to uncover shocking revelations in an unpublished manuscript.",
    backdrop_path: "/cKetrF2dAnQ0AMV5i4BMOs41I5P.jpg",
    poster_path: "/rmaNMA1seHqpjtnYKzyynFAr1g8.jpg",
    release_date: "2026-09-30",
    vote_average: 6.6,
    vote_count: 512,
    format: "MOVIE",
    indexTag: "02 / 06",
  },
  {
    id: 1400940,
    tmdb_id: 1400940,
    title: "Clayface",
    stylizedTitle: "C L A Y F A C E",
    titleColor: "text-[#DC2626] drop-shadow-[0_4px_24px_rgba(220,38,38,0.55)]",
    overview:
      "Matt Hagen's meteoric rise from Gotham street kid to Hollywood leading man is tragically cut short when a local crime boss's actions leave him horribly disfigured. Abandoned by his team and with nothing left, Matt...",
    backdrop_path: "/xSDoxv4pHvs4xZjvTb0Iqg1A6ro.jpg",
    poster_path: "/9l1NuFjel2j89hiuiJbsxfblqjy.jpg",
    release_date: "2026-10-19",
    vote_average: 7.4,
    vote_count: 295,
    format: "MOVIE",
    indexTag: "03 / 06",
  },
  {
    id: 1507696,
    tmdb_id: 1507696,
    title: "Apocalypse Z: New World",
    stylizedTitle: "A P O C A L Y P S E   Z",
    overview:
      "A rabies-like virus ravages the planet, transforming people into hyper-aggressive creatures. A solitary man isolates himself with his cat, until food runs out and survival forces him outside.",
    backdrop_path: "/o3XwuDUj0n8qnK91p6q8LKfr6rj.jpg",
    poster_path: "/plu8tTviVZDO5jP7nzNXsDHLu8P.jpg",
    release_date: "2026-10-09",
    vote_average: 6.5,
    vote_count: 890,
    format: "MOVIE",
    indexTag: "04 / 06",
  },
  {
    id: 791523,
    tmdb_id: 791523,
    title: "Wildwood",
    stylizedTitle: "W I L D W O O D",
    overview:
      "Beyond Portland's city limits lies Wildwood. You are not supposed to go there. You are not even supposed to know it exists. But Prue McKeel must enter to rescue her kidnapped baby brother.",
    backdrop_path: "/sl5NJ1vtyhP9Vr88bB4blULsJYp.jpg",
    poster_path: "/snFM00mpNAfUzUtkdEW0uDEvXA0.jpg",
    release_date: "2026-10-19",
    vote_average: 8.7,
    vote_count: 1400,
    format: "MOVIE",
    indexTag: "05 / 06",
  },
  {
    id: 1003596,
    tmdb_id: 1003596,
    title: "Avengers: Doomsday",
    stylizedTitle: "A V E N G E R S :   D O O M S D A Y",
    overview:
      "Earth's Mightiest Heroes confront the supreme monarch of Latveria, Doctor Victor von Doom, in a battle across parallel timelines for the salvation of reality.",
    backdrop_path: "/rObL4of4eFA8yWaN9pRFo9aOVNi.jpg",
    poster_path: "/zHTxblqPcqRpA93ex2Hj0RdpVBs.jpg",
    release_date: "2026-12-16",
    vote_average: 8.2,
    vote_count: 3200,
    format: "MOVIE",
    indexTag: "06 / 06",
  },
];

export function DashboardHero({
  watchlistMap = {},
  onAdd,
  onRemove,
  onOpenDetail,
}: DashboardHeroProps) {
  // Start on index 2 (Slide 3: Clayface, "FEATURED 03 / 06") matching Image 1 exactly
  const [activeIdx, setActiveIdx] = React.useState(2);
  const [isPaused, setIsPaused] = React.useState(false);

  const current = FEATURED_HERO_ITEMS[activeIdx] || FEATURED_HERO_ITEMS[2];
  const isInWatchlist = Boolean(watchlistMap[current.tmdb_id]);

  // Convert current featured item to Movie type for watchlist/detail operations
  const currentMovie: Movie = React.useMemo(
    () => ({
      id: current.id,
      tmdb_id: current.tmdb_id,
      title: current.title,
      overview: current.overview,
      backdrop_path: current.backdrop_path,
      poster_path: current.poster_path,
      release_date: current.release_date,
      vote_average: current.vote_average,
      vote_count: current.vote_count,
    }),
    [current]
  );

  // 8-second auto rotation with hover pause
  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FEATURED_HERO_ITEMS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      onRemove?.(current.tmdb_id);
    } else {
      onAdd?.(currentMovie);
    }
  };

  const handlePlayClick = () => {
    onOpenDetail?.(currentMovie);
  };

  const backdropUrl = current.backdrop_path.startsWith("http")
    ? current.backdrop_path
    : `/api/image?path=${encodeURIComponent(current.backdrop_path)}&w=original`;

  return (
    <section
      aria-label="Featured Cinema Showcase"
      className="relative w-full overflow-hidden select-none bg-[#0A0B0F] group/hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container sizing: generous viewport proportion matching Image 1 */}
      <div className="relative w-full h-[520px] sm:h-[580px] md:h-[640px] lg:h-[700px] xl:h-[740px] flex flex-col justify-end pt-16 sm:pt-20">
        {/* Background Artwork Backdrop */}
        <div className="absolute inset-0 z-0">
          <Image
            key={current.tmdb_id}
            src={backdropUrl}
            alt={current.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[right_top] transition-all duration-1000 ease-out"
          />

          {/* Layered Vignettes for Image 1 Authentic Look */}
          {/* Left vignette for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F] via-[#0A0B0F]/75 via-45% to-transparent" />
          {/* Bottom vignette blending seamlessly into page content */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/70 to-transparent" />
          {/* Top subtle vignette */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0A0B0F]/50 via-[#0A0B0F]/15 to-transparent" />
        </div>

        {/* Content Container (Left-aligned, matching Image 1 proportions) */}
        <div className="relative z-10 w-full max-w-4xl px-6 sm:px-10 lg:px-14 pb-12 sm:pb-14 md:pb-16 space-y-3 sm:space-y-3.5">
          {/* Tag: FEATURED 03 / 06 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] sm:tracking-[0.28em] text-[#9CA3AF] uppercase">
              FEATURED &nbsp;{current.indexTag}
            </span>
          </div>

          {/* Title: CLAYFACE (Stylized All-Caps Tracked) */}
          <h1
            className={`font-heading font-black text-2xl sm:text-3xl md:text-5xl lg:text-6xl tracking-[0.14em] sm:tracking-[0.22em] md:tracking-[0.3em] uppercase transition-all duration-500 truncate ${
              current.titleColor || "text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            }`}
          >
            {current.stylizedTitle || current.title}
          </h1>

          {/* Metadata Row: ⭐ 7.4  •  2026  •  MOVIE */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#D1D5DB]">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="font-semibold text-white tabular-nums">
                {formatScore(current.vote_average)}
              </span>
            </div>
            <span className="text-[#6B7280]">•</span>
            <span className="text-white font-medium">{formatYear(current.release_date)}</span>
            <span className="text-[#6B7280]">•</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-[#9CA3AF] uppercase">
              {current.format}
            </span>
          </div>

          {/* Synopsis / Description */}
          <p className="text-xs sm:text-sm md:text-[15px] text-[#D1D5DB] leading-relaxed max-w-xl line-clamp-3 font-normal drop-shadow-sm">
            {current.overview}
          </p>

          {/* Action Buttons & Slide Dashes Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
            {/* Play Button */}
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label={`Play ${current.title}`}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-black/40 hover:border-white/40"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
              <span>Play</span>
            </button>

            {/* Quick Add / Watchlist Button */}
            <button
              type="button"
              onClick={handleToggleWatchlist}
              aria-label={isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
              title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-black/40 ${
                isInWatchlist
                  ? "bg-[#00D878]/20 border-[#00D878]/60 text-[#00D878] hover:bg-[#00D878]/30"
                  : "bg-white/10 hover:bg-white/20 border-white/20 text-white hover:border-white/40"
              }`}
            >
              {isInWatchlist ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

            {/* Detail Sheet Button */}
            <button
              type="button"
              onClick={() => onOpenDetail?.(currentMovie)}
              aria-label={`Details for ${current.title}`}
              title="Film Details"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-black/40 hover:border-white/40"
            >
              <Info className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Slide Dashes: — — — — — — (6 Dashes) */}
            <div className="flex items-center gap-1.5 ml-2 sm:ml-4">
              {FEATURED_HERO_ITEMS.map((item, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Slide ${idx + 1}: ${item.title}`}
                    className={`h-[3px] rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 sm:w-10 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        : "w-5 sm:w-6 bg-white/25 hover:bg-white/50"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
