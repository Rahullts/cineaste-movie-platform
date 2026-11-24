"use client";

import * as React from "react";
import Link from "next/link";
import {
  Play,
  Bookmark,
  Info,
  Clock,
  Star,
  Plus,
  Compass,
  Heart,
} from "lucide-react";
import { formatScore, formatYear, cn } from "@/lib/utils";
import { tmdbFetch } from "@/lib/tmdb-service";
import type { Movie } from "@/types";

interface WatchNextHeroProps {
  movie: Movie | null;
  greeting?: string;
  userName?: string;
  onOpenDetail: (movie: Movie) => void;
  onWatch: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (tmdbId: number) => void;
  onOpenQuickAdd: () => void;
}

// Canonical Cineaste showcase film matching design reference (Image 1 - Fargo)
const DEFAULT_HERO_MOVIE: Movie = {
  id: 275,
  tmdb_id: 275,
  title: "Fargo",
  release_date: "1996-03-08",
  vote_average: 7.8,
  runtime: 98,
  overview:
    "Jerry Lundegaard is a small-town Minnesota car salesman deeply in debt and willing to do almost anything to get out. Police chief Marge Gunderson discovers a string of violent crimes as Jerry's schemes spiral out of control.",
  backdrop_path: "/747dgDfL5d8esobk7h4odaOFhUq.jpg",
  poster_path: "/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg",
  genres: ["Crime", "Drama", "Thriller"] as any,
  status: "want",
  is_favorite: false,
};

