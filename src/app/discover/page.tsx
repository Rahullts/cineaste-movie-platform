"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Mic,
  X,
  Star,
  Check,
  Heart,
  Plus,
  Play,
  Film,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Compass,
  Trophy,
  Orbit,
  Activity,
  SlidersHorizontal,
  Layers,
  Ticket,
  Sun,
  Moon,
  Award,
  Clapperboard,
  Calendar,
  RotateCcw,
  Globe,
  Bookmark,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { DiscoverFiltersDialog } from "@/components/discover/discover-filters-dialog";
import { tmdbFetch, tmdbAiSearch } from "@/lib/tmdb-service";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import { useLibrary } from "@/lib/library-store";
import { formatScore, formatYear, cn } from "@/lib/utils";
import {
  INITIAL_FILTER_STATE,
  MOOD_GENRE_MAP,
  MOOD_OPTIONS,
  LANGUAGE_OPTIONS,
  type DiscoverFilterState,
} from "@/lib/constants/discover-filters";
import type { Movie } from "@/types";

const GENRE_NAME_MAP = new Map<number, string>(
  TMDB_GENRES.map((g) => [g.id, g.name])
);

function resolveGenres(movie: Movie, max = 2): string[] {
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres
      .slice(0, max)
      .map((g: any) => (typeof g === "string" ? g : g?.name))
      .filter(Boolean);
  }
  const ids = (movie as any)?.genre_ids;
  if (Array.isArray(ids) && ids.length > 0) {
    return ids
      .slice(0, max)
      .map((id: number) => GENRE_NAME_MAP.get(id))
      .filter((name): name is string => Boolean(name));
  }
  return [];
}

// Curated Fallback Movies for Zero-Blank Initial Render
const FALLBACK_TRENDING: Movie[] = [
  {
    id: 1368337,
    tmdb_id: 1368337,
    title: "The Odyssey",
    release_date: "2026-07-15",
    vote_average: 8.5,
    overview:
      "Ten years after the Trojan War, Odysseus embarks on an impossible voyage across uncharted mythic seas to reclaim his throne and family.",
    backdrop_path: "/c7btGYblBnfAaw713WvFM0Kimc7.jpg",
    poster_path: "/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
    genres: ["Adventure", "Action", "Fantasy"] as any,
  },
  {
    id: 693134,
    tmdb_id: 693134,
    title: "Dune: Part Two",
    release_date: "2024-03-01",
    vote_average: 8.2,
    overview:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    backdrop_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    genres: ["Sci-Fi", "Adventure"] as any,
  },
  {
    id: 1003596,
    tmdb_id: 1003596,
    title: "Avengers: Doomsday",
    release_date: "2026-05-01",
    vote_average: 8.5,
    overview:
      "Earth's Mightiest Heroes confront Doctor Doom across fractured timelines in a battle for the multiverse.",
    backdrop_path: "/rObL4of4eFA8yWaN9pRFo9aOVNi.jpg",
    poster_path: "/1zqWkLwC1zLBBBtIWzmkmWeMWnT.jpg",
    genres: ["Action", "Sci-Fi"] as any,
  },
  {
    id: 76341,
    tmdb_id: 76341,
    title: "Mad Max: Fury Road",
    release_date: "2015-05-13",
    vote_average: 7.6,
    overview:
      "In a stark desert wasteland, Max and Furiosa embark on a high-speed chase across the desert in search of redemption.",
    backdrop_path: "/nlCHUWjY9XWbuEUQauCBgnY8ymF.jpg",
    poster_path: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
    genres: ["Action", "Adventure"] as any,
  },
  {
    id: 157336,
    tmdb_id: 157336,
    title: "Interstellar",
    release_date: "2014-11-05",
    vote_average: 8.4,
    overview:
      "A group of explorers travel through a newly discovered wormhole in space to ensure humanity's survival.",
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Adventure", "Drama", "Sci-Fi"] as any,
  },
  {
    id: 275,
    tmdb_id: 275,
    title: "Fargo",
    release_date: "1996-03-08",
    vote_average: 7.8,
    overview:
      "Jerry Lundegaard's clumsy kidnapping scheme turns deadly in freezing Minnesota, drawing the attention of police chief Marge Gunderson.",
    backdrop_path: "/747dgDfL5d8esobk7h4odaOFhUq.jpg",
    poster_path: "/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg",
    genres: ["Crime", "Drama"] as any,
  },
  {
    id: 872585,
    tmdb_id: 872585,
    title: "Oppenheimer",
    release_date: "2023-07-19",
    vote_average: 8.1,
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genres: ["Drama", "History"] as any,
  },
];

// Subtle 1.5% opacity archival film grain data URI for featured artwork surface texture
const ARCHIVAL_GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

interface CategoryDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  genres?: string;
  language?: string;
  sortBy?: string;
  minVotes?: number;
  maxVotes?: number;
}

const CINEPHILE_CATEGORIES: CategoryDef[] = [
  {
    id: "all",
    label: "All Index",
    icon: Clapperboard,
    description: "Curated international cinema index and editorial selections.",
  },
  {
    id: "indian_cinema",
    label: "Indian Cinema",
    icon: Globe,
    language: "hi|ta|ml|te",
    sortBy: "popularity.desc",
    minVotes: 25,
    description: "Notable Hindi, Tamil, Malayalam, Telugu, and regional Indian motion pictures.",
  },
  {
    id: "critically_acclaimed",
    label: "Critically Acclaimed",
    icon: Trophy,
    sortBy: "vote_average.desc",
    minVotes: 1500,
    description: "Academy Award laureates, festival favorites, and revered world cinema classics.",
  },
  {
    id: "hidden_gems",
    label: "Hidden Gems",
    icon: Compass,
    sortBy: "vote_average.desc",
    minVotes: 150,
    maxVotes: 1200,
    description: "Overlooked treasures and independent releases deserving a closer screening.",
  },
  {
    id: "adrenaline",
    label: "The Adrenaline Rush",
    icon: Activity,
    genres: "28,53",
    sortBy: "popularity.desc",
    description: "High-octane action, pulse-pounding chases, and edge-of-your-seat thrillers.",
  },
  {
    id: "sci_fi",
    label: "Sci-Fi & Fantasy",
    icon: Orbit,
    genres: "878,14",
    sortBy: "popularity.desc",
    description: "Speculative futures, mythic worldbuilding, and visionary science fiction.",
  },
  {
    id: "mind_bending",
    label: "Mind-Bending Noir",
    icon: Layers,
    genres: "9648,878",
    sortBy: "popularity.desc",
    description: "Psychological labyrinths, cerebral twists, and atmospheric detective cinema.",
  },
  {
    id: "blockbusters",
    label: "Box Office & Hits",
    icon: Ticket,
    sortBy: "popularity.desc",
    description: "Crowd-pleasing theatrical sensations and major studio spectacles.",
  },
  {
    id: "cozy",
    label: "Warm & Comfort",
    icon: Sun,
    genres: "35,10751,10749",
    sortBy: "popularity.desc",
    description: "Human-scale comedies, heartfelt stories, and evening comfort screenings.",
  },
  {
    id: "horror",
    label: "Late-Night Thrills",
    icon: Moon,
    genres: "27,53",
    sortBy: "popularity.desc",
    description: "Midnight dread, unsettling suspense, and intense horror filmmaking.",
  },
];

