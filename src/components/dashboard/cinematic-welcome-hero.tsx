"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, TrendingUp, Sparkles, Bookmark, Eye, Film } from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";

interface CinematicWelcomeHeroProps {
  userName?: string;
  greeting?: string;
  onExploreTrending?: () => void;
}

const DEFAULT_ATMOSPHERIC_BACKDROP = "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg"; // Dune: Part Two cinematic desert night

export function CinematicWelcomeHero({
  userName = "Cinephile",
  greeting = "Good evening",
  onExploreTrending,
}: CinematicWelcomeHeroProps) {
  const [backdropUrl, setBackdropUrl] = React.useState<string | null>(null);

  // Fetch top trending backdrop for dynamic, alive cinematic atmosphere
  React.useEffect(() => {
    let cancelled = false;
    const loadHeroAtmosphere = async () => {
      try {
        const res = await tmdbFetch({ action: "trending", time_window: "week" });
        if (cancelled) return;
        const topBackdrop = res.results?.find((m) => Boolean(m.backdrop_path))?.backdrop_path;
        if (topBackdrop) {
          setBackdropUrl(
            `/api/image?path=${encodeURIComponent(
              topBackdrop.startsWith("/") ? topBackdrop : `/${topBackdrop}`
            )}&w=original`
          );
        } else {
          setBackdropUrl(
            `/api/image?path=${encodeURIComponent(DEFAULT_ATMOSPHERIC_BACKDROP)}&w=original`
          );
        }
      } catch {
        if (!cancelled) {
          setBackdropUrl(
            `/api/image?path=${encodeURIComponent(DEFAULT_ATMOSPHERIC_BACKDROP)}&w=original`
          );
        }
      }
    };
    loadHeroAtmosphere();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTrendingClick = () => {
    if (onExploreTrending) {
      onExploreTrending();
    } else {
      const el = document.getElementById("section-trending-now");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const displayName =
    !userName || userName.toLowerCase().includes("guest") ? "CINEPHILE" : userName.toUpperCase();

  return (
    <section
      id="section-welcome-hero"
      aria-label="Welcome to Cineaste"
      className="relative w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[62vh] lg:max-h-[78vh] flex flex-col justify-end overflow-hidden select-none"
    >
      {/* ── Atmospheric Backdrop Image with Multi-Layer Gradients ── */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={backdropUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center scale-[1.03] transition-all duration-1000 ease-out filter brightness-[0.72] contrast-[1.08] saturate-[1.12]"
            onError={() => {
              setBackdropUrl(`https://image.tmdb.org/t/p/original${DEFAULT_ATMOSPHERIC_BACKDROP}`);
            }}
          />
        </div>
      )}

      {/* ── Cinematic Shadow Overlays (Preserve text contrast & seamless blend with content) ── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/75 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0A0B0F] via-[#0A0B0F]/80 to-transparent max-w-4xl" />
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 z-10 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Subtle radial emerald ambient glow in bottom-left */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[350px] bg-[#00D664]/10 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* ── Content Container ── */}
      <div className="relative z-20 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-10 sm:pb-14 pt-28 sm:pt-36">
        <div className="max-w-3xl space-y-4 sm:space-y-5">
          {/* Badge & Greeting */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D664]/10 border border-[#00D664]/30 text-[#00D664] text-[11px] font-mono uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              {greeting}, {displayName} &bull; Personal Cinema Vault
            </span>
          </div>

          {/* Main Editorial Heading */}
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08]">
            Your Personal Cinema Starts Here.
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base md:text-lg text-[#A0A2B0] font-normal leading-relaxed max-w-2xl">
            Discover films worth remembering. Build your watchlist, track what you watch and create
            your own movie universe.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Action: Discover Movies */}
            <Link
              href="/discover"
              className="h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#00D664] hover:bg-[#00B855] text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2.5 shadow-lg shadow-[#00D664]/25 hover:shadow-[#00D664]/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <Compass className="w-4 h-4 stroke-[2.5]" />
              <span>Discover Movies</span>
            </Link>

            {/* Secondary Action: Explore Trending */}
            <button
              type="button"
              onClick={handleTrendingClick}
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 text-white font-heading font-semibold text-xs sm:text-sm tracking-wider inline-flex items-center gap-2 transition active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              <TrendingUp className="w-4 h-4 text-[#00D664]" />
              <span>Explore Trending</span>
            </button>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#808394]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Bookmark className="w-3 h-3 text-[#00D664]" />
              <span>Curate Watchlist</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Eye className="w-3 h-3 text-[#00D664]" />
              <span>Track Screenings & Ratings</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Film className="w-3 h-3 text-[#00D664]" />
              <span>Personalized Recommendations</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
