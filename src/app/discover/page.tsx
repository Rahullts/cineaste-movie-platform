"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Mic,
  X,
  Star,
  Bookmark,
  Check,
  Heart,
  Plus,
  Play,
  Film,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  Compass,
  Trophy,
  Rocket,
  Zap,
  Eye,
  SlidersHorizontal,
  Info,
  Clock,
  Gem,
  Clapperboard,
  Calendar,
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
  type DiscoverFilterState,
} from "@/lib/constants/discover-filters";
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

// Interactive Category Curations with TMDB Mappings
interface CategoryDef {
  id: string;
  label: string;
  icon: string;
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
    icon: "🎬",
    description: "Curated multi-genre discovery feed handpicked for you.",
  },
  {
    id: "adrenaline",
    label: "The Adrenaline Rush",
    icon: "⚡",
    genres: "28,53",
    sortBy: "popularity.desc",
    description: "High-octane action, pulse-pounding chases, and edge-of-your-seat thrillers.",
  },
  {
    id: "sci_fi",
    label: "Sci-Fi & Fantasy",
    icon: "🚀",
    genres: "878,14",
    sortBy: "popularity.desc",
    description: "Mind-bending speculative worlds, futuristic visions, and mythic sagas.",
  },
  {
    id: "critically_acclaimed",
    label: "Critically Acclaimed",
    icon: "🏆",
    sortBy: "vote_average.desc",
    minVotes: 1500,
    description: "Academy Award laureates, Cannes festival winners, and cinematic masterpieces.",
  },
  {
    id: "mind_bending",
    label: "Mind-Bending Noir",
    icon: "🌀",
    genres: "9648,878",
    sortBy: "popularity.desc",
    description: "Psychological labyrinths, cerebral twists, and atmospheric detective noir.",
  },
  {
    id: "hidden_gems",
    label: "Hidden Gems",
    icon: "💎",
    sortBy: "vote_average.desc",
    minVotes: 150,
    maxVotes: 1200,
    description: "Overlooked treasures and indie marvels waiting to be discovered.",
  },
  {
    id: "blockbusters",
    label: "Blockbusters & Hits",
    icon: "🍿",
    sortBy: "popularity.desc",
    description: "Massive crowd-pleasers, box office sensations, and cinema spectacles.",
  },
  {
    id: "cozy",
    label: "Cozy & Heartwarming",
    icon: "☕",
    genres: "35,10751,10749",
    sortBy: "popularity.desc",
    description: "Uplifting stories, feel-good comedies, and warm cinema for the soul.",
  },
  {
    id: "horror",
    label: "Late-Night Thrills",
    icon: "🩸",
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
            <Flame className="w-6 h-6 text-[#F59E0B] shrink-0" />
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Trending Now</span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00D878] bg-[#00D878]/10 border border-[#00D878]/30 px-2.5 py-0.5 rounded-full">
                This Week
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#9496A1] mt-1 font-medium pl-8">
            What cinephiles and viewers across the globe are watching right now.
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous trending films"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white grid place-items-center transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next trending films"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white grid place-items-center transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trending Grid: #1 Spotlight Banner (Left) + Ranked Carousel Rail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ── #1 SPOTLIGHT CARD (Spans 5 Columns on Desktop) ── */}
        <div
          onClick={() => onOpenDetail(heroMovie)}
          className="lg:col-span-5 relative min-h-[380px] sm:min-h-[440px] rounded-3xl overflow-hidden cursor-pointer group shadow-2xl bg-[#0E0F16] border border-white/10 flex flex-col justify-between p-6 sm:p-8 select-none transition-all duration-300 hover:border-[#00D878]/40 hover:shadow-[#00D878]/10"
        >
          {/* Backdrop Image */}
          {heroMovie.backdrop_path && (
            <img
              src={`/api/image?path=${encodeURIComponent(heroMovie.backdrop_path)}&w=1280`}
              alt={heroMovie.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.82]"
              loading="eager"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/65 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F]/90 via-transparent to-transparent pointer-events-none" />

          {/* Top Pill Badges */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FBBF24] text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-[#FBBF24]" />
              <span>#1 Global Spotlight</span>
            </span>

            {/* Quick Actions */}
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
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-md",
                  isHeroSaved
                    ? "bg-[#00D878] text-black border-[#00D878]"
                    : "bg-black/60 hover:bg-black/80 text-white border-white/20 hover:border-[#00D878]/60"
                )}
              >
                {isHeroSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(heroMovie)}
                title={isHeroFav ? "Favorited" : "Add to Favorites"}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-md",
                  isHeroFav
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-black/60 hover:bg-black/80 text-white border-white/20 hover:border-rose-400"
                )}
              >
                <Heart className={cn("w-4 h-4", isHeroFav && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Bottom Information */}
          <div className="relative z-10 space-y-3 pt-12">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold text-white/90">
              <span className="inline-flex items-center gap-1 text-[#FBBF24]">
                <Star className="w-3.5 h-3.5 fill-[#FBBF24]" />
                {heroMovie.vote_average ? formatScore(heroMovie.vote_average) : "8.5"}
              </span>
              <span>•</span>
              <span>{formatYear(heroMovie.release_date) || "2026"}</span>
              {Array.isArray(heroMovie.genres) && heroMovie.genres[0] && (
                <>
                  <span>•</span>
                  <span className="text-[#00D878]">
                    {typeof heroMovie.genres[0] === "string"
                      ? heroMovie.genres[0]
                      : (heroMovie.genres[0] as any)?.name}
                  </span>
                </>
              )}
            </div>

            <h3 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight group-hover:text-[#00D878] transition-colors">
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
        <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
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
                  className="group relative flex-shrink-0 w-44 sm:w-52 h-[380px] sm:h-[440px] rounded-3xl overflow-hidden cursor-pointer select-none bg-[#0E0F16] border border-white/10 hover:border-[#00D878]/50 shadow-xl transition-all duration-300 snap-start flex flex-col justify-between p-4"
                >
                  {/* Poster Art */}
                  {movie.poster_path && (
                    <img
                      src={`/api/image?path=${encodeURIComponent(movie.poster_path)}&w=780`}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Gradient Scrims */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

                  {/* Top: Rank Badge + Quick Actions */}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono font-black text-xs grid place-items-center shadow-lg group-hover:border-[#00D878]/60 group-hover:text-[#00D878] transition-colors">
                      #{rank}
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(movie)}
                        title={isSaved ? "In Watchlist" : "Add to Watchlist"}
                        className={cn(
                          "w-7 h-7 rounded-full grid place-items-center backdrop-blur-md border transition active:scale-90 cursor-pointer shadow-md",
                          isSaved
                            ? "bg-[#00D878] text-black border-[#00D878]"
                            : "bg-black/60 hover:bg-black/80 text-white/90 border-white/20 hover:border-[#00D878]"
                        )}
                      >
                        {isSaved ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(movie)}
                        title={isFav ? "Favorited" : "Add to Favorites"}
                        className={cn(
                          "w-7 h-7 rounded-full grid place-items-center backdrop-blur-md border transition active:scale-90 cursor-pointer shadow-md",
                          isFav
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-black/60 hover:bg-black/80 text-white/90 border-white/20 hover:border-rose-400"
                        )}
                      >
                        <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Score, Title, Year */}
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#FBBF24]">
                      <Star className="w-3 h-3 fill-[#FBBF24]" />
                      <span>{movie.vote_average ? formatScore(movie.vote_average) : "8.0"}</span>
                      <span className="text-white/60 font-normal">• {formatYear(movie.release_date)}</span>
                    </div>

                    <h4 className="font-heading font-black text-sm sm:text-base text-white tracking-tight leading-snug line-clamp-2 group-hover:text-[#00D878] transition-colors">
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
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-[#00D878] transition-colors flex items-center gap-2">
              <span>{title}</span>
            </h2>
          </button>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#9496A1] mt-0.5 font-medium pl-8">
              {subtitle}
            </p>
          )}
        </div>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-mono font-bold text-[#00D878] hover:text-[#00F084] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 pb-1"
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
              className="shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-2xl bg-[#0E0F15] border border-white/5 animate-pulse"
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
        <div className="py-8 text-center text-xs text-[#9496A1] bg-[#0E0F15] rounded-2xl border border-white/5">
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
  const [isAiMode, setIsAiMode] = React.useState(false);
  const [isListeningVoice, setIsListeningVoice] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Filters state
  const [filters, setFilters] = React.useState<DiscoverFilterState>(INITIAL_FILTER_STATE);

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
    const isSaved = Boolean(watchlistMap[movie.tmdb_id || movie.id]);
    if (isSaved) {
      library.removeFromWatchlist(
        watchlistMap[movie.tmdb_id || movie.id]?.id || movie.tmdb_id || movie.id
      );
    } else {
      library.addToWatchlist(movie);
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

  // 3. Search Handler
  const executeSearch = React.useCallback(async (queryText: string, ai: boolean) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (ai) {
        const res = await tmdbAiSearch(queryText.trim());
        setSearchResults(res.results || []);
      } else {
        const res = await tmdbFetch({ action: "search", query: queryText.trim(), page: 1 });
        setSearchResults(res.results || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, isAiMode);
  };

  React.useEffect(() => {
    const q = searchParams.get("q");
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

  const isSearchActive = searchQuery.trim().length > 0;
  const isCategoryActive = selectedCategory !== "all";
  const activeCategoryDef = CINEPHILE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <AppShell>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 space-y-5 sm:space-y-6 pb-28 select-none relative -mt-8 sm:-mt-12">
        {/* Soft Ambient Cinematic Glows for Visual Comfort */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-[#00D878]/[0.035] rounded-full blur-[160px]" />
          <div className="absolute top-1/4 -right-32 w-[650px] h-[650px] bg-[#8B5CF6]/[0.035] rounded-full blur-[170px]" />
          <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-[#F59E0B]/[0.02] rounded-full blur-[150px]" />
        </div>

        {/* ================================================================= */}
        {/* REDESIGNED DISCOVERY HEADER & SIDE SEARCH (Warm, Eye-Friendly)    */}
        {/* ================================================================= */}
        <section
          aria-label="Discover Cinema Header"
          className="relative z-30 flex flex-col lg:flex-row lg:items-end justify-between gap-5 w-full pt-0"
        >
          {/* Left Column: Monumental Cinematic Editorial Typography */}
          <div className="space-y-3 max-w-2xl">
            {/* Luminous Architectural Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/70 text-[11px] font-mono uppercase tracking-[0.22em] backdrop-blur-md shadow-sm">
                <Compass className="w-3.5 h-3.5 text-[#00D878]" />
                <span>Cineaste Editorial • Curated Archive</span>
              </span>
            </div>

            {/* Premium, Monumental Cinema Heading (High-fashion editorial contrast) */}
            <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tighter uppercase leading-[0.95] flex flex-wrap items-baseline gap-x-3.5">
              <span className="text-white drop-shadow-sm">DISCOVER</span>
              <span className="text-white/40 font-light tracking-wider">CINEMA</span>
            </h1>

            {/* Refined, Authoritative Subtitle */}
            <p className="text-xs sm:text-sm text-[#9496A1] font-normal leading-relaxed max-w-xl">
              Explore handpicked auteur masterworks, iconic classics, and the definitive visionary releases shaping contemporary cinema.
            </p>
          </div>

          {/* Right Column: Premium Precision Search Bar & Live Index Badge */}
          <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#11121C]/90 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.6)] focus-within:border-[#00D878]/70 focus-within:bg-[#151624] focus-within:ring-2 focus-within:ring-[#00D878]/20 transition-all w-full sm:w-[420px] lg:w-[480px] backdrop-blur-xl"
            >
              <Search className="w-4 h-4 text-[#00D878] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) setSearchResults([]);
                }}
                placeholder="Search films, directors, actors, or genres..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-[#9496A1] outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1 rounded-md text-[#9496A1] hover:text-white cursor-pointer"
                  title="Clear query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={isListeningVoice ? "Stop voice listening" : "Voice search"}
                className={cn(
                  "p-1.5 rounded-full transition-colors cursor-pointer",
                  isListeningVoice
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-[#9496A1] hover:text-white hover:bg-white/10"
                )}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Advanced Filter Modal */}
              <DiscoverFiltersDialog
                compact
                filters={filters}
                onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                onClear={() => setFilters(INITIAL_FILTER_STATE)}
              />
            </form>

            {/* Consumer-Friendly Live Index Badge */}
            <div className="flex items-center gap-2 pr-3 text-[11px] font-mono text-[#8B92A5]">
              <Film className="w-3.5 h-3.5 text-[#00D878] shrink-0" />
              <span className="font-semibold text-white/90">LIVE TMDB INDEX</span>
              <span>•</span>
              <span className="text-[#00D878]">1,000,000+ Verified Titles</span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SUBHEADINGS & MOOD SELECTOR BAR (Clickable & Fully Connected)     */}
        {/* ================================================================= */}
        <section aria-label="Cinephile Categories" className="w-full pt-1">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {CINEPHILE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border shadow-sm",
                    active
                      ? "bg-[#00D878] text-black font-black border-[#00D878] shadow-lg shadow-[#00D878]/25 scale-105"
                      : "bg-white/[0.05] text-[#9496A1] border-white/10 hover:bg-white/[0.1] hover:text-white hover:border-white/25 active:scale-95"
                  )}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* VIEW 1: TEXT / AI SEARCH RESULTS                                  */}
        {/* ================================================================= */}
        {isSearchActive && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-heading font-black text-xl text-white">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-xs text-[#9496A1]">
                  Found {searchResults.length} matching films in catalog
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-xs font-mono font-bold text-[#00D878] hover:underline cursor-pointer"
              >
                ← Back to Curated Discover
              </button>
            </div>

            {isSearching ? (
              <div className="py-24 text-center text-sm text-[#9496A1] animate-pulse">
                Exploring cinema records...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-20 text-center text-sm text-[#9496A1] bg-[#0E0F15] border border-white/5 rounded-3xl">
                No matching films found. Try another movie title, actor, or genre.
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
        {/* VIEW 2: DEDICATED SUBHEADING / CATEGORY VIEW                       */}
        {/* (e.g. When "The Adrenaline Rush" or "Sci-Fi & Fantasy" is clicked) */}
        {/* ================================================================= */}
        {!isSearchActive && isCategoryActive && activeCategoryDef && (
          <section className="space-y-6 animate-fadeIn">
            {/* Category Banner Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#12131D] via-[#161726] to-[#0E0F16] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeCategoryDef.icon}</span>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
                    {activeCategoryDef.label}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#9496A1] max-w-xl">
                  {activeCategoryDef.description}
                </p>
                <div className="text-xs font-mono font-bold text-[#00D878] pt-1">
                  Showing {categoryMovies.length} Curated Motion Pictures
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold inline-flex items-center gap-2 transition active:scale-95 cursor-pointer relative z-10 shrink-0"
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
                    className="aspect-[2/3] rounded-3xl bg-[#0E0F15] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : categoryMovies.length === 0 ? (
              <div className="py-20 text-center text-sm text-[#9496A1] bg-[#0E0F15] border border-white/5 rounded-3xl">
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
        {!isSearchActive && !isCategoryActive && (
          <div className="space-y-10 sm:space-y-12">
            {/* 1. MODERNIZED TRENDING NOW SHOWCASE */}
            <ModernTrendingSection
              movies={trendingMovies}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 2. THE ADRENALINE RUSH (Connected with working See All) */}
            <ModernDiscoveryRow
              title="The Adrenaline Rush"
              icon={<Zap className="w-5 h-5 text-[#F59E0B]" />}
              subtitle="High-octane action, intense chases, and edge-of-your-seat thrillers"
              movies={adrenalineMovies}
              isLoading={isLoadingSections}
              onSeeAll={() => handleSelectCategory("adrenaline")}
              onOpenDetail={handleOpenDetail}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={(m) => library.toggleFavorite(m)}
              watchlistMap={watchlistMap}
            />

            {/* 3. SCI-FI & FANTASY (Connected with working See All) */}
            <ModernDiscoveryRow
              title="Sci-Fi & Fantasy"
              icon={<Rocket className="w-5 h-5 text-[#8B5CF6]" />}
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
              icon={<Trophy className="w-5 h-5 text-[#FBBF24]" />}
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
              icon={<Gem className="w-5 h-5 text-[#38BDF8]" />}
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