/**
 * Restrained Hover/Focus Actions shared cleanly across Mosaic and Feature Plates
 */
function IndexActionPair({
  movie,
  isSaved,
  isFav,
  onToggleWatchlist,
  onToggleFavorite,
  alwaysVisible = false,
}: {
  movie: Movie;
  isSaved: boolean;
  isFav: boolean;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  alwaysVisible?: boolean;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex items-center gap-1.5 transition-opacity duration-200",
        alwaysVisible || isSaved || isFav
          ? "opacity-100"
          : "opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100"
      )}
    >
      <button
        type="button"
        data-testid="card-watchlist-btn"
        onClick={() => onToggleWatchlist(movie)}
        title={isSaved ? "In Watchlist — Click to Remove" : "Add to Watchlist"}
        aria-label={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-md grid place-items-center backdrop-blur-md transition active:scale-95 cursor-pointer",
          isSaved
            ? "bg-[#00D664] text-[#050608]"
            : "bg-[#0A0B0F]/80 hover:bg-[#0A0B0F] text-white/90 hover:text-white border border-white/15"
        )}
      >
        {isSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5" />}
      </button>

      <button
        type="button"
        data-testid="card-favorite-btn"
        onClick={() => onToggleFavorite(movie)}
        title={isFav ? "Favorited — Click to Remove" : "Add to Favorites"}
        aria-label={isFav ? "Remove from Favorites" : "Add to Favorites"}
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-md grid place-items-center backdrop-blur-md transition active:scale-95 cursor-pointer",
          isFav
            ? "bg-rose-500 text-white"
            : "bg-[#0A0B0F]/80 hover:bg-[#0A0B0F] text-white/90 hover:text-rose-400 border border-white/15"
        )}
      >
        <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
      </button>
    </div>
  );
}

/**
 * Band A: Asymmetric Editorial Cinema Mosaic (Above-the-Fold Index Composition)
 * Left (5 cols): Featured #1 Archive Slate | Right (7 cols): 2 Widescreen Stills + 4 Vertical Archive Posters
 */
