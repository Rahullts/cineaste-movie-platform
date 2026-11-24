"use client";

import * as React from "react";
import Image from "next/image";
import {
  Bookmark,
  Check,
  Info,
  Star,
  Clock,
  Eye,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { formatYear, formatScore } from "@/lib/utils";
import type { Movie } from "@/types";

export interface CinemaSpotlightHeroProps {
  movie: Movie | null;
  mode?: "spotlight" | "watchlist" | "watched";
  isWatchlist?: boolean;
  onOpenDetail: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  onMarkWatchedRequest?: (movie: Movie) => void;
  onDiscoverMore?: () => void;
}

// Canonical cinema masterpiece for Spotlight fallback if TMDB has not loaded yet
const CANONICAL_SPOTLIGHT_MOVIE: Movie = {
  id: 693134,
  tmdb_id: 693134,
  title: "Dune: Part Two",
  release_date: "2024-03-01",
  vote_average: 8.2,
  runtime: 166,
  overview:
    "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
  backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg",
  poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  genres: ["Science Fiction", "Adventure"] as any,
  status: "want",
};

export function CinemaSpotlightHero({
  movie,
  mode = "spotlight",
  isWatchlist = false,
  onOpenDetail,
  onToggleWatchlist,
  onMarkWatchedRequest,
  onDiscoverMore,
}: CinemaSpotlightHeroProps) {
  const activeMovie = movie || CANONICAL_SPOTLIGHT_MOVIE;

  const [details, setDetails] = React.useState<any>(null);
  const [backdropFallbackIdx, setBackdropFallbackIdx] = React.useState(0);

  // Fetch enriched details from TMDB (tagline, high-res backdrop, runtime, genres)
  React.useEffect(() => {
    let cancelled = false;
    setBackdropFallbackIdx(0);
    setDetails(null);

    const tmdbId = activeMovie.tmdb_id || activeMovie.id;
    if (tmdbId) {
      tmdbFetch({ action: "details", id: tmdbId })
        .then((res: any) => {
          if (!cancelled && res && (res.backdrop_path || res.title)) {
            setDetails(res);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [activeMovie.tmdb_id, activeMovie.id]);

  const rawBackdrop = details?.backdrop_path || activeMovie.backdrop_path;
  const candidateBackdrops = React.useMemo(() => {
    const list: string[] = [];
    if (rawBackdrop) {
      const cleanB = rawBackdrop.startsWith("/") ? rawBackdrop : `/${rawBackdrop}`;
      list.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=original`);
      list.push(`https://image.tmdb.org/t/p/original${cleanB}`);
      list.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=1280`);
      list.push(`https://image.tmdb.org/t/p/w1280${cleanB}`);
    }
    return list;
  }, [rawBackdrop]);

  const activeBackdropUrl = candidateBackdrops[backdropFallbackIdx] || candidateBackdrops[0] || null;

  const title = details?.title || activeMovie.title;
  const tagline = details?.tagline || (activeMovie as any)?.tagline || null;
  const releaseYear = formatYear(details?.release_date || activeMovie.release_date);
  const runtimeMin = details?.runtime || activeMovie.runtime || null;
  const runtimeDisplay = runtimeMin
    ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60 > 0 ? `${runtimeMin % 60}m` : ""}`.trim()
    : null;

  const genresList: string[] = React.useMemo(() => {
    if (details?.genres && Array.isArray(details.genres)) {
      return details.genres
        .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
        .filter(Boolean);
    }
    if (activeMovie.genres && Array.isArray(activeMovie.genres)) {
      return activeMovie.genres
        .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
        .filter(Boolean);
    }
    return ["Cinema"];
  }, [details, activeMovie]);

  const rawScore = details?.vote_average ?? activeMovie.vote_average;
  const externalRating =
    typeof rawScore === "number" && rawScore > 0 ? formatScore(rawScore) : null;
  const userRating = typeof activeMovie.rating === "number" ? activeMovie.rating : null;
  const overview = details?.overview || activeMovie.overview || "";

  const handleScrollDown = () => {
    if (onDiscoverMore) {
      onDiscoverMore();
    } else {
      const el = document.getElementById("section-next-great-watch");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Label derivation
  const spotlightLabel =
    mode === "watchlist"
      ? "YOUR NEXT SCREENING"
      : mode === "watched"
      ? "RECENTLY SCREENED"
      : "CINEASTE PRESENTS";

  return (
    <section
      id="section-cinema-spotlight"
      aria-label="Cinema Spotlight"
      className="relative w-full min-h-[540px] sm:min-h-[600px] lg:min-h-[68vh] lg:max-h-[82vh] flex flex-col justify-end overflow-hidden select-none bg-[#0A0B0F]"
    >
      {/* ── High-Res Artwork: Aligned rightwards to keep subject clearly visible ── */}
      {activeBackdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={activeBackdropUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-[center_right] lg:object-[75%_center] scale-[1.02] filter brightness-[0.78] contrast-[1.08] saturate-[1.15] transition-opacity duration-1000 ease-out"
            onError={() => {
              if (backdropFallbackIdx < candidateBackdrops.length - 1) {
                setBackdropFallbackIdx((prev) => prev + 1);
              }
            }}
          />
        </div>
      )}

      {/* ── Deep Cinematic Gradient Masks ── */}
      {/* Left-to-right mask: solid dark on left for text readability, clears out towards right */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0A0B0F] via-[#0A0B0F]/85 sm:via-[#0A0B0F]/75 to-transparent to-75% sm:to-65% pointer-events-none" />

      {/* Bottom-to-top mask: blends seamlessly into dark content area */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/60 via-35% to-transparent pointer-events-none" />

      {/* Top subtle vignette for navigation readability */}
      <div className="absolute top-0 inset-x-0 h-32 sm:h-40 z-10 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none" />

      {/* Subtle emerald atmospheric aura in lower-left */}
      <div className="absolute bottom-0 left-0 w-[550px] h-[380px] bg-[#00D664]/10 rounded-full blur-[130px] pointer-events-none z-10" />

      {/* ── Content Container: Left-Aligned Editorial Hierarchy ── */}
      <div className="relative z-20 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-10 sm:pb-14 pt-28 sm:pt-36 flex flex-col justify-end">
        <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-4.5">
          {/* Label Badge */}
          <div className="inline-flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.28em] uppercase text-[#00D664] bg-[#00D664]/10 border border-[#00D664]/30 px-3 py-1 rounded-full shadow-sm">
              {spotlightLabel}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.06] text-balance drop-shadow-md">
            {title}
          </h1>

          {/* Optional Tagline */}
          {tagline && (
            <p className="text-xs sm:text-sm md:text-base italic text-white/80 font-medium tracking-wide">
              &ldquo;{tagline}&rdquo;
            </p>
          )}

          {/* Metadata & Scores Ribbon */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#A0A2B0]">
            {releaseYear && (
              <span className="font-mono text-white/90 font-semibold">{releaseYear}</span>
            )}

            {runtimeDisplay && (
              <>
                <span className="text-white/30">&bull;</span>
                <span className="inline-flex items-center gap-1 font-mono text-white/90">
                  <Clock className="w-3.5 h-3.5 text-white/50" />
                  <span>{runtimeDisplay}</span>
                </span>
              </>
            )}

            {genresList.length > 0 && (
              <>
                <span className="text-white/30">&bull;</span>
                <span className="text-white/80">{genresList.slice(0, 3).join(", ")}</span>
              </>
            )}

            {/* External Rating (Clearly Labeled as TMDB) */}
            {externalRating && (
              <>
                <span className="text-white/30">&bull;</span>
                <span
                  title="Global TMDB Community Rating"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[#FBBF24] font-mono font-bold text-xs shadow-sm"
                >
                  <Star className="w-3 h-3 fill-[#FBBF24] stroke-none" />
                  <span>TMDB {externalRating}</span>
                </span>
              </>
            )}

            {/* User Personal Cineaste Rating (Distinctly Separated) */}
            {userRating !== null && (
              <>
                <span className="text-white/30">&bull;</span>
                <span
                  title="Your Personal Screening Rating"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#00D664]/15 border border-[#00D664]/30 text-[#00D664] font-mono font-bold text-xs"
                >
                  <Star className="w-3 h-3 fill-[#00D664] stroke-none" />
                  <span>Your Rating: {userRating}/10</span>
                </span>
              </>
            )}
          </div>

          {/* Short Overview */}
          {overview && (
            <p className="text-xs sm:text-sm md:text-base text-[#B0B3C2] font-normal leading-relaxed line-clamp-3 max-w-2xl text-pretty drop-shadow-sm">
              {overview}
            </p>
          )}

          {/* Action Buttons Row */}
          <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Action: Watchlist Interaction */}
            <button
              type="button"
              onClick={() => onToggleWatchlist(activeMovie)}
              className={
                isWatchlist
                  ? "h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#00D664]/15 hover:bg-[#00D664]/25 border border-[#00D664]/50 text-[#00D664] font-heading font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-sm transition active:scale-[0.98] cursor-pointer"
                  : "h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#00D664] hover:bg-[#00B855] text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-[#00D664]/25 hover:shadow-[#00D664]/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
              }
            >
              {isWatchlist ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 fill-black stroke-black" />
                  <span>+ Add to Watchlist</span>
                </>
              )}
            </button>

            {/* Secondary Action: Explore Movie */}
            <button
              type="button"
              onClick={() => onOpenDetail(activeMovie)}
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 text-white font-heading font-semibold text-xs sm:text-sm tracking-wider inline-flex items-center gap-2 transition active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              <Info className="w-4 h-4" />
              <span>Explore Movie</span>
            </button>

            {/* Optional Screening Action (If user is viewing a watchlist film) */}
            {onMarkWatchedRequest && isWatchlist && (
              <button
                type="button"
                onClick={() => onMarkWatchedRequest(activeMovie)}
                className="h-11 sm:h-12 px-4 sm:px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#00D664]" />
                <span>Mark Watched</span>
              </button>
            )}

            {/* Subtle Discover More Action */}
            <button
              type="button"
              onClick={handleScrollDown}
              className="hidden md:inline-flex items-center gap-1.5 ml-2 text-xs text-[#A0A2B0] hover:text-[#00D664] font-medium transition cursor-pointer py-2"
            >
              <span>Discover More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
