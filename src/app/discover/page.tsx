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
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { PosterCarousel } from "@/components/dashboard/poster-carousel";
import { DiscoverFiltersDialog } from "@/components/discover/discover-filters-dialog";
import { tmdbFetch, tmdbAiSearch } from "@/lib/tmdb-service";
import { useLibrary } from "@/lib/library-store";
import { formatScore, formatYear, cn } from "@/lib/utils";
import {
  INITIAL_FILTER_STATE,
  MOOD_GENRE_MAP,
  MOOD_OPTIONS,
  LANGUAGE_OPTIONS,
  type DiscoverFilterState,
} from "@/lib/constants/discover-filters";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";
import type { Movie } from "@/types";

// Curated Fallback Movies for Instant Zero-Black-Box Rendering
const FALLBACK_TRENDING: Movie[] = [
  {
    id: 1368337,
    tmdb_id: 1368337,
    title: "The Odyssey",
    release_date: "2026-07-15",
    vote_average: 8.5,
    overview:
      "A visionary retelling of the ancient epic. Ten years after the Trojan War, Odysseus embarks on an impossible journey across uncharted mythic seas to reclaim his throne and family.",
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
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg",
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
    genres: ["Action", "Adventure", "Thriller"] as any,
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
    genres: ["Crime", "Drama", "Thriller"] as any,
  },
];

// Interactive Category Curations with TMDB Mappings (unified cinema icons — zero emojis or elemental AI symbols)
interface CategoryDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  genres?: string;
  sortBy?: string;
  minVotes?: number;
  maxVotes?: number;
}

const CINEPHILE_CATEGORIES: CategoryDef[] = [
  {
    id: "all",
    label: "All Curations",
    icon: Clapperboard,
    description: "Curated multi-genre discovery feed handpicked for you.",
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
    description: "Mind-bending speculative worlds, futuristic visions, and mythic sagas.",
  },
  {
    id: "critically_acclaimed",
    label: "Critically Acclaimed",
    icon: Trophy,
    sortBy: "vote_average.desc",
    minVotes: 1500,
    description: "Academy Award laureates, Cannes festival winners, and cinematic masterpieces.",
  },
  {
    id: "mind_bending",
    label: "Mind-Bending Noir",
    icon: Layers,
    genres: "9648,878",
    sortBy: "popularity.desc",
    description: "Psychological labyrinths, cerebral twists, and atmospheric detective noir.",
  },
  {
    id: "hidden_gems",
    label: "Hidden Gems",
    icon: Compass,
    sortBy: "vote_average.desc",
    minVotes: 150,
    maxVotes: 1200,
    description: "Overlooked treasures and indie marvels waiting to be discovered.",
  },
  {
    id: "blockbusters",
    label: "Blockbusters & Hits",
    icon: Ticket,
    sortBy: "popularity.desc",
    description: "Massive crowd-pleasers, box office sensations, and cinema spectacles.",
  },
  {
    id: "cozy",
    label: "Cozy & Heartwarming",
    icon: Sun,
    genres: "35,10751,10749",
    sortBy: "popularity.desc",
    description: "Uplifting stories, feel-good comedies, and warm cinema for the soul.",
  },
  {
    id: "horror",
    label: "Late-Night Thrills",
    icon: Moon,
    genres: "27,53",
    sortBy: "popularity.desc",
    description: "Dark suspense, midnight dread, and intense psychological terror.",
  },
];

/**
 * Modernized Trending Showcase:
 * Features a dynamic #1 Trending Spotlight Card + a fluid Ranked Carousel (#2 to #10)
 */
