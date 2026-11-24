"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie } from "@/types";

interface DiscoverHeroProps {
  searchSlot: React.ReactNode;
  featuredMovies?: Movie[];
  showCarousel?: boolean;
}

/**
 * Unified Cineaste Discover Hero Section
 * Combines Discover heading, subtitle, search controls and large cinematic featured carousel into ONE cohesive hero.
 */
export function DiscoverHero({
  searchSlot,
  featuredMovies = [],
  showCarousel = true,
}: DiscoverHeroProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  const featured = React.useMemo(
    () => featuredMovies.filter((m) => !!m.backdrop_path).slice(0, 5),
    [featuredMovies]
  );

  // Auto-rotation every 7 seconds
  React.useEffect(() => {
    if (!showCarousel || featured.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length, showCarousel]);

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

  const current = featured[activeIdx];
  const backdropUrl = getTmdbImageUrl(current?.backdrop_path, "w1280");

  return (
    <section className="relative w-full space-y-8">
      {/* 1. Centered Header & Search */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-4 sm:pt-6 max-w-3xl mx-auto">
        {/* Cineaste Logo Brand Pill */}
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00D878] to-[#009E47] grid place-items-center shadow-md">
            <span className="font-heading font-black text-black text-xs">C</span>
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#9496A1] uppercase">
            Cineaste
          </span>
        </div>

        {/* Discover Heading */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F3F4F6] text-balance">
          Discover
        </h1>

        {/* Original Subtitle */}
        <p className="font-heading text-base sm:text-lg text-[#F3F4F6]/80 mt-2 text-balance">
          Find something worth watching.
        </p>

        <p className="text-sm text-[#9496A1] mt-1.5 max-w-md text-balance">
          Explore films, people and stories beyond your watchlist.
        </p>

        {/* Centered Search Controls */}
        <div className="w-full max-w-2xl mt-6">
          {searchSlot}
        </div>
      </div>

      {/* 2. Integrated Featured Movie Carousel (Large Cinematic Artwork) */}
      {showCarousel && current && backdropUrl && (
        <div className="relative w-full rounded-3xl overflow-hidden border border-[#1E1F2A]/60 shadow-2xl shadow-black/60 group/carousel bg-[#101118]">
          <Link
            href={`/movie/${current.tmdb_id}`}
            className="block relative w-full h-[340px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden"
          >
            {/* Backdrop Artwork */}
            <div className="absolute inset-0">
              <Image
                key={current.tmdb_id}
                src={backdropUrl}
                alt={current.title}
                fill
                sizes="100vw"
                priority
                className="object-cover object-center scale-105 group-hover/carousel:scale-110 transition-transform duration-1000 ease-out"
              />
            </div>

            {/* Dark Cinematic Vignettes for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/90 via-[#0A0B0F]/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

            {/* Movie Information Aligned Neatly to Lower-Left */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10 flex flex-col justify-end gap-3 max-w-3xl">
              {/* Rating & Release Year */}
              <div className="flex items-center gap-2.5 text-xs">
                {current.vote_average !== undefined && current.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md text-[#FBBF24] font-medium tabular-nums px-2 py-0.5 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-white font-semibold">
                      {formatScore(current.vote_average)}
                    </span>
                  </span>
                )}
                {current.release_date && (
                  <span className="text-white/80 font-medium">
                    {formatYear(current.release_date)}
                  </span>
                )}
                <span className="text-white/40">·</span>
                <span className="text-[#00D878] font-medium">Featured</span>
              </div>

              {/* Title */}
              <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight group-hover/carousel:text-[#00D878] transition-colors">
                {current.title}
              </h2>

              {/* Overview */}
              {current.overview && (
                <p className="text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-3 max-w-xl leading-relaxed">
                  {current.overview}
                </p>
              )}

              {/* Explore Action CTA */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00D878] text-black font-semibold text-xs hover:bg-[#00B855] transition shadow-lg shadow-[#00D878]/20 group-hover/carousel:scale-105">
                  <span>Explore film</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* Previous / Next Arrow Controls */}
          {featured.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="hidden sm:grid absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition hover:bg-[#00D878] hover:text-black hover:scale-105"
                aria-label="Previous featured movie"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="hidden sm:grid absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition hover:bg-[#00D878] hover:text-black hover:scale-105"
                aria-label="Next featured movie"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Carousel Pagination Indicators (Bottom-Right) */}
          {featured.length > 1 && (
            <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex items-center gap-1.5 z-20">
              {featured.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-6 bg-[#00D878]"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