function IndexHeroMosaic({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
  libraryMap,
}: {
  movies: Movie[];
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
  libraryMap: Record<number, Movie>;
}) {
  const pool = movies.length > 0 ? movies : FALLBACK_TRENDING;
  const lead = pool[0] || FALLBACK_TRENDING[0];
  const widePair = [pool[1] || FALLBACK_TRENDING[1], pool[2] || FALLBACK_TRENDING[2]];
  const posterWall = [
    pool[3] || FALLBACK_TRENDING[3],
    pool[4] || FALLBACK_TRENDING[4],
    pool[5] || FALLBACK_TRENDING[5],
    pool[6] || FALLBACK_TRENDING[6],
  ].filter(Boolean);

  const leadSaved = Boolean(watchlistMap[lead.tmdb_id || lead.id]);
  const leadFav = Boolean(libraryMap[lead.tmdb_id || lead.id]?.is_favorite);
  const leadGenres = resolveGenres(lead, 2);

  return (
    <section id="section-cinema-index-mosaic" aria-label="Featured Cinema Index" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        {/* LEFT COLUMN (5 cols): Controlled Editorial Featured Selection */}
        <article
          onClick={() => onOpenDetail(lead)}
          className="lg:col-span-5 group relative min-h-[340px] sm:min-h-[390px] rounded-xl overflow-hidden bg-[#101118] border border-[#1E1F2A] cursor-pointer flex flex-col justify-between p-5 sm:p-6 select-none"
        >
          {(lead.backdrop_path || lead.poster_path) && (
            <img
              src={`/api/image?path=${encodeURIComponent(lead.backdrop_path || lead.poster_path || "")}&w=1280`}
              alt={lead.title}
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] brightness-[0.82]"
            />
          )}

          {/* Subtle Archival Grain + Tonal Scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: ARCHIVAL_GRAIN_BG }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/65 to-[#0A0B0F]/25 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/85 via-transparent to-transparent pointer-events-none" />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0A0B0F]/80 border border-white/10 text-[11px] font-mono uppercase tracking-[0.14em] text-[#00D664] backdrop-blur-md">
              <span>№ 01</span>
              <span className="text-white/30">/</span>
              <span className="text-[#F3F4F6]">Featured Index</span>
            </span>

            <IndexActionPair
              movie={lead}
              isSaved={leadSaved}
              isFav={leadFav}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
              alwaysVisible
            />
          </div>

          {/* Bottom Editorial Feature Details */}
          <div className="relative z-10 space-y-2.5 pt-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#D1D5DB] tabular-nums">
              {(lead.vote_average || 0) > 0 && (
                <span
                  title="TMDB Community Score"
                  className="inline-flex items-center gap-1 text-[#FBBF24] font-semibold"
                >
                  <Star className="w-3.5 h-3.5 fill-[#FBBF24]" />
                  <span className="text-[10px] font-mono uppercase text-white/75">TMDB</span>
                  <span>{formatScore(lead.vote_average)}</span>
                </span>
              )}
              {formatYear(lead.release_date) && (
                <>
                  <span className="text-white/30">•</span>
                  <span>{formatYear(lead.release_date)}</span>
                </>
              )}
              {leadGenres.length > 0 && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-[#00D664]">{leadGenres.join(" / ")}</span>
                </>
              )}
            </div>

            <h2 className="font-brand font-bold text-2xl sm:text-[28px] tracking-[-0.02em] text-white leading-tight group-hover:text-[#00D664] transition-colors">
              {lead.title}
            </h2>

            {lead.overview && (
              <p className="text-xs sm:text-[13px] text-[#C4C7D5] line-clamp-2 leading-relaxed max-w-lg">
                {lead.overview}
              </p>
            )}

            <div className="pt-1 flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onToggleWatchlist(lead)}
                className={cn(
                  "h-9 px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer",
                  leadSaved
                    ? "bg-[#00D664]/18 text-[#00D664] border border-[#00D664]/35"
                    : "bg-[#00D664] hover:bg-[#00BF59] text-[#050608]"
                )}
              >
                {leadSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.2]" />}
                <span>{leadSaved ? "In Watchlist" : "Add to Watchlist"}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(lead)}
                className="h-9 px-4 rounded-md bg-white/10 hover:bg-white/18 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Inspect Entry</span>
              </button>
            </div>
          </div>
        </article>

        {/* RIGHT COLUMN (7 cols): Dense 2 Widescreen Stills + 4 Portrait Archive Posters */}
        <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4 justify-between">
          {/* Upper Band: Double-Feature Widescreen Stills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {widePair.map((movie, idx) => {
              const id = movie.tmdb_id || movie.id;
              const isSaved = Boolean(watchlistMap[id]);
              const isFav = Boolean(libraryMap[id]?.is_favorite);
              const year = formatYear(movie.release_date);

              return (
                <article
                  key={id}
                  onClick={() => onOpenDetail(movie)}
                  className="group relative h-44 sm:h-[186px] rounded-xl overflow-hidden bg-[#101118] border border-[#1E1F2A] cursor-pointer flex flex-col justify-between p-4 select-none"
                >
                  {(movie.backdrop_path || movie.poster_path) && (
                    <img
                      src={`/api/image?path=${encodeURIComponent(movie.backdrop_path || movie.poster_path || "")}&w=780`}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] brightness-[0.82]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/45 to-[#0A0B0F]/20 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0A0B0F]/80 border border-white/10 text-[10px] font-mono text-white/85">
                      № 0{idx + 2}
                    </span>
                    <IndexActionPair
                      movie={movie}
                      isSaved={isSaved}
                      isFav={isFav}
                      onToggleWatchlist={onToggleWatchlist}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>

                  <div className="relative z-10 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#D1D5DB] tabular-nums">
                      {(movie.vote_average || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#FBBF24]">
                          <Star className="w-3 h-3 fill-[#FBBF24]" />
                          <span>TMDB {formatScore(movie.vote_average)}</span>
                        </span>
                      )}
                      {year && (
                        <>
                          <span className="text-white/30">•</span>
                          <span>{year}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-sm sm:text-base text-white truncate group-hover:text-[#00D664] transition-colors">
                      {movie.title}
                    </h3>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Lower Band: 4-Poster Dense Archive Wall */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {posterWall.map((movie, idx) => {
              const id = movie.tmdb_id || movie.id;
              const isSaved = Boolean(watchlistMap[id]);
              const isFav = Boolean(libraryMap[id]?.is_favorite);
              const year = formatYear(movie.release_date);

              return (
                <article
                  key={id}
                  onClick={() => onOpenDetail(movie)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-[#101118] border border-[#1E1F2A] cursor-pointer flex flex-col justify-between p-2.5 select-none"
                >
                  {(movie.poster_path || movie.backdrop_path) && (
                    <img
                      src={`/api/image?path=${encodeURIComponent(movie.poster_path || movie.backdrop_path || "")}&w=500`}
                      alt={movie.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/35 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#0A0B0F]/80 text-[10px] font-mono text-white/80">
                      № 0{idx + 4}
                    </span>
                    <IndexActionPair
                      movie={movie}
                      isSaved={isSaved}
                      isFav={isFav}
                      onToggleWatchlist={onToggleWatchlist}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>

                  <div className="relative z-10 space-y-0.5">
                    <h4 className="font-heading text-xs sm:text-[13px] font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#00D664] transition-colors">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#B8BCC9] tabular-nums">
                      {year && <span>{year}</span>}
                      {(movie.vote_average || 0) > 0 && (
                        <span>• TMDB {formatScore(movie.vote_average)}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Editorial Section Heading helper — compact archival aesthetic
 */
function IndexSectionHeader({
  kicker,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
      <div className="space-y-0.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00D664] block">
          {kicker}
        </span>
        <h2 className="font-brand font-semibold text-lg sm:text-xl tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#00D664] transition cursor-pointer self-start sm:self-auto group shrink-0"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

/**
 * Band C: Critically Acclaimed — Feature Plate + 2x3 Editorial Index Ledger
 */
function CriticallyAcclaimedEditorial({
  movies,
  isLoading,
  onSeeAll,
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
  libraryMap,
}: {
  movies: Movie[];
  isLoading: boolean;
  onSeeAll: () => void;
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
  libraryMap: Record<number, Movie>;
}) {
  if (!isLoading && movies.length === 0) return null;

  const feature = movies[0];
  const entries = movies.slice(1, 7);

  return (
    <section aria-label="Critically Acclaimed Films" className="space-y-3.5">
      <IndexSectionHeader
        kicker="CRITICAL CANON"
        title="Critically Acclaimed Selection"
        subtitle="Celebrated masterpieces, festival honorees, and essential cinema history."
        actionLabel="View All Acclaimed"
        onAction={onSeeAll}
      />

      {isLoading && movies.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 h-72 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse" />
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {feature && (
            <article
              onClick={() => onOpenDetail(feature)}
              className="lg:col-span-4 group relative min-h-[290px] rounded-xl overflow-hidden bg-[#101118] border border-[#1E1F2A] cursor-pointer flex flex-col justify-between p-5 select-none"
            >
              {(feature.backdrop_path || feature.poster_path) && (
                <img
                  src={`/api/image?path=${encodeURIComponent(feature.backdrop_path || feature.poster_path || "")}&w=780`}
                  alt={feature.title}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] brightness-[0.8]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/60 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#0A0B0F]/80 border border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#FBBF24]">
                  <Award className="w-3 h-3" />
                  <span>Canonical Pick</span>
                </span>
                <IndexActionPair
                  movie={feature}
                  isSaved={Boolean(watchlistMap[feature.tmdb_id || feature.id])}
                  isFav={Boolean(libraryMap[feature.tmdb_id || feature.id]?.is_favorite)}
                  onToggleWatchlist={onToggleWatchlist}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>

              <div className="relative z-10 space-y-1.5 pt-16">
                <div className="flex items-center gap-2 text-xs text-[#D1D5DB] tabular-nums">
                  {(feature.vote_average || 0) > 0 && (
                    <span className="text-[#FBBF24] font-semibold">
                      TMDB {formatScore(feature.vote_average)}
                    </span>
                  )}
                  {formatYear(feature.release_date) && (
                    <span>• {formatYear(feature.release_date)}</span>
                  )}
                </div>
                <h3 className="font-brand font-bold text-xl text-white group-hover:text-[#00D664] transition-colors">
                  {feature.title}
                </h3>
                {feature.overview && (
                  <p className="text-xs text-[#B8BCC9] line-clamp-2 leading-relaxed">
                    {feature.overview}
                  </p>
                )}
              </div>
            </article>
          )}

          {/* Right: 2x3 Editorial Index Ledger */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((movie, idx) => {
              const id = movie.tmdb_id || movie.id;
              const isSaved = Boolean(watchlistMap[id]);
              const isFav = Boolean(libraryMap[id]?.is_favorite);
              const year = formatYear(movie.release_date);
              const genres = resolveGenres(movie, 2);

              return (
                <div
                  key={id}
                  onClick={() => onOpenDetail(movie)}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] hover:border-[#00D664]/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-[72px] rounded-md overflow-hidden bg-background dark:bg-[#0A0B0F] shrink-0">
                      {movie.poster_path ? (
                        <img
                          src={`/api/image?path=${encodeURIComponent(movie.poster_path)}&w=185`}
                          alt={movie.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-muted-foreground">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        <span className="text-[#00D664]">0{idx + 2}</span>
                        {year && <span>• {year}</span>}
                        {(movie.vote_average || 0) > 0 && (
                          <span className="text-[#FBBF24]">
                            • TMDB {formatScore(movie.vote_average)}
                          </span>
                        )}
                      </div>
                      <p className="font-heading text-sm font-semibold text-foreground group-hover:text-[#00D664] transition-colors truncate">
                        {movie.title}
                      </p>
                      {genres.length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {genres.join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleWatchlist(movie)}
                      aria-label={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                      title={isSaved ? "In Watchlist" : "Add to Watchlist"}
                      className={cn(
                        "w-8 h-8 rounded-md grid place-items-center transition cursor-pointer",
                        isSaved
                          ? "bg-[#00D664] text-[#050608]"
                          : "bg-secondary dark:bg-[#171923] text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(movie)}
                      aria-label={isFav ? "Remove Favorite" : "Add Favorite"}
                      className={cn(
                        "w-8 h-8 rounded-md grid place-items-center transition cursor-pointer",
                        isFav
                          ? "bg-rose-500 text-white"
                          : "bg-secondary dark:bg-[#171923] text-muted-foreground hover:text-rose-400"
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Band D: Hidden Gems — 3-Column Print-Index Cards (Poster + Overview Snippet + Meta)
 */
function HiddenGemsArchiveGrid({
  movies,
  isLoading,
  onSeeAll,
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
  libraryMap,
}: {
  movies: Movie[];
  isLoading: boolean;
  onSeeAll: () => void;
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
  libraryMap: Record<number, Movie>;
}) {
  if (!isLoading && movies.length === 0) return null;
  const items = movies.slice(0, 6);

  return (
    <section aria-label="Hidden Gems Selection" className="space-y-3.5">
      <IndexSectionHeader
        kicker="CURATORIAL DISCOVERIES"
        title="Hidden Gems & Overlooked Works"
        subtitle="Distinctive independent features and lesser-known treasures worth uncovering."
        actionLabel="Explore All Gems"
        onAction={onSeeAll}
      />

      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {items.map((movie) => {
            const id = movie.tmdb_id || movie.id;
            const isSaved = Boolean(watchlistMap[id]);
            const isFav = Boolean(libraryMap[id]?.is_favorite);
            const year = formatYear(movie.release_date);
            const genres = resolveGenres(movie, 2);

            return (
              <article
                key={id}
                onClick={() => onOpenDetail(movie)}
                className="group flex items-stretch gap-3.5 p-3 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] hover:border-[#00D664]/35 transition-colors cursor-pointer"
              >
                <div className="w-20 aspect-[2/3] rounded-md overflow-hidden bg-background dark:bg-[#0A0B0F] shrink-0">
                  {movie.poster_path ? (
                    <img
                      src={`/api/image?path=${encodeURIComponent(movie.poster_path)}&w=342`}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Film className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground tabular-nums">
                      <span>{[year, genres.join(" / ")].filter(Boolean).join(" • ")}</span>
                      {(movie.vote_average || 0) > 0 && (
                        <span className="text-[#FBBF24] font-semibold shrink-0">
                          TMDB {formatScore(movie.vote_average)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-sm sm:text-[15px] font-semibold text-foreground group-hover:text-[#00D664] transition-colors truncate">
                      {movie.title}
                    </h3>
                    {movie.overview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {movie.overview}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleWatchlist(movie)}
                      className={cn(
                        "h-7 px-2.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer",
                        isSaved
                          ? "bg-[#00D664]/15 text-[#00D664]"
                          : "bg-secondary dark:bg-[#171923] text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isSaved ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Bookmark className="w-3 h-3" />}
                      <span>{isSaved ? "Saved" : "Watchlist"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(movie)}
                      aria-label={isFav ? "Remove Favorite" : "Add Favorite"}
                      className={cn(
                        "h-7 w-7 rounded grid place-items-center transition cursor-pointer",
                        isFav
                          ? "bg-rose-500 text-white"
                          : "bg-secondary dark:bg-[#171923] text-muted-foreground hover:text-rose-400"
                      )}
                    >
                      <Heart className={cn("w-3 h-3", isFav && "fill-current")} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Reusable Horizontal Editorial Rail (for Personalized, Indian Cinema, Adrenaline, Premieres)
 */
function IndexPosterRail({
  kicker,
  title,
  subtitle,
  movies,
  isLoading,
  onSeeAll,
  seeAllLabel = "See All",
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
  libraryMap,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  movies: Movie[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
  libraryMap: Record<number, Movie>;
}) {
  if (!isLoading && movies.length === 0) return null;

  return (
    <section className="space-y-3.5 w-full">
      <IndexSectionHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        actionLabel={onSeeAll ? seeAllLabel : undefined}
        onAction={onSeeAll}
      />

      {isLoading && movies.length === 0 ? (
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <PosterCarousel>
          {movies.map((movie, idx) => (
            <MoviePosterCard
              key={movie.tmdb_id || movie.id}
              movie={movie}
              variant="carousel"
              index={idx}
              isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
              isFavorite={Boolean(libraryMap[movie.tmdb_id || movie.id]?.is_favorite)}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </PosterCarousel>
      )}
    </section>
  );
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const library = useLibrary();

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasSubmittedSearch, setHasSubmittedSearch] = React.useState(false);
  const [isAiMode, setIsAiMode] = React.useState(false);
  const [isListeningVoice, setIsListeningVoice] = React.useState(false);
  const [voiceNotice, setVoiceNotice] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [aiInterpretation, setAiInterpretation] = React.useState<string | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Filters state
  const [filters, setFilters] = React.useState<DiscoverFilterState>(INITIAL_FILTER_STATE);
  const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = React.useState(false);
  const [filterError, setFilterError] = React.useState<string | null>(null);

  // Category rail state
  const categoryRailRef = React.useRef<HTMLDivElement>(null);
  const [catCanScrollLeft, setCatCanScrollLeft] = React.useState(false);
  const [catCanScrollRight, setCatCanScrollRight] = React.useState(false);

  const updateCategoryScrollButtons = React.useCallback(() => {
    const el = categoryRailRef.current;
    if (!el) return;
    setCatCanScrollLeft(el.scrollLeft > 8);
    setCatCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    updateCategoryScrollButtons();
    window.addEventListener("resize", updateCategoryScrollButtons);
    return () => window.removeEventListener("resize", updateCategoryScrollButtons);
  }, [updateCategoryScrollButtons]);

  const scrollCategories = (dir: "left" | "right") => {
    categoryRailRef.current?.scrollBy({
      left: dir === "left" ? -240 : 240,
      behavior: "smooth",
    });
  };

  // Active Category state
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [categoryMovies, setCategoryMovies] = React.useState<Movie[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = React.useState(false);

  // Real index curated feeds
  const [trendingMovies, setTrendingMovies] = React.useState<Movie[]>(FALLBACK_TRENDING);
  const [acclaimedMovies, setAcclaimedMovies] = React.useState<Movie[]>([]);
  const [indianMovies, setIndianMovies] = React.useState<Movie[]>([]);
  const [hiddenGemsMovies, setHiddenGemsMovies] = React.useState<Movie[]>([]);
  const [adrenalineMovies, setAdrenalineMovies] = React.useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = React.useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = React.useState<Movie[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = React.useState<Movie[]>([]);
  const [isLoadingSections, setIsLoadingSections] = React.useState(false);

  const voiceRecognitionRef = React.useRef<any>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenDetail = (m: Movie) => {
    router.push(`/movie/${m.tmdb_id || m.id}`);
  };

  const libraryMap = React.useMemo(() => {
    const map: Record<number, Movie> = {};
    library.movies.forEach((m) => {
      if (m.tmdb_id) map[m.tmdb_id] = m;
      if (m.id) map[m.id] = m;
    });
    return map;
  }, [library.movies]);

  const watchlistMap = React.useMemo(() => {
    const map: Record<number, Movie> = {};
    library.movies.forEach((m) => {
      if (m?.status === "want" || m?.status === "watching") {
        if (m.tmdb_id) map[m.tmdb_id] = m;
        if (m.id) map[m.id] = m;
      }
    });
    return map;
  }, [library.movies]);

  const handleToggleWatchlist = (movie: Movie) => {
    const tmdbId = movie.tmdb_id || movie.id;
    const existing = libraryMap[tmdbId];
    if (existing && (existing.status === "want" || existing.status === "watching")) {
      void library.removeFromWatchlist(tmdbId);
    } else {
      void library.addToWatchlist(movie);
    }
  };

  // Anchor movie for genuine personalized recommendations when user has activity
  const personalizedAnchor = React.useMemo(() => {
    if (!library.movies || library.movies.length === 0) return null;
    const watchedOrRated = [...library.movies]
      .filter((m) => m?.status === "watched" || (m?.rating || 0) >= 7)
      .sort((a, b) => {
        const dA = new Date(a.updated_date || a.created_date || 0).getTime();
        const dB = new Date(b.updated_date || b.created_date || 0).getTime();
        return dB - dA;
      });
    return watchedOrRated[0] || library.movies[0];
  }, [library.movies]);

  // 1. Initial Load of Curated Index Feeds (parallel)
  React.useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setIsLoadingSections(true);
      try {
        const [
          trendingRes,
          acclaimedRes,
          hindiRes,
          southIndianRes,
          gemsRes,
          adrenalineRes,
          sciFiRes,
          comingSoonRes,
        ] = await Promise.allSettled([
          tmdbFetch({ action: "trending", window: "week", page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "vote_average.desc", min_votes: 1500, page: 1 }),
          tmdbFetch({ action: "discover", language: "hi", sort_by: "popularity.desc", min_votes: 40, page: 1 }),
          tmdbFetch({ action: "discover", language: "ta|te|ml|kn", sort_by: "popularity.desc", min_votes: 20, page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "vote_average.desc", min_votes: 150, max_votes: 1200, page: 1 }),
          tmdbFetch({ action: "discover", with_genres: "28,53", sort_by: "popularity.desc", page: 1 }),
          tmdbFetch({ action: "discover", with_genres: "878,14", sort_by: "popularity.desc", page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "primary_release_date.desc", min_votes: 10, page: 1 }),
        ]);

        if (cancelled) return;

        if (trendingRes.status === "fulfilled" && trendingRes.value.results?.length > 0) {
          setTrendingMovies(trendingRes.value.results.slice(0, 16));
        }
        if (acclaimedRes.status === "fulfilled" && acclaimedRes.value.results?.length > 0) {
          setAcclaimedMovies(acclaimedRes.value.results.slice(0, 12));
        }

        // Merge regional & Hindi Indian selections uniquely
        const hindiList = hindiRes.status === "fulfilled" ? hindiRes.value.results || [] : [];
        const southList = southIndianRes.status === "fulfilled" ? southIndianRes.value.results || [] : [];
        const mergedIndian: Movie[] = [];
        const seenIndian = new Set<number>();
        const maxLen = Math.max(hindiList.length, southList.length);
        for (let i = 0; i < maxLen && mergedIndian.length < 15; i++) {
          for (const candidate of [southList[i], hindiList[i]]) {
            if (candidate) {
              const cid = Number(candidate.tmdb_id || candidate.id);
              if (cid && !seenIndian.has(cid) && candidate.poster_path) {
                seenIndian.add(cid);
                mergedIndian.push(candidate);
              }
            }
          }
        }
        setIndianMovies(mergedIndian);

        if (gemsRes.status === "fulfilled" && gemsRes.value.results?.length > 0) {
          setHiddenGemsMovies(gemsRes.value.results.slice(0, 12));
        }
        if (adrenalineRes.status === "fulfilled" && adrenalineRes.value.results?.length > 0) {
          setAdrenalineMovies(adrenalineRes.value.results.slice(0, 15));
        }
        if (sciFiRes.status === "fulfilled" && sciFiRes.value.results?.length > 0) {
          setSciFiMovies(sciFiRes.value.results.slice(0, 15));
        }
        if (comingSoonRes.status === "fulfilled" && comingSoonRes.value.results?.length > 0) {
          setComingSoonMovies(comingSoonRes.value.results.slice(0, 15));
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!cancelled) setIsLoadingSections(false);
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load Personalized Recommendations ONLY when user actually has library activity
  React.useEffect(() => {
    const anchorId = personalizedAnchor?.tmdb_id || personalizedAnchor?.id;
    if (!anchorId) {
      setPersonalizedRecs([]);
      return;
    }
    let cancelled = false;
    tmdbFetch({ action: "recommendations", id: anchorId })
      .then((res) => {
        if (!cancelled && res.results?.length > 0) {
          setPersonalizedRecs(res.results.filter((m) => Boolean(m.poster_path)).slice(0, 14));
        }
      })
      .catch(() => {
        if (!cancelled) setPersonalizedRecs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [personalizedAnchor]);

  // 2. Category Selection
  const handleSelectCategory = React.useCallback(async (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery("");
    setSearchResults([]);
    setHasSubmittedSearch(false);

    if (catId === "all") {
      setCategoryMovies([]);
      return;
    }

    const catDef = CINEPHILE_CATEGORIES.find((c) => c.id === catId);
    if (!catDef) return;

    setIsLoadingCategory(true);
    try {
      const payload: Record<string, any> = {
        action: "discover",
        page: 1,
      };

      if (catDef.genres) payload.with_genres = catDef.genres;
      if (catDef.language) payload.language = catDef.language;
      if (catDef.sortBy) payload.sort_by = catDef.sortBy;
      if (catDef.minVotes) payload.min_votes = catDef.minVotes;
      if (catDef.maxVotes) payload.max_votes = catDef.maxVotes;

      const res = await tmdbFetch(payload);
      setCategoryMovies(res.results || []);
    } catch {
      setCategoryMovies([]);
    } finally {
      setIsLoadingCategory(false);
    }
  }, []);

  // 3. Search Handler (Normal Title/Crew Search & Live AI Mood Search)
  const executeSearch = React.useCallback(async (queryText: string, ai: boolean) => {
    const clean = queryText.trim();
    if (!clean) {
      setSearchResults([]);
      setAiInterpretation(null);
      setSearchError(null);
      setHasSubmittedSearch(false);
      return;
    }

    setHasSubmittedSearch(true);
    setIsSearching(true);
    setSearchError(null);
    setAiInterpretation(null);
    try {
      const res = ai
        ? await tmdbAiSearch(clean)
        : await tmdbFetch({ action: "search", query: clean, page: 1 });
      if (res.error) {
        setSearchError(res.error);
        setSearchResults([]);
      } else {
        setSearchResults(res.results || []);
        if (ai && res.interpretation) {
          setAiInterpretation(res.interpretation);
        }
      }
    } catch (err: any) {
      setSearchError(err?.message || "Failed to search movies. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const domVal = searchInputRef.current?.value;
    const effective = (domVal !== undefined ? domVal : searchQuery).trim();
    if (effective !== searchQuery) {
      setSearchQuery(effective);
    }
    executeSearch(effective, isAiMode);
  };

  // 4. Filter Execution Handler
  const hasActiveFilters = React.useMemo(
    () =>
      Boolean(
        filters.genre ||
          filters.mood ||
          filters.language ||
          filters.year ||
          filters.minRating ||
          filters.length
      ),
    [filters]
  );

  const executeFilters = React.useCallback(async (activeFilters: DiscoverFilterState) => {
    const anyActive = Boolean(
      activeFilters.genre ||
        activeFilters.mood ||
        activeFilters.language ||
        activeFilters.year ||
        activeFilters.minRating ||
        activeFilters.length
    );
    if (!anyActive) {
      setFilteredMovies([]);
      setFilterError(null);
      return;
    }

    setIsLoadingFilters(true);
    setFilterError(null);
    try {
      const payload: Record<string, any> = {
        action: "discover",
        page: 1,
        sort_by: activeFilters.minRating ? "vote_average.desc" : "popularity.desc",
      };

      const genreParts: string[] = [];
      if (activeFilters.genre) genreParts.push(String(activeFilters.genre));
      if (activeFilters.mood && MOOD_GENRE_MAP[activeFilters.mood]) {
        genreParts.push(MOOD_GENRE_MAP[activeFilters.mood]);
      }
      if (genreParts.length === 2) {
        payload.with_genres = `${genreParts[0]},${genreParts[1].split(",")[0]}`;
      } else if (genreParts.length === 1) {
        payload.with_genres = activeFilters.mood ? genreParts[0].replace(/,/g, "|") : genreParts[0];
      }

      if (activeFilters.language) payload.language = activeFilters.language;
      if (activeFilters.year) payload.year = Number(activeFilters.year);
      if (activeFilters.minRating) {
        payload.min_rating = Number(activeFilters.minRating);
        payload.min_votes = 120;
      }
      if (activeFilters.length === "short") {
        payload.max_runtime = 90;
      } else if (activeFilters.length === "medium") {
        payload.min_runtime = 90;
        payload.max_runtime = 150;
      } else if (activeFilters.length === "long") {
        payload.min_runtime = 150;
      }

      const res = await tmdbFetch(payload);
      if (res.error) {
        setFilterError(res.error);
        setFilteredMovies([]);
      } else {
        setFilteredMovies(res.results || []);
      }
    } catch (err: any) {
      setFilterError(err?.message || "Failed to apply filters.");
      setFilteredMovies([]);
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  React.useEffect(() => {
    executeFilters(filters);
  }, [filters, executeFilters]);

  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: keyof DiscoverFilterState; label: string }> = [];
    if (filters.genre) {
      const g = TMDB_GENRES.find((x) => String(x.id) === String(filters.genre));
      chips.push({ key: "genre", label: `Genre: ${g?.name || filters.genre}` });
    }
    if (filters.mood) {
      const m = MOOD_OPTIONS.find((x) => x.v === filters.mood);
      chips.push({ key: "mood", label: `Mood: ${m?.l || filters.mood}` });
    }
    if (filters.language) {
      const l = LANGUAGE_OPTIONS.find((x) => x.v === filters.language);
      chips.push({ key: "language", label: `Language: ${l?.l || filters.language}` });
    }
    if (filters.year) chips.push({ key: "year", label: `Year: ${filters.year}` });
    if (filters.minRating) chips.push({ key: "minRating", label: `Min TMDB ${filters.minRating}+` });
    if (filters.length) chips.push({ key: "length", label: `Runtime: ${filters.length}` });
    return chips;
  }, [filters]);

  React.useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search");
    const ai = searchParams.get("ai") === "1";
    const cat = searchParams.get("category");
    if (q) {
      setSearchQuery(q);
      if (ai) setIsAiMode(true);
      executeSearch(q, ai);
    } else if (cat) {
      handleSelectCategory(cat);
    }
  }, [searchParams, executeSearch, handleSelectCategory]);

  // 5. Voice Recognition Handler with Explicit Permission Error Handling
  const handleVoiceSearch = async () => {
    if (typeof window === "undefined") return;
    setVoiceNotice(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListeningVoice) {
      voiceRecognitionRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    // Check explicit microphone permission state if exposed by browser
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (status.state === "denied") {
          setVoiceNotice(
            "Microphone access is blocked. Enable microphone permission in your browser settings to use voice search."
          );
          return;
        }
      }
    } catch {
      // Permissions API unsupported for microphone; proceed to SpeechRecognition error handler
    }

    try {
      const recognition = new SpeechRecognition();
      voiceRecognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListeningVoice(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          const trimmed = transcript.trim();
          setSearchQuery(trimmed);
          setVoiceNotice(null);
          executeSearch(trimmed, isAiMode);
        }
      };
      recognition.onerror = (event: any) => {
        setIsListeningVoice(false);
        const code = event?.error;
        if (code === "not-allowed" || code === "service-not-allowed") {
          setVoiceNotice(
            "Microphone permission denied. Enable microphone access in your browser to search by voice."
          );
        } else if (code === "audio-capture") {
          setVoiceNotice("No microphone input device detected.");
        } else if (code !== "aborted") {
          setVoiceNotice("Voice search did not detect clear speech. Try again or type above.");
        }
      };
      recognition.onend = () => setIsListeningVoice(false);
      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceNotice("Could not start voice recognition.");
    }
  };

  const isSearchActive = hasSubmittedSearch && searchQuery.trim().length > 0;
  const isCategoryActive = selectedCategory !== "all";
  const activeCategoryDef = CINEPHILE_CATEGORIES.find((c) => c.id === selectedCategory);
  const heroRailMovies = trendingMovies.slice(7);

  return (
    <AppShell>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 pt-1 pb-10 select-none">
        {/* ================================================================= */}
        {/* COMPACT EDITORIAL MASTHEAD + INTEGRATED COMMAND SEARCH STRIP      */}
        {/* ================================================================= */}
        <header aria-label="The Cinema Index Masthead" className="space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-border/70 dark:border-[#1E1F2A] pb-4">
            {/* Editorial Title Block (No giant marketing hero) */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00D664]">
                <span>CINEASTE</span>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-muted-foreground">THE CINEMA INDEX</span>
              </div>
              <h1 className="font-brand font-bold text-xl sm:text-2xl lg:text-[26px] tracking-[-0.02em] text-foreground leading-tight">
                THE WORLD OF FILM, IN ONE PLACE
              </h1>
              <p className="text-xs sm:text-[13px] text-muted-foreground">
                Explore cinema across cultures, genres and generations.
              </p>
            </div>

            {/* Single Primary Compact Command Toolbar */}
            <div className="flex flex-col items-stretch lg:items-end gap-2 w-full lg:w-[460px] xl:w-[500px] shrink-0">
              <div className="w-full flex items-center gap-1.5 h-10 px-2.5 rounded-lg bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] focus-within:border-[#00D664]/50 transition-colors">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex-1 min-w-0 flex items-center gap-2"
                >
                  {isAiMode ? (
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#00D664] shrink-0" />
                  ) : (
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}

                  <input
                    ref={searchInputRef}
                    type="text"
                    data-testid="discover-search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchQuery(v);
                      if (!v.trim()) {
                        setSearchResults([]);
                        setAiInterpretation(null);
                        setSearchError(null);
                        setHasSubmittedSearch(false);
                      }
                    }}
                    placeholder={
                      isAiMode
                        ? "Describe a mood or era (e.g. Tokyo noir, 90s mystery)..."
                        : "Search titles, directors, actors, genres..."
                    }
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/75 outline-none border-0 focus:outline-none focus:ring-0"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setAiInterpretation(null);
                        setSearchError(null);
                        setHasSubmittedSearch(false);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* AI Mood Toggle */}
                  <button
                    type="button"
                    data-testid="discover-ai-toggle"
                    aria-pressed={isAiMode}
                    onClick={() => {
                      const nextAi = !isAiMode;
                      setIsAiMode(nextAi);
                      if (searchQuery.trim()) {
                        executeSearch(searchQuery, nextAi);
                      }
                    }}
                    title={isAiMode ? "AI Mood active — click for standard search" : "Switch to AI Mood search"}
                    className={cn(
                      "h-7 px-2.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer shrink-0",
                      isAiMode
                        ? "bg-[#00D664] text-[#050608]"
                        : "bg-secondary dark:bg-[#171923] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>AI Mood</span>
                  </button>

                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={() => void handleVoiceSearch()}
                    aria-label="Voice search"
                    title={isListeningVoice ? "Stop voice listening" : "Voice search"}
                    className={cn(
                      "w-7 h-7 rounded grid place-items-center transition cursor-pointer shrink-0",
                      isListeningVoice
                        ? "bg-rose-500 text-white animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#171923]"
                    )}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Filter Dialog Trigger — kept outside <form> */}
                <DiscoverFiltersDialog
                  pill
                  filters={filters}
                  onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                  onClear={() => setFilters(INITIAL_FILTER_STATE)}
                />
              </div>

              {voiceNotice && (
                <div
                  role="status"
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-400"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{voiceNotice}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoiceNotice(null)}
                    aria-label="Dismiss voice alert"
                    className="hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Index Category Selector Rail */}
          <div className="relative">
            {catCanScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                aria-label="Scroll categories left"
                className="hidden sm:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card dark:bg-[#171923] border border-border dark:border-[#1E1F2A] text-foreground hover:text-[#00D664] transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div
              ref={categoryRailRef}
              onScroll={updateCategoryScrollButtons}
              aria-label="Cinephile Index Categories"
              className={cn(
                "flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth",
                catCanScrollLeft && "sm:pl-9",
                catCanScrollRight && "pr-9"
              )}
            >
              {CINEPHILE_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0",
                      active
                        ? "bg-[#00D664] text-[#050608] font-semibold"
                        : "bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] text-muted-foreground hover:text-foreground hover:border-[#2E3142]"
                    )}
                  >
                    <CatIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            {catCanScrollRight && (
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll categories right"
                className="grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card dark:bg-[#171923] border border-border dark:border-[#1E1F2A] text-foreground hover:text-[#00D664] transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* ================================================================= */}
        {/* VIEW 1: TEXT / AI MOOD SEARCH RESULTS                             */}
        {/* ================================================================= */}
        {isSearchActive && (
          <section className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isAiMode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00D664]/15 text-[#00D664] text-[11px] font-semibold">
                      <SlidersHorizontal className="w-3 h-3" />
                      AI Mood
                    </span>
                  )}
                  <h2 className="font-brand font-semibold text-xl text-foreground">
                    Results for &ldquo;{searchQuery}&rdquo;
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiInterpretation || `Found ${searchResults.length} matching titles in TMDB index`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setAiInterpretation(null);
                  setSearchError(null);
                  setHasSubmittedSearch(false);
                }}
                className="text-xs font-semibold text-[#00D664] hover:underline cursor-pointer self-start sm:self-auto"
              >
                ← Return to Cinema Index
              </button>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse"
                  />
                ))}
              </div>
            ) : searchError ? (
              <div className="py-14 px-6 text-center space-y-3 bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] rounded-xl">
                <p className="text-sm text-rose-400 font-medium">{searchError}</p>
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery, isAiMode)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00D664] text-[#050608] text-xs font-semibold hover:bg-[#00BF59] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-14 px-6 text-center space-y-3 bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] rounded-xl">
                <p className="text-sm text-muted-foreground">
                  No matching films found for &ldquo;{searchQuery}&rdquo;.
                  {isAiMode
                    ? " Try describing a genre, mood, language, or decade."
                    : " Try another title or toggle AI Mood for vibe-based discovery."}
                </p>
                {!isAiMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiMode(true);
                      executeSearch(searchQuery, true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#00D664]/15 text-[#00D664] text-xs font-semibold hover:bg-[#00D664]/25 transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Try AI Mood Search</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(libraryMap[movie.tmdb_id || movie.id]?.is_favorite)}
                    onOpenDetail={handleOpenDetail}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={(m) => library.toggleFavorite(m)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* VIEW 1B: MULTI-CRITERIA FILTERED DISCOVERY RESULTS                */}
        {/* ================================================================= */}
        {!isSearchActive && hasActiveFilters && (
          <section className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <h2 className="font-brand font-semibold text-xl text-foreground">
                  Filtered Archive ({filteredMovies.length})
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, [chip.key]: "" }))
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00D664]/15 text-[#00D664] text-xs font-medium hover:bg-[#00D664]/25 transition cursor-pointer"
                    >
                      <span>{chip.label}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilters(INITIAL_FILTER_STATE)}
                className="text-xs font-semibold text-[#00D664] hover:underline cursor-pointer self-start sm:self-auto"
              >
                Clear All Filters
              </button>
            </div>

            {isLoadingFilters ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse"
                  />
                ))}
              </div>
            ) : filterError ? (
              <div className="py-14 px-6 text-center space-y-3 bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] rounded-xl">
                <p className="text-sm text-rose-400">{filterError}</p>
                <button
                  type="button"
                  onClick={() => executeFilters(filters)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00D664] text-[#050608] text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="py-14 px-6 text-center text-sm text-muted-foreground bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] rounded-xl">
                No films matched your selected filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(libraryMap[movie.tmdb_id || movie.id]?.is_favorite)}
                    onOpenDetail={handleOpenDetail}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={(m) => library.toggleFavorite(m)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: DEDICATED CATEGORY SELECTION VIEW                         */}
        {/* ================================================================= */}
        {!isSearchActive && !hasActiveFilters && isCategoryActive && activeCategoryDef && (
          <section className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <activeCategoryDef.icon className="w-4 h-4 text-[#00D664]" />
                  <h2 className="font-brand font-bold text-xl sm:text-2xl text-foreground">
                    {activeCategoryDef.label}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl">
                  {activeCategoryDef.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="h-8 px-3.5 rounded-md bg-secondary dark:bg-[#171923] hover:text-[#00D664] text-xs font-semibold text-foreground transition cursor-pointer shrink-0 self-start sm:self-auto"
              >
                ← Return to Full Index
              </button>
            </div>

            {isLoadingCategory ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-xl bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] animate-pulse"
                  />
                ))}
              </div>
            ) : categoryMovies.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground bg-card dark:bg-[#101118] border border-border dark:border-[#1E1F2A] rounded-xl">
                No entries currently listed for {activeCategoryDef.label}.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {categoryMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(libraryMap[movie.tmdb_id || movie.id]?.is_favorite)}
                    onOpenDetail={handleOpenDetail}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={(m) => library.toggleFavorite(m)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: MAIN EDITORIAL INDEX FEED (ASYMMETRIC ARCHIVE)            */}
        {/* ================================================================= */}
        {!isSearchActive && !hasActiveFilters && !isCategoryActive && (
          <div className="space-y-9 sm:space-y-11">
            {/* 1 & 2. Featured Entry + Widescreen Pair + 4-Poster Wall Mosaic */}
            <IndexHeroMosaic
              movies={trendingMovies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            {/* 7. Personalized Recommendations (Strictly shown when user activity exists) */}
            {personalizedAnchor && personalizedRecs.length > 0 && (
              <IndexPosterRail
                kicker="PERSONAL ARCHIVE"
                title={`Because You Logged "${personalizedAnchor.title}"`}
                subtitle="Curated connections drawn directly from your screening history."
                movies={personalizedRecs}
                onOpenDetail={handleOpenDetail}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={(m) => library.toggleFavorite(m)}
                watchlistMap={watchlistMap}
                libraryMap={libraryMap}
              />
            )}

            {/* 3. Trending Cinema Continuous Rail (#8 onwards so no duplicate above-the-fold repeats) */}
            {heroRailMovies.length > 0 && (
              <IndexPosterRail
                kicker="GLOBAL PULSE"
                title="Continuing in Trending Cinema"
                subtitle="Titles climbing international watchlists and theater schedules this week."
                movies={heroRailMovies}
                onOpenDetail={handleOpenDetail}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={(m) => library.toggleFavorite(m)}
                watchlistMap={watchlistMap}
                libraryMap={libraryMap}
              />
            )}

            {/* 5. Critically Acclaimed Editorial Feature + Ledger Split */}
            <CriticallyAcclaimedEditorial
              movies={acclaimedMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("critically_acclaimed")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            {/* 6. Indian Cinema Selection */}
            <IndexPosterRail
              kicker="REGIONAL & NATIONAL SPOTLIGHT"
              title="Indian Cinema Selection"
              subtitle="Acclaimed Hindi, Tamil, Malayalam, and Telugu releases shaping contemporary storytelling."
              movies={indianMovies}
              isLoading={isLoadingSections}
              seeAllLabel="Browse Indian Cinema"
              onSeeAll={() => handleSelectCategory("indian_cinema")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            {/* 4. Hidden Gems Archive 3-Column Print Layout */}
            <HiddenGemsArchiveGrid
              movies={hiddenGemsMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("hidden_gems")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            {/* Additional Genre Curations (Sci-Fi + Action + Coming Soon) */}
            <IndexPosterRail
              kicker="SPECULATIVE & MYTHIC"
              title="Sci-Fi & Visionary Worlds"
              movies={sciFiMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("sci_fi")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            <IndexPosterRail
              kicker="HIGH VELOCITY"
              title="The Adrenaline Rush"
              movies={adrenalineMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("adrenaline")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />

            <IndexPosterRail
              kicker="THEATRICAL CALENDAR"
              title="Upcoming Releases & Premieres"
              movies={comingSoonMovies}
              isLoading={isLoadingSections}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
              libraryMap={libraryMap}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DiscoverPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background dark:bg-[#0A0B0F]" />}>
      <DiscoverContent />
    </React.Suspense>
  );
}