function ModernTrendingSection({
  movies,
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
}: {
  movies: Movie[];
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const heroMovie = movies[0] || FALLBACK_TRENDING[0];
  const railMovies = movies.length > 1 ? movies.slice(1) : FALLBACK_TRENDING.slice(1);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const amount = direction === "left" ? -440 : 440;
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const isHeroSaved = Boolean(watchlistMap[heroMovie.tmdb_id || heroMovie.id]);
  const isHeroFav = Boolean(watchlistMap[heroMovie.tmdb_id || heroMovie.id]?.is_favorite);

  return (
    <section id="section-trending-modern" className="space-y-6 w-full">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#00D878] shrink-0" />
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
              <span>Trending Now</span>
              <span className="text-xs font-medium text-[#00D878] bg-[#00D878]/12 px-2.5 py-0.5 rounded-full">
                This Week
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5 pl-7.5">
            What cinephiles and viewers across the globe are watching right now.
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous trending films"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent text-foreground grid place-items-center transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next trending films"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent text-foreground grid place-items-center transition active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trending Grid: #1 Spotlight Banner (Left) + Ranked Carousel Rail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ── #1 SPOTLIGHT CARD (Borderless, Clean Typography) ── */}
        <div
          onClick={() => onOpenDetail(heroMovie)}
          className="lg:col-span-5 relative min-h-[380px] sm:min-h-[430px] rounded-3xl overflow-hidden cursor-pointer group shadow-2xl bg-[#0E0F16] flex flex-col justify-between p-6 sm:p-8 select-none transition-all duration-300 hover:shadow-[#00D878]/10"
        >
          {/* Backdrop Image */}
          {heroMovie.backdrop_path && (
            <img
              src={`/api/image?path=${encodeURIComponent(heroMovie.backdrop_path)}&w=1280`}
              alt={heroMovie.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.88]"
              loading="eager"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/85 via-transparent to-transparent pointer-events-none" />

          {/* Top Pill Badge + Separated Dark Borderless Circles */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 text-[#FBBF24] text-xs font-semibold tracking-wide backdrop-blur-md shadow-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>#1 Global Spotlight</span>
            </span>

            <div
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={() => onToggleWatchlist(heroMovie)}
                title={isHeroSaved ? "In Watchlist" : "Add to Watchlist"}
                aria-label={isHeroSaved ? "In Watchlist" : "Add to Watchlist"}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md",
                  isHeroSaved
                    ? "bg-[#00D878] text-black"
                    : "bg-black/75 hover:bg-black/95 text-white"
                )}
              >
                {isHeroSaved ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(heroMovie)}
                title={isHeroFav ? "Favorited" : "Add to Favorites"}
                aria-label={isHeroFav ? "Favorited" : "Add to Favorites"}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md",
                  isHeroFav
                    ? "bg-rose-500 text-white"
                    : "bg-black/75 hover:bg-black/95 text-white"
                )}
              >
                <Heart className={cn("w-4 h-4", isHeroFav && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Bottom Information */}
          <div className="relative z-10 space-y-3 pt-12">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-medium text-white/95 tabular-nums">
              {(heroMovie.vote_average || 0) > 0 && (
                <>
                  <span
                    title="TMDB Community Score"
                    className="inline-flex items-center gap-1 text-[#FBBF24] font-semibold"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#FBBF24]" />
                    <span className="text-[11px] text-white/80 uppercase">TMDB</span>
                    {formatScore(heroMovie.vote_average)}
                  </span>
                  <span aria-hidden="true">•</span>
                </>
              )}
              <span>{formatYear(heroMovie.release_date) || "TBA"}</span>
              {Array.isArray(heroMovie.genres) && heroMovie.genres[0] && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="text-[#00D878] font-semibold">
                    {typeof heroMovie.genres[0] === "string"
                      ? heroMovie.genres[0]
                      : (heroMovie.genres[0] as any)?.name}
                  </span>
                </>
              )}
            </div>

            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight group-hover:text-[#00D878] transition-colors">
              {heroMovie.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#9496A1] line-clamp-2 leading-relaxed">
              {heroMovie.overview || "Now trending at the peak of cinema conversation."}
            </p>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(heroMovie);
                }}
                className="h-9 px-4 rounded-full bg-[#00D878] hover:bg-[#00F084] text-black text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-[#00D878]/25"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Explore Film</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RANKED TRENDING RAIL (#2 to #10) (Spans 7 Columns on Desktop) ── */}
        <div className="lg:col-span-7 flex flex-col justify-between min-w-0">
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
          >
            {railMovies.map((movie, idx) => {
              const rank = idx + 2;
              const isSaved = Boolean(watchlistMap[movie.tmdb_id || movie.id]);
              const isFav = Boolean(watchlistMap[movie.tmdb_id || movie.id]?.is_favorite);

              return (
                <div
                  key={movie.tmdb_id || movie.id}
                  onClick={() => onOpenDetail(movie)}
                  className="group relative flex-shrink-0 w-44 sm:w-52 h-[380px] sm:h-[430px] rounded-3xl overflow-hidden cursor-pointer select-none bg-[#0E0F16] shadow-xl transition-all duration-300 snap-start flex flex-col justify-between p-4 focus:outline-none"
                >
                  {/* Poster Art */}
                  {movie.poster_path && (
                    <img
                      src={`/api/image?path=${encodeURIComponent(movie.poster_path)}&w=500`}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  {/* Gradient Scrims */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

                  {/* Top: Rank Badge + Separated Dark Borderless Hover Actions */}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="w-8 h-8 rounded-full bg-black/75 backdrop-blur-md text-white font-semibold text-xs grid place-items-center shadow-lg group-hover:text-[#00D878] transition-colors">
                      #{rank}
                    </span>

                    <div
                      className={cn(
                        "flex items-center gap-1.5 transition-opacity duration-200",
                        isSaved || isFav
                          ? "opacity-100"
                          : "opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(movie)}
                        title={isSaved ? "In Watchlist" : "Add to Watchlist"}
                        aria-label={isSaved ? "In Watchlist" : "Add to Watchlist"}
                        className={cn(
                          "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition active:scale-90 cursor-pointer shadow-md",
                          isSaved
                            ? "bg-[#00D878] text-black"
                            : "bg-black/75 hover:bg-black/95 text-white"
                        )}
                      >
                        {isSaved ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(movie)}
                        title={isFav ? "Favorited" : "Add to Favorites"}
                        aria-label={isFav ? "Favorited" : "Add to Favorites"}
                        className={cn(
                          "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md transition active:scale-90 cursor-pointer shadow-md",
                          isFav
                            ? "bg-rose-500 text-white"
                            : "bg-black/75 hover:bg-black/95 text-white"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Score, Title, Year (Crsp sans-serif, high legibility) */}
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[#FBBF24]">
                      {(movie.vote_average || 0) > 0 && (
                        <span title="TMDB Community Score" className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#FBBF24]" />
                          <span className="text-[10px] text-white/80 uppercase font-medium">TMDB</span>
                          <span>{formatScore(movie.vote_average)}</span>
                        </span>
                      )}
                      {(movie.vote_average || 0) > 0 && formatYear(movie.release_date) && (
                        <span className="text-white/50">•</span>
                      )}
                      {formatYear(movie.release_date) && (
                        <span className="text-white/95 font-medium">
                          {formatYear(movie.release_date)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-semibold text-sm sm:text-[15px] text-white tracking-tight leading-snug line-clamp-2 group-hover:text-[#00D878] transition-colors">
                      {movie.title}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Reusable Discovery Section Row with Clickable Title and "See All" Action
 */
function ModernDiscoveryRow({
  title,
  icon,
  subtitle,
  movies,
  isLoading,
  onSeeAll,
  onOpenDetail,
  onToggleWatchlist,
  onToggleFavorite,
  watchlistMap,
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  movies: Movie[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  onOpenDetail: (m: Movie) => void;
  onToggleWatchlist: (m: Movie) => void;
  onToggleFavorite: (m: Movie) => void;
  watchlistMap: Record<number, Movie>;
}) {
  return (
    <section className="space-y-4 w-full">
      {/* Header with Working "See All" Link */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            {icon ? (
              <span className="shrink-0 group-hover:scale-110 transition-transform">
                {icon}
              </span>
            ) : (
              <Film className="w-5 h-5 text-[#00D878] shrink-0" />
            )}
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-[#00D878] transition-colors flex items-center gap-2">
              <span>{title}</span>
            </h2>
          </button>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium pl-8">
              {subtitle}
            </p>
          )}
        </div>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-[13px] font-semibold text-[#00D878] hover:text-[#00F084] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 pb-0.5"
          >
            <span>See All ({movies.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row Carousel */}
      {isLoading ? (
        <div className="flex items-start gap-4 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-2xl bg-[#0E0F15] animate-pulse"
            />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <PosterCarousel>
          {movies.map((movie, idx) => (
            <MoviePosterCard
              key={movie.tmdb_id || movie.id}
              movie={movie}
              variant="carousel"
              index={idx}
              isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
              isFavorite={Boolean(watchlistMap[movie.tmdb_id || movie.id]?.is_favorite)}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </PosterCarousel>
      ) : (
        <div className="py-8 text-center text-xs text-[#9496A1] bg-[#0E0F15] rounded-2xl">
          Curating films for this collection...
        </div>
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
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [aiInterpretation, setAiInterpretation] = React.useState<string | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Filters state
  const [filters, setFilters] = React.useState<DiscoverFilterState>(INITIAL_FILTER_STATE);
  const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = React.useState(false);
  const [filterError, setFilterError] = React.useState<string | null>(null);

  // Category horizontal rail ref & scroll affordance
  const categoryRailRef = React.useRef<HTMLDivElement>(null);
  const [catCanScrollLeft, setCatCanScrollLeft] = React.useState(false);
  const [catCanScrollRight, setCatCanScrollRight] = React.useState(true);

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
      left: dir === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  // Active Category / Subheading State
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [categoryMovies, setCategoryMovies] = React.useState<Movie[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = React.useState(false);

  // Curated section states
  const [trendingMovies, setTrendingMovies] = React.useState<Movie[]>(FALLBACK_TRENDING);
  const [adrenalineMovies, setAdrenalineMovies] = React.useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = React.useState<Movie[]>([]);
  const [criticallyAcclaimedMovies, setCriticallyAcclaimedMovies] = React.useState<Movie[]>([]);
  const [hiddenGemsMovies, setHiddenGemsMovies] = React.useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = React.useState<Movie[]>([]);
  const [isLoadingSections, setIsLoadingSections] = React.useState(false);

  const voiceRecognitionRef = React.useRef<any>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenDetail = (m: Movie) => {
    router.push(`/movie/${m.tmdb_id || m.id}`);
  };

  const watchlistMap = React.useMemo(() => {
    const map: Record<number, Movie> = {};
    library.movies.forEach((m) => {
      if (m.tmdb_id) map[m.tmdb_id] = m;
      if (m.id) map[m.id] = m;
    });
    return map;
  }, [library.movies]);

  const handleToggleWatchlist = (movie: Movie) => {
    const tmdbId = movie.tmdb_id || movie.id;
    const existing = watchlistMap[tmdbId];
    if (existing) {
      void library.removeFromWatchlist(tmdbId);
    } else {
      void library.addToWatchlist(movie);
    }
  };

  // 1. Initial Load of Curated Sections
  React.useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setIsLoadingSections(true);
      try {
        const [
          trendingRes,
          adrenalineRes,
          sciFiRes,
          acclaimedRes,
          gemsRes,
          comingSoonRes,
        ] = await Promise.allSettled([
          tmdbFetch({ action: "trending", window: "week", page: 1 }),
          tmdbFetch({ action: "discover", with_genres: "28,53", sort_by: "popularity.desc", page: 1 }),
          tmdbFetch({ action: "discover", with_genres: "878,14", sort_by: "popularity.desc", page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "vote_average.desc", min_votes: 1500, page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "vote_average.desc", min_votes: 150, max_votes: 1200, page: 1 }),
          tmdbFetch({ action: "discover", sort_by: "primary_release_date.desc", min_votes: 10, page: 1 }),
        ]);

        if (cancelled) return;

        if (trendingRes.status === "fulfilled" && trendingRes.value.results?.length > 0) {
          setTrendingMovies(trendingRes.value.results.slice(0, 10));
        }
        if (adrenalineRes.status === "fulfilled" && adrenalineRes.value.results?.length > 0) {
          setAdrenalineMovies(adrenalineRes.value.results.slice(0, 15));
        }
        if (sciFiRes.status === "fulfilled" && sciFiRes.value.results?.length > 0) {
          setSciFiMovies(sciFiRes.value.results.slice(0, 15));
        }
        if (acclaimedRes.status === "fulfilled" && acclaimedRes.value.results?.length > 0) {
          setCriticallyAcclaimedMovies(acclaimedRes.value.results.slice(0, 15));
        }
        if (gemsRes.status === "fulfilled" && gemsRes.value.results?.length > 0) {
          setHiddenGemsMovies(gemsRes.value.results.slice(0, 15));
        }
        if (comingSoonRes.status === "fulfilled" && comingSoonRes.value.results?.length > 0) {
          setComingSoonMovies(comingSoonRes.value.results.slice(0, 15));
        }
      } catch {
        // Fallback gracefully to preset catalog
      } finally {
        if (!cancelled) setIsLoadingSections(false);
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load Dedicated Category Films when Subheading is clicked
  const handleSelectCategory = React.useCallback(async (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery("");
    setSearchResults([]);

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

  // 3. Search Handler (Normal Title Search & Live AI Vibe Search)
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
        // Combine user selected genre with mood genre
        payload.with_genres = `${genreParts[0]},${genreParts[1].split(",")[0]}`;
      } else if (genreParts.length === 1) {
        // Mood maps use "|" OR when multiple genres represent the mood
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
    if (filters.minRating) chips.push({ key: "minRating", label: `Min ${filters.minRating}+ ★` });
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

  const handleVoiceSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    if (isListeningVoice) {
      try {
        voiceRecognitionRef.current?.stop();
      } catch {}
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      voiceRecognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningVoice(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          const trimmed = transcript.trim();
          setSearchQuery(trimmed);
          executeSearch(trimmed, isAiMode);
        }
      };
      recognition.onerror = () => setIsListeningVoice(false);
      recognition.onend = () => setIsListeningVoice(false);
      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  const isSearchActive = hasSubmittedSearch && searchQuery.trim().length > 0;
  const isCategoryActive = selectedCategory !== "all";
  const activeCategoryDef = CINEPHILE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <AppShell>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 space-y-5 pt-2 sm:pt-3 pb-8 select-none relative">
        {/* Soft Ambient Cinematic Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#00D878]/[0.03] rounded-full blur-[150px]" />
          <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-[#8B5CF6]/[0.03] rounded-full blur-[160px]" />
        </div>

        {/* ================================================================= */}
        {/* OPEN EDITORIAL DISCOVER HEADER (Seamless Canvas, Zero Dividers)   */}
        {/* ================================================================= */}
        <header
          aria-label="Discover Cinema Header"
          className="relative z-30 space-y-5 pt-1"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            {/* Left Column: Compact Editorial Identity */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-[#00D878]">
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>Curated Global Cinema Index</span>
              </div>

              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground leading-tight">
                Discover Cinema
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Explore global releases, acclaimed masterpieces, and mood-driven selections.
              </p>
            </div>

            {/* Right Column: Seamless Search Pill + Mood Vibe + Filter Console */}
            <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto shrink-0">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-colors w-full sm:w-[460px] lg:w-[540px] shadow-[0_12px_36px_-10px_rgba(0,0,0,0.45)]",
                  isAiMode
                    ? "bg-card dark:bg-[#131622]"
                    : "bg-card hover:bg-accent focus-within:bg-accent dark:bg-[#12141E] dark:hover:bg-[#161926] dark:focus-within:bg-[#161926]"
                )}
              >
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex-1 min-w-0 flex items-center gap-2.5"
                >
                  {isAiMode ? (
                    <SlidersHorizontal className="w-4 h-4 text-[#00D878] shrink-0" />
                  ) : (
                    <Search className="w-4 h-4 text-[#00D878] shrink-0" />
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
                        ? "Describe a vibe... e.g. Rainy neo-noir cyberpunk with a lonely atmosphere"
                        : "Search films, directors, actors, or keywords..."
                    }
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0"
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
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Clear query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Vibe Search Mode Toggle (clean tuner icon, no AI sparkles) */}
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
                    title={isAiMode ? "Vibe Search active — click for title search" : "Switch to Vibe Search"}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0",
                      isAiMode
                        ? "bg-[#00D878] text-black shadow-md shadow-[#00D878]/25"
                        : "bg-secondary text-muted-foreground hover:text-[#00D878]"
                    )}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>AI Vibe</span>
                  </button>

                  {/* Voice Search Button */}
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={isListeningVoice ? "Stop voice listening" : "Voice search"}
                    className={cn(
                      "p-1.5 rounded-full transition-colors cursor-pointer shrink-0",
                      isListeningVoice
                        ? "bg-rose-500 text-white animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </form>

                {/* Multi-Criteria Filter Popover — kept outside <form> */}
                <DiscoverFiltersDialog
                  compact
                  filters={filters}
                  onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                  onClear={() => setFilters(INITIAL_FILTER_STATE)}
                />
              </div>

              {isAiMode && !isSearchActive && (
                <div className="flex flex-wrap items-center gap-1.5 max-w-[540px] justify-start lg:justify-end animate-fadeIn">
                  <span className="text-xs font-medium text-[#00D878] mr-1">
                    Try mood:
                  </span>
                  {[
                    "Rainy neo-noir cyberpunk movies with a lonely atmosphere",
                    "Mind-bending sci-fi",
                    "Cozy weekend watch",
                  ].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setSearchQuery(sample);
                        executeSearch(sample, true);
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-card dark:bg-[#131622] text-foreground hover:text-[#00D878] transition cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Floating Borderless Category Rail (Zero Divider Lines, Crisp Fade) */}
          <div className="relative">
            {catCanScrollLeft && (
              <>
                <div className="pointer-events-none absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-background via-background to-transparent z-[5]" />
                <button
                  type="button"
                  onClick={() => scrollCategories("left")}
                  aria-label="Scroll categories left"
                  className="hidden sm:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card dark:bg-[#151824] text-foreground shadow-lg hover:bg-secondary hover:text-[#00D878] transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
            <div
              ref={categoryRailRef}
              onScroll={updateCategoryScrollButtons}
              aria-label="Cinephile Categories"
              className={cn(
                "flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth",
                catCanScrollLeft && "sm:pl-12",
                catCanScrollRight && "pr-16"
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
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0",
                      active
                        ? "bg-[#00D878] text-[#050608] shadow-md shadow-[#00D878]/20"
                        : "bg-card dark:bg-[#141722] text-muted-foreground hover:bg-secondary dark:hover:bg-[#1C2030] hover:text-foreground active:scale-95"
                    )}
                  >
                    <CatIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            {catCanScrollRight && (
              <>
                <div className="pointer-events-none absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-background via-background to-transparent z-[5]" />
                <button
                  type="button"
                  onClick={() => scrollCategories("right")}
                  aria-label="Scroll categories right"
                  className="grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card dark:bg-[#151824] text-foreground shadow-lg hover:bg-secondary hover:text-[#00D878] transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ================================================================= */}
        {/* VIEW 1: TEXT / AI SEARCH RESULTS                                  */}
        {/* ================================================================= */}
        {isSearchActive && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isAiMode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00D878]/15 text-[#00D878] text-[11px] font-semibold">
                      <SlidersHorizontal className="w-3 h-3" />
                      Vibe Search
                    </span>
                  )}
                  <h3 className="font-heading font-semibold text-xl text-foreground">
                    Results for &ldquo;{searchQuery}&rdquo;
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiInterpretation || `Found ${searchResults.length} matching films in live catalog`}
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
                className="text-xs font-semibold text-[#00D878] hover:underline cursor-pointer self-start sm:self-auto"
              >
                ← Back to Curated Discover
              </button>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-2xl bg-card animate-pulse"
                  />
                ))}
              </div>
            ) : searchError ? (
              <div className="py-16 px-6 text-center space-y-3 bg-card rounded-3xl">
                <p className="text-sm text-rose-400 font-medium">{searchError}</p>
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery, isAiMode)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D878] text-black text-xs font-semibold hover:bg-[#00B855] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-3 bg-card rounded-3xl">
                <p className="text-sm text-muted-foreground">
                  No matching films found for &ldquo;{searchQuery}&rdquo;.
                  {isAiMode
                    ? " Try describing a clearer genre, mood, language, or decade."
                    : " Try another movie title, or switch on AI Vibe for mood-based search."}
                </p>
                {!isAiMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiMode(true);
                      executeSearch(searchQuery, true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00D878]/15 text-[#00D878] text-xs font-semibold hover:bg-[#00D878]/25 transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Search this with AI Vibe</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {searchResults.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(watchlistMap[movie.tmdb_id || movie.id]?.is_favorite)}
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
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <h3 className="font-heading font-semibold text-xl text-foreground">
                  Filtered Cinema ({filteredMovies.length})
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, [chip.key]: "" }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D878]/15 text-[#00D878] text-xs font-medium hover:bg-[#00D878]/25 transition cursor-pointer"
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
                className="text-xs font-semibold text-[#00D878] hover:underline cursor-pointer self-start sm:self-auto"
              >
                Clear All Filters
              </button>
            </div>

            {isLoadingFilters ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-2xl bg-card animate-pulse"
                  />
                ))}
              </div>
            ) : filterError ? (
              <div className="py-16 px-6 text-center space-y-3 bg-card rounded-3xl">
                <p className="text-sm text-rose-400">{filterError}</p>
                <button
                  type="button"
                  onClick={() => executeFilters(filters)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D878] text-black text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="py-16 px-6 text-center text-sm text-muted-foreground bg-card rounded-3xl">
                No films matched your selected filter combination. Try loosening a criterion.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {filteredMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(watchlistMap[movie.tmdb_id || movie.id]?.is_favorite)}
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
        {/* VIEW 2: DEDICATED SUBHEADING / CATEGORY VIEW                       */}
        {/* (e.g. When "The Adrenaline Rush" or "Sci-Fi & Fantasy" is clicked) */}
        {/* ================================================================= */}
        {!isSearchActive && !hasActiveFilters && isCategoryActive && activeCategoryDef && (
          <section className="space-y-6 animate-fadeIn">
            {/* Category Banner Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#12131D] via-[#161726] to-[#0E0F16] shadow-2xl relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <activeCategoryDef.icon className="w-6 h-6 text-[#00D878] shrink-0" />
                  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                    {activeCategoryDef.label}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#B4B9C9] max-w-xl">
                  {activeCategoryDef.description}
                </p>
                <div className="text-xs font-semibold text-[#00D878] pt-1">
                  Showing {categoryMovies.length} curated motion pictures
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/18 text-white text-xs font-semibold inline-flex items-center gap-2 transition active:scale-95 cursor-pointer relative z-10 shrink-0"
              >
                <span>← All Curations</span>
              </button>
            </div>

            {/* Category Movie Grid */}
            {isLoadingCategory ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-3xl bg-[#0E0F15] animate-pulse"
                  />
                ))}
              </div>
            ) : categoryMovies.length === 0 ? (
              <div className="py-20 text-center text-sm text-[#9496A1] bg-[#0E0F15] rounded-3xl">
                Curating films for {activeCategoryDef.label}...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {categoryMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatchlist={Boolean(watchlistMap[movie.tmdb_id || movie.id])}
                    isFavorite={Boolean(watchlistMap[movie.tmdb_id || movie.id]?.is_favorite)}
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
        {/* VIEW 3: MAIN CURATED DISCOVERY FEED (Trending + Dedicated Rails)   */}
        {/* ================================================================= */}
        {!isSearchActive && !hasActiveFilters && !isCategoryActive && (
          <div className="space-y-10 sm:space-y-12">
            {/* 1. MODERNIZED TRENDING NOW SHOWCASE */}
            <ModernTrendingSection
              movies={trendingMovies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 2. THE ADRENALINE RUSH */}
            <ModernDiscoveryRow
              title="The Adrenaline Rush"
              icon={<Activity className="w-5 h-5 text-[#F59E0B]" />}
              subtitle="High-octane action, intense chases, and edge-of-your-seat thrillers"
              movies={adrenalineMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("adrenaline")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 3. SCI-FI & FANTASY */}
            <ModernDiscoveryRow
              title="Sci-Fi & Fantasy"
              icon={<Orbit className="w-5 h-5 text-[#8B5CF6]" />}
              subtitle="Mind-bending speculative worlds, futuristic visions, and mythic sagas"
              movies={sciFiMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("sci_fi")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 4. CRITICALLY ACCLAIMED */}
            <ModernDiscoveryRow
              title="Critically Acclaimed Masterpieces"
              icon={<Award className="w-5 h-5 text-[#FBBF24]" />}
              subtitle="Festival winners, Academy laureates, and pristine cinema masterworks"
              movies={criticallyAcclaimedMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("critically_acclaimed")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 5. HIDDEN GEMS */}
            <ModernDiscoveryRow
              title="Hidden Gems & Cult Treasures"
              icon={<Compass className="w-5 h-5 text-[#38BDF8]" />}
              subtitle="Low-key masterworks and overlooked treasures worth your screen time"
              movies={hiddenGemsMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("hidden_gems")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 6. COMING SOON */}
            <ModernDiscoveryRow
              title="Coming Soon & Theatrical Premieres"
              icon={<Calendar className="w-5 h-5 text-[#EC4899]" />}
              subtitle="Upcoming cinematic events arriving to screens worldwide"
              movies={comingSoonMovies}
              isLoading={isLoadingSections}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DiscoverPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0A0B0F]" />}>
      <DiscoverContent />
    </React.Suspense>
  );
}