export function WatchNextHero({
  movie,
  greeting = "Good evening",
  userName = "Rahul",
  onOpenDetail,
  onWatch,
  onToggleWatchlist,
  onToggleFavorite,
  onRemoveFromWatchlist,
  onOpenQuickAdd,
}: WatchNextHeroProps) {
  // Use user's featured movie or default showcase (Fargo) to guarantee cinematic aesthetic
  const activeMovie = movie || DEFAULT_HERO_MOVIE;

  const [enriched, setEnriched] = React.useState<any>(null);
  const [fallbackIndex, setFallbackIndex] = React.useState(0);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Reset fallback sequence when target movie changes
  React.useEffect(() => {
    setFallbackIndex(0);
    setEnriched(null);
  }, [activeMovie?.tmdb_id, activeMovie?.id, activeMovie?.title]);

  // Fetch enriched details from TMDB (high-res backdrop, runtime, genres, synopsis)
  React.useEffect(() => {
    let cancelled = false;

    if (activeMovie?.tmdb_id || activeMovie?.title) {
      const fetchTarget = async () => {
        try {
          if (activeMovie.tmdb_id) {
            const detailRes: any = await tmdbFetch({
              action: "details",
              id: activeMovie.tmdb_id,
            });

            if (!cancelled && detailRes && (detailRes.backdrop_path || detailRes.poster_path)) {
              setEnriched(detailRes);
              return;
            }
          }

          if (activeMovie.title) {
            const searchRes = await tmdbFetch({
              action: "search",
              query: activeMovie.title,
              page: 1,
            });

            if (!cancelled && searchRes.results && searchRes.results.length > 0) {
              const match =
                searchRes.results.find((m: any) => m.tmdb_id === activeMovie.tmdb_id) ||
                searchRes.results[0];
              if (match) {
                setEnriched(match);
              }
            }
          }
        } catch {
          // Graceful fallback to existing movie record
        }
      };

      fetchTarget();
    }

    return () => {
      cancelled = true;
    };
  }, [activeMovie?.tmdb_id, activeMovie?.title]);

  const genreNames: string[] = React.useMemo(() => {
    if (enriched?.genres && Array.isArray(enriched.genres)) {
      return enriched.genres
        .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
        .filter(Boolean);
    }
    if (activeMovie?.genres && Array.isArray(activeMovie.genres)) {
      return activeMovie.genres
        .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
        .filter(Boolean);
    }
    return ["Crime", "Drama", "Thriller"];
  }, [enriched, activeMovie]);

  const rawBackdrop = enriched?.backdrop_path || activeMovie?.backdrop_path;
  const rawPoster = enriched?.poster_path || activeMovie?.poster_path;

  // Build bulletproof cascade of backdrop URLs for the full-bleed hero
  const candidateUrls: string[] = React.useMemo(() => {
    const list: string[] = [];

    if (rawBackdrop) {
      const cleanB = rawBackdrop.startsWith("/") ? rawBackdrop : `/${rawBackdrop}`;
      list.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=original`);
      list.push(`https://image.tmdb.org/t/p/original${cleanB}`);
      list.push(`/api/image?path=${encodeURIComponent(cleanB)}&w=1280`);
      list.push(`https://image.tmdb.org/t/p/w1280${cleanB}`);
      list.push(`https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/original${cleanB}`)}&output=webp&q=95`);
    }

    if (rawPoster) {
      const cleanP = rawPoster.startsWith("/") ? rawPoster : `/${rawPoster}`;
      list.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=original`);
      list.push(`https://image.tmdb.org/t/p/original${cleanP}`);
      list.push(`/api/image?path=${encodeURIComponent(cleanP)}&w=780`);
    }

    return list;
  }, [rawBackdrop, rawPoster]);

  const activeArtworkUrl = candidateUrls[fallbackIndex] || candidateUrls[0] || null;

  const runtimeMinutes = enriched?.runtime || activeMovie?.runtime || 98;
  const runtimeDisplay = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60 > 0 ? `${runtimeMinutes % 60}m` : ""}`.trim()
    : "1h 38m";

  const overview =
    enriched?.overview ||
    activeMovie?.overview ||
    "Jerry Lundegaard is a small-town Minnesota car salesman deeply in debt and willing to do almost anything to get out. Police chief Marge Gunderson discovers a string of violent crimes as Jerry's schemes spiral out of control.";
  const releaseYear = formatYear(enriched?.release_date || activeMovie?.release_date) || "1996";
  const tmdbScore = enriched?.vote_average || activeMovie?.vote_average || 7.8;

  const handleToggleWatchlistClick = () => {
    if (onRemoveFromWatchlist && activeMovie.tmdb_id) {
      onRemoveFromWatchlist(activeMovie.tmdb_id);
    } else if (onToggleWatchlist) {
      onToggleWatchlist(activeMovie);
    }
  };

  const handleImageError = () => {
    if (fallbackIndex < candidateUrls.length - 1) {
      setFallbackIndex((prev) => prev + 1);
    }
  };

  const displayNameDisplay =
    !userName || userName.toLowerCase().includes("guest")
      ? "RAHUL TS"
      : userName.toUpperCase();

  return (
    <section
      id="section-watch-next-featured"
      aria-label="Watch Next Featured Movie"
      className="relative w-full min-h-[500px] sm:min-h-[560px] lg:min-h-[68vh] lg:max-h-[82vh] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* ── Full-Bleed Backdrop Image — edge-to-edge, crystal-sharp high-res artwork ── */}
      {activeArtworkUrl && (
        <div className="absolute inset-0 z-0">
          <img
            ref={imgRef}
            key={activeArtworkUrl}
            src={activeArtworkUrl}
            alt={activeMovie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[center_30%] transition-opacity duration-700 select-none brightness-[0.92]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={handleImageError}
          />
        </div>
      )}

      {/* ── Gradient Scrims matching Reference Image 1 ── */}
      {/* Top subtle scrim for header readability */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 z-10 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none" />
      {/* Bottom atmospheric scrim (compact and soft, preventing giant black canyon) */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-44 z-10 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/65 to-transparent pointer-events-none" />
      {/* Left gradient for text backing */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 lg:w-3/5 z-10 bg-gradient-to-r from-[#0A0B0F]/85 via-[#0A0B0F]/45 to-transparent pointer-events-none" />
      {!activeArtworkUrl && <div className="absolute inset-0 z-0 bg-[#0A0B0F]" />}

      {/* ── Upper-Left Greeting (Exact Image 1 layout) ── */}
      <div className="relative z-20 pt-16 sm:pt-20 px-6 sm:px-10 lg:px-16 pointer-events-none">
        <p className="text-xs sm:text-sm font-medium text-[#9496A1]">{greeting},</p>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
          {displayNameDisplay}
        </h1>
      </div>

      {/* ── Bottom Content Layer with Floating Poster on Right (Snug padding, no dead space) ── */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10 px-6 sm:px-10 lg:px-16 pb-6 sm:pb-8 lg:pb-10 pt-4">
        {/* Left: Movie Info */}
        <div className="max-w-2xl space-y-3.5 sm:space-y-4">
          {/* Eyebrow Badge: Watch Next (Cinema Play Icon) */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-white/90 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <Play className="w-3 h-3 text-[#00D878] fill-[#00D878]" />
              <span>Watch Next</span>
            </span>
          </div>

          {/* Cinematic Movie Title (Image 1: "Fargo") */}
          <h2 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight drop-shadow-2xl leading-none">
            {activeMovie.title}
          </h2>

          {/* Metadata Row: ★ 7.8 TMDB 1996 1h 38m Crime Drama Thriller */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold text-white/90">
            <div className="flex items-center gap-1 text-[#F59E0B]">
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] stroke-[#F59E0B]" />
              <span className="font-bold text-white tabular-nums">
                {formatScore(tmdbScore)}
              </span>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-[#A78BFA] border border-white/10">
              TMDB
            </span>

            {releaseYear && <span className="text-white/80">{releaseYear}</span>}

            {runtimeDisplay && <span className="text-white/80">{runtimeDisplay}</span>}

            {genreNames.length > 0 && (
              <div className="flex items-center gap-2 text-white/70">
                {genreNames.slice(0, 3).map((g) => (
                  <span key={g}>{g}</span>
                ))}
              </div>
            )}
          </div>

          {/* Saved in Watchlist Indicator (Image 1: 🔖 SAVED IN YOUR WATCHLIST) */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#A78BFA] tracking-wider uppercase">
            <Bookmark className="w-3.5 h-3.5 fill-[#A78BFA] text-[#A78BFA]" />
            <span>Saved in your watchlist</span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl line-clamp-3 font-normal drop-shadow-lg">
            {overview}
          </p>

          {/* Action Buttons (Image 1: Purple Watch, Saved in Watchlist, Heart, Info) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* 1. Purple Watch Button */}
            <button
              type="button"
              onClick={() => onWatch(activeMovie)}
              title="Watch movie"
              className="h-11 px-6 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-[#8B5CF6]/35 hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white stroke-white" />
              <span>Watch</span>
            </button>

            {/* 2. Saved in Watchlist Button */}
            <button
              type="button"
              onClick={handleToggleWatchlistClick}
              title="Saved in your Watchlist"
              className="h-11 px-5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <Bookmark className="w-4 h-4 fill-[#A78BFA] text-[#A78BFA]" />
              <span>Saved in Watchlist</span>
            </button>

            {/* 3. Favorite Button */}
            <button
              type="button"
              onClick={() => onToggleFavorite?.(activeMovie)}
              title={activeMovie.is_favorite ? "Favorited" : "Add to Favorites"}
              className="h-11 w-11 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white grid place-items-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer backdrop-blur-md"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  activeMovie.is_favorite ? "fill-rose-500 text-rose-500" : "text-white/80"
                )}
              />
            </button>

            {/* 4. Details Info Button */}
            <button
              type="button"
              onClick={() => onOpenDetail(activeMovie)}
              aria-label={`Details for ${activeMovie.title}`}
              title="Film Details"
              className="h-11 w-11 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white grid place-items-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer backdrop-blur-md"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Floating Movie Poster with White Border Frame (Exact Image 1) */}
        {rawPoster && (
          <div
            onClick={() => onOpenDetail(activeMovie)}
            className="hidden lg:block shrink-0 w-52 xl:w-64 2xl:w-72 aspect-[2/3] rounded-2xl sm:rounded-3xl border-4 border-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden cursor-pointer hover:scale-[1.03] transition-all duration-300 relative group"
            title={`View ${activeMovie.title} details`}
          >
            <img
              src={`/api/image?path=${encodeURIComponent(
                rawPoster.startsWith("/") ? rawPoster : `/${rawPoster}`
              )}&w=780`}
              alt={`${activeMovie.title} poster`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </section>
  );
}
