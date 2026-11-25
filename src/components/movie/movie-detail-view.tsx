"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Heart,
  Bookmark,
  Check,
  Play,
  Share2,
  FolderPlus,
  Clock,
  Calendar,
  Film,
  Building2,
  DollarSign,
  Globe2,
  BookOpen,
  MessageSquare,
  Clapperboard,
  Eye,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Users,
  Tv,
  ChevronLeft,
  ChevronRight,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatScore, formatYear, formatRuntime, cn } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import { useLibrary } from "@/lib/library-store";
import { TrailerModal } from "./trailer-modal";
import { AddToCollectionDialog } from "@/components/library/add-to-collection-dialog";
import type { Movie, MovieStatus } from "@/types";

const LIBRARY_STATUS_LABELS: Record<string, string> = {
  want: "In Watchlist",
  watching: "Currently Watching",
  watched: "Watched",
  dropped: "Dropped",
};

function formatMovieStatusLabel(movie: any): string {
  if (movie?.release_status && !LIBRARY_STATUS_LABELS[movie.release_status]) {
    return movie.release_status;
  }
  const raw = movie?.status;
  if (!raw) return "Released";
  return LIBRARY_STATUS_LABELS[String(raw).toLowerCase()] || String(raw);
}

function formatLanguageName(code: string | null | undefined): string {
  if (!code || typeof code !== "string") return "Unavailable";
  const cleaned = code.trim();
  if (!cleaned) return "Unavailable";
  try {
    const names = new Intl.DisplayNames(["en"], { type: "language" });
    return names.of(cleaned) || cleaned.toUpperCase();
  } catch {
    return cleaned.toUpperCase();
  }
}

export interface MovieDetailViewProps {
  movie: any | null;
  isLoading?: boolean;
}

export function MovieDetailView({ movie, isLoading }: MovieDetailViewProps) {
  const router = useRouter();
  const library = useLibrary();

  // Local interaction states
  const [isTrailerOpen, setIsTrailerOpen] = React.useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = React.useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Sync with library record for authenticated/local user vault
  const tmdbId = movie?.tmdb_id || movie?.id;
  const userMovie = React.useMemo(() => {
    if (!tmdbId || !library.movies) return null;
    return library.movies.find(
      (m) => (m.tmdb_id || m.id) === tmdbId
    );
  }, [library.movies, tmdbId]);

  // Derived user states
  const isInWatchlist = Boolean(
    userMovie && (userMovie.status === "want" || userMovie.status === "watching")
  );
  const isWatched = userMovie?.status === "watched";
  const isFavorite = Boolean(userMovie?.is_favorite);
  const currentStatus: MovieStatus = userMovie?.status || "want";

  // Editable personal review & rating
  const [personalRating, setPersonalRating] = React.useState<number>(
    userMovie?.rating || 0
  );
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [personalReview, setPersonalReview] = React.useState<string>(
    userMovie?.review || ""
  );
  const [isSavingReview, setIsSavingReview] = React.useState(false);
  const [watchedDate, setWatchedDate] = React.useState<string>(() => {
    if (userMovie?.watched_at) return userMovie.watched_at.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });
  const [remindToWatch, setRemindToWatch] = React.useState<boolean>(false);

  // Cast carousel reference and full view toggle
  const castScrollRef = React.useRef<HTMLDivElement>(null);
  const [showAllCast, setShowAllCast] = React.useState(false);

  const scrollCast = (direction: "left" | "right") => {
    if (castScrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      castScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Sync review/rating when userMovie changes
  React.useEffect(() => {
    if (userMovie) {
      if (typeof userMovie.rating === "number") {
        setPersonalRating(userMovie.rating);
      }
      if (typeof userMovie.review === "string") {
        setPersonalReview(userMovie.review);
      }
      if (userMovie.watched_at) {
        setWatchedDate(userMovie.watched_at.slice(0, 10));
      }
    }
  }, [userMovie]);

  // Toast auto-dismiss
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Watchlist Toggle
  const handleToggleWatchlist = () => {
    if (!movie) return;
    if (isInWatchlist) {
      library.removeFromWatchlist(tmdbId);
      showToast("Removed from your Watchlist");
    } else {
      library.addToWatchlist({
        id: tmdbId,
        tmdb_id: tmdbId,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime,
        genres: movie.genres,
        genre_ids: movie.genre_ids,
        status: "want",
      });
      showToast("Saved to your Watchlist");
    }
  };

  // Favorite Toggle
  const handleToggleFavorite = () => {
    if (!movie) return;
    const baseMovie = userMovie || {
      id: tmdbId,
      tmdb_id: tmdbId,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      runtime: movie.runtime,
      genres: movie.genres,
      status: "want" as MovieStatus,
      is_favorite: false,
    };
    library.toggleFavorite(baseMovie);
    showToast(isFavorite ? "Removed from Favorites" : "Added to Favorites");
  };

  // Watched Toggle
  const handleToggleWatched = () => {
    if (!movie) return;
    if (isWatched) {
      library.updateStatus(tmdbId, "want");
      showToast("Moved to Watchlist (Unwatched)");
    } else {
      library.markWatched(
        {
          id: tmdbId,
          tmdb_id: tmdbId,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          runtime: movie.runtime,
          genres: movie.genres,
        },
        personalRating || 0,
        personalReview
      );
      showToast("Marked as Watched");
    }
  };

  // Status Switcher
  const handleStatusChange = (status: MovieStatus) => {
    if (!movie) return;
    if (userMovie) {
      library.updateStatus(tmdbId, status);
    } else {
      library.addToWatchlist({
        id: tmdbId,
        tmdb_id: tmdbId,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime,
        genres: movie.genres,
        status,
      });
    }
    showToast(`Status changed to ${LIBRARY_STATUS_LABELS[status] || status}`);
  };

  // Rating Change
  const handleRatingSelect = (score: number) => {
    setPersonalRating(score);
    if (!movie) return;
    if (userMovie) {
      library.updateRating(tmdbId, score, personalReview);
    } else {
      library.markWatched(
        {
          id: tmdbId,
          tmdb_id: tmdbId,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          runtime: movie.runtime,
          genres: movie.genres,
        },
        score,
        personalReview
      );
    }
    showToast(`Rated ${score}/10`);
  };

  const handleClearRating = () => {
    setPersonalRating(0);
    if (userMovie) {
      library.updateRating(tmdbId, 0, personalReview);
      showToast("Personal rating cleared");
    }
  };

  // Save Review Notes
  const handleSaveReview = () => {
    if (!movie) return;
    setIsSavingReview(true);
    if (userMovie) {
      library.updateRating(tmdbId, personalRating, personalReview);
    } else {
      library.addToWatchlist({
        id: tmdbId,
        tmdb_id: tmdbId,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime,
        genres: movie.genres,
        rating: personalRating,
        review: personalReview,
        status: "want",
      });
    }
    setTimeout(() => {
      setIsSavingReview(false);
      showToast("Personal screening notes saved");
    }, 400);
  };

  const handleClearReview = () => {
    setPersonalReview("");
    if (userMovie) {
      library.updateRating(tmdbId, personalRating, "");
      showToast("Notes cleared");
    }
  };

  // Share
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = movie?.title ? `${movie.title} on Cineaste` : "Cineaste Film Vault";
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: movie?.overview ? movie.overview.slice(0, 100) + "..." : "Explore this film on Cineaste",
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Movie link copied to clipboard!");
    } catch {
      showToast("Could not copy link");
    }
  };

  // Back Navigation
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  // Artwork resolution
  const backdropUrl = movie?.backdrop_path
    ? getTmdbImageUrl(movie.backdrop_path, "original") || getTmdbImageUrl(movie.backdrop_path, "w1280")
    : null;
  const posterUrl = movie?.poster_path
    ? getTmdbImageUrl(movie.poster_path, "w780")
    : null;

  // Formatting helpers
  const genreList: string[] = (movie?.genres || [])
    .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
    .filter(Boolean);

  const directorName =
    movie?.director ||
    movie?.directors?.[0]?.name ||
    movie?.crew?.find((c: any) => c.job === "Director")?.name ||
    null;

  const writersList = (movie?.writers || movie?.crew?.filter((c: any) => c.department === "Writing") || [])
    .map((w: any) => w.name)
    .filter(Boolean)
    .slice(0, 3);

  const castList = (movie?.cast || []).slice(0, 16);
  const recommendationsList = (movie?.recommendations || movie?.similar || []).slice(0, 12);

  // Extract US or global streaming providers
  const providersObj = movie?.providers?.US || movie?.providers?.IN || Object.values(movie?.providers || {})[0] as any;
  const flatrateProviders = providersObj?.flatrate || [];
  const rentProviders = providersObj?.rent || [];
  const buyProviders = providersObj?.buy || [];

  // Key creative crew members
  const keyCrew = React.useMemo(() => {
    if (!movie?.crew || !Array.isArray(movie.crew)) return [];
    const priorityJobs = [
      "Director",
      "Screenplay",
      "Writer",
      "Director of Photography",
      "Original Music Composer",
      "Producer",
    ];
    const seen = new Set<string>();
    const crewList: { id: number; name: string; job: string }[] = [];
    priorityJobs.forEach((targetJob) => {
      const matches = movie.crew.filter((c: any) => c.job === targetJob);
      matches.forEach((m: any) => {
        const key = `${m.name}-${m.job}`;
        if (!seen.has(key)) {
          seen.add(key);
          crewList.push({ id: m.id, name: m.name, job: m.job });
        }
      });
    });
    return crewList.slice(0, 8);
  }, [movie?.crew]);

  const renderCastCard = (actor: any, inGrid = false) => {
    const profileUrl = actor.profile_path
      ? getTmdbImageUrl(actor.profile_path, "w342")
      : null;
    return (
      <div
        key={actor.id || actor.name}
        onClick={() => router.push(`/discover?q=${encodeURIComponent(actor.name)}`)}
        className={`group relative flex flex-col ${inGrid ? "w-full" : "shrink-0 w-36 sm:w-44 lg:w-48"} cursor-pointer select-none`}
      >
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#141520] shadow-xl shadow-black/60 group-hover:shadow-2xl group-hover:shadow-black/90 group-hover:-translate-y-1 transition-all duration-300">
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={actor.name}
              fill
              sizes="(max-width: 640px) 144px, 192px"
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#181926] to-[#0E0F17]">
              <div className="w-12 h-12 rounded-full bg-white/5 text-[#00D878] flex items-center justify-center font-bold text-sm">
                {actor.name?.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-semibold text-white/90 mt-2 line-clamp-2">{actor.name}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="pt-2.5 px-0.5">
          <p className="text-sm font-bold text-white group-hover:text-[#00D878] transition-colors truncate">
            {actor.name}
          </p>
          <p className="text-xs text-[#8B92A5] font-medium truncate mt-0.5">
            {actor.character || "Cast"}
          </p>
        </div>
      </div>
    );
  };

  // Skeleton Loading State
  if (isLoading && !movie) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] animate-pulse">
        {/* Hero Skeleton */}
        <div className="relative w-full h-[65vh] min-h-[500px] bg-[#101118]">
          <div className="absolute top-6 left-6 w-24 h-9 rounded-full bg-white/10" />
          <div className="absolute bottom-10 left-6 right-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="w-48 sm:w-60 aspect-[2/3] rounded-2xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-4 w-full">
              <div className="w-1/3 h-5 bg-white/10 rounded-full" />
              <div className="w-3/4 h-12 bg-white/10 rounded-xl" />
              <div className="w-full h-16 bg-white/10 rounded-xl" />
              <div className="flex gap-3">
                <div className="w-36 h-11 bg-white/10 rounded-full" />
                <div className="w-28 h-11 bg-white/10 rounded-full" />
                <div className="w-11 h-11 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found fallback
  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-16 h-16 text-[#00D878]/40 mb-4 animate-bounce" />
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
          Film Not Found
        </h1>
        <p className="text-sm text-[#9496A1] max-w-md mt-2">
          We could not load information for this film from TMDB or your personal library.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-6 py-2.5 rounded-full bg-[#00D878] text-black font-semibold text-sm hover:bg-[#00B855] transition shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#F3F4F6] selection:bg-[#00D878] selection:text-black">
      {/* =================================================================== */}
      {/* 1. CINEMATIC HERO (Snug, atmospheric, no dark canyon)              */}
      {/* =================================================================== */}
      <section
        aria-label={`Cinematic presentation of ${movie.title}`}
        className="relative w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[58vh] flex flex-col justify-end overflow-hidden"
      >
        {/* Full-Bleed Atmospheric Backdrop — vivid, natural movie artwork */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center lg:object-[center_20%] transition-opacity duration-700"
            />
          ) : posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              priority
              sizes="100vw"
              className="object-cover filter blur-2xl brightness-75 scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#14151F] via-[#0A0B0F] to-black" />
          )}

          {/* Crisp Targeted Vignette ONLY behind typography — keep artwork & poster vivid, never dull */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#0A0B0F]/75 via-[#0A0B0F]/25 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-gradient-to-r from-[#0A0B0F]/88 via-[#0A0B0F]/55 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#0A0B0F] via-[#0A0B0F]/65 to-transparent pointer-events-none" />
        </div>

        {/* Hero Content Composition with Independent Back Control Row Above Poster */}
        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-6 sm:pb-8 pt-20 sm:pt-22 flex flex-col gap-5 sm:gap-6">
          {/* Independent Back Navigation Control — borderless dark circle pill above poster */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to previous page"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151722]/85 hover:bg-[#222536] text-[#F3F4F6] hover:text-white backdrop-blur-md text-xs sm:text-sm font-medium transition-all shadow-lg group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#00D878] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 lg:gap-10">
          {/* Left Poster (Borderless, vivid 2:3 artwork, zero outline) */}
          <div
            data-testid="movie-detail-poster"
            className="relative w-44 sm:w-56 md:w-64 lg:w-72 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151F] shadow-2xl shadow-black/90 group select-none focus:outline-none"
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                priority
                sizes="(max-width: 640px) 176px, (max-width: 768px) 224px, 288px"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#9496A1] bg-[#14151F]">
                <Film className="w-10 h-10 text-[#00D878]/40 mb-2" />
                <span className="text-xs font-semibold text-white line-clamp-2">
                  {movie.title}
                </span>
              </div>
            )}
          </div>

          {/* Right Information & Action Area */}
          <div className="flex-1 min-w-0 w-full flex flex-col justify-end text-center md:text-left">
            {/* Highlighted Year, Runtime & Rating Badges Strip */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-medium tabular-nums">
              {movie.certification && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold text-white uppercase tracking-wider text-xs">
                  {movie.certification}
                </span>
              )}

              {movie.release_date && (
                <span
                  data-testid="detail-highlight-year"
                  className="px-3 py-1 rounded-full bg-white/15 text-white font-semibold inline-flex items-center gap-1.5 backdrop-blur-md"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#00D878]" />
                  <span>{formatYear(movie.release_date)}</span>
                </span>
              )}

              {movie.runtime ? (
                <span
                  data-testid="detail-highlight-runtime"
                  className="px-3 py-1 rounded-full bg-white/15 text-white font-semibold inline-flex items-center gap-1.5 backdrop-blur-md"
                >
                  <Clock className="w-3.5 h-3.5 text-[#00D878]" />
                  <span>{formatRuntime(movie.runtime)}</span>
                </span>
              ) : null}

              {typeof movie.imdb_rating === "number" && movie.imdb_rating > 0 && (
                <span
                  data-testid="detail-highlight-imdb"
                  title="Verified IMDb Rating"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBBF24]/25 text-[#FCD34D] font-semibold backdrop-blur-md"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>IMDb {formatScore(movie.imdb_rating)}</span>
                </span>
              )}

              {typeof movie.letterboxd_rating === "number" && movie.letterboxd_rating > 0 && (
                <span
                  title="Verified Letterboxd Rating"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white font-semibold backdrop-blur-md"
                >
                  <span>Letterboxd {formatScore(movie.letterboxd_rating)}</span>
                </span>
              )}

              {typeof movie.vote_average === "number" && movie.vote_average > 0 && (
                <span
                  data-testid="detail-highlight-tmdb"
                  title="TMDB Community Score"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBBF24]/20 text-[#FCD34D] font-semibold backdrop-blur-md"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>TMDB {formatScore(movie.vote_average)}</span>
                </span>
              )}

              {personalRating > 0 && (
                <span
                  title="Your Personal Cineaste Rating"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D878]/20 text-[#4ADE80] font-semibold backdrop-blur-md"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Personal {personalRating.toFixed(1)}/10</span>
                </span>
              )}
            </div>

            {/* Movie Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold font-heading tracking-[-0.02em] text-white leading-[1.08] mt-3 sm:mt-3.5">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-base sm:text-lg lg:text-xl font-serif italic text-white/85 mt-1.5 font-normal line-clamp-2">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            {/* Director Credit & Prominently Highlighted Genre Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2.5 mt-3.5 text-xs sm:text-sm">
              {directorName && (
                <p className="text-[#E2E6F0] font-medium">
                  Directed by{" "}
                  <span className="text-[#00D878] font-semibold">
                    {directorName}
                  </span>
                </p>
              )}

              {genreList.length > 0 && (
                <div data-testid="detail-highlight-genres" className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {genreList.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => router.push(`/discover?q=${encodeURIComponent(g)}`)}
                      className="px-3.5 py-1 rounded-full bg-[#00D878]/20 hover:bg-[#00D878]/30 text-xs sm:text-[13px] text-[#4ADE80] font-semibold tracking-wide transition cursor-pointer shadow-sm"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row (Matching Reference horizontal layout) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 pt-5 sm:pt-6">
              {/* Watchlist Button */}
              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={cn(
                  "h-10 sm:h-11 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer",
                  isInWatchlist
                    ? "bg-[#00D878] text-black shadow-[#00D878]/25 hover:bg-[#00B855]"
                    : "bg-[#1E1F2A] hover:bg-[#282A38] text-white"
                )}
              >
                {isInWatchlist ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>

              {/* Trailer Button */}
              {movie.trailer_key ? (
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(true)}
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current text-[#00D878]" />
                  <span>Trailer</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="No trailer available for this title"
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white/5 text-[#9496A1]/60 text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-not-allowed"
                >
                  <Play className="w-4 h-4 opacity-40" />
                  <span>Trailer</span>
                </button>
              )}

              {/* Watched Status Toggle Button */}
              <button
                type="button"
                onClick={handleToggleWatched}
                title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                className={cn(
                  "h-10 sm:h-11 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer",
                  isWatched
                    ? "bg-[#00D878]/20 text-[#00D878] hover:bg-[#00D878]/30"
                    : "bg-[#1E1F2A] hover:bg-[#282A38] text-white hover:text-white"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isWatched ? "Watched" : "Mark Watched"}</span>
              </button>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                title={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
                className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full grid place-items-center transition-all shadow-lg active:scale-95 cursor-pointer",
                  isFavorite
                    ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"
                    : "bg-[#1E1F2A] hover:bg-[#282A38] text-[#9496A1] hover:text-white"
                )}
              >
                <Heart
                  className={cn(
                    "w-4 h-4 sm:w-4.5 sm:h-4.5",
                    isFavorite && "fill-current"
                  )}
                />
              </button>

              {/* Collection Button */}
              <button
                type="button"
                onClick={() => setIsCollectionDialogOpen(true)}
                title="Add to Collection"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1E1F2A] hover:bg-[#282A38] text-[#9496A1] hover:text-white grid place-items-center transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                title="Share Movie Link"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1E1F2A] hover:bg-[#282A38] text-[#9496A1] hover:text-white grid place-items-center transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. PERSONAL CINEMA LOG (Masterclass Two-Panel Film Journal)         */}
      {/* =================================================================== */}
      <section
        aria-label="Your personal cinema log"
        className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 sm:pt-8 relative z-10"
      >
        <div className="rounded-3xl bg-gradient-to-br from-[#12141E]/95 via-[#0E1018]/95 to-[#0B0C12] p-5 sm:p-8 lg:p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* Subtle ambient glow */}
          <div className="absolute -top-28 -right-28 w-80 h-80 bg-[#00D878]/[0.045] rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 items-stretch">
            {/* --------------------------------------------------------------- */}
            {/* LEFT: YOUR CINEMA LOG (Rating + Status + Screening Controls)    */}
            {/* --------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-[#00D878]">
                  <Bookmark className="w-3.5 h-3.5 shrink-0" />
                  <span>Personal Vault</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight text-white">
                  Your Cinema Log
                </h2>
                <p className="text-xs sm:text-[13px] text-[#9499AC]">
                  Rate, track your viewing status, and log screening dates.
                </p>
              </div>

              {/* Personal Score Card */}
              <div className="rounded-2xl bg-white/[0.035] p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#9499AC]">
                    Personal Rating
                  </span>
                  {personalRating > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRating}
                      className="text-xs text-[#9499AC] hover:text-rose-400 transition cursor-pointer"
                    >
                      Clear Rating
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {(hoverRating || personalRating) > 0 ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-heading font-semibold text-white tabular-nums tracking-tight">
                        {hoverRating || personalRating}
                      </span>
                      <span className="text-sm text-[#8B92A5] font-medium tabular-nums">
                        / 10
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-heading font-medium text-[#8B92A5]">
                      Not Rated Yet
                    </span>
                  )}

                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      (hoverRating || personalRating) > 0
                        ? "bg-[#00D878]/15 text-[#00D878]"
                        : "bg-white/[0.05] text-[#9499AC]"
                    )}
                  >
                    {(hoverRating || personalRating) >= 9
                      ? "Masterpiece"
                      : (hoverRating || personalRating) >= 8
                      ? "Great"
                      : (hoverRating || personalRating) >= 7
                      ? "Good"
                      : (hoverRating || personalRating) >= 5
                      ? "Average"
                      : (hoverRating || personalRating) > 0
                      ? "Poor"
                      : "Tap star to rate"}
                  </span>
                </div>

                {/* Crisp 10-Star Interactive Track */}
                <div
                  className="flex items-center justify-between gap-0.5 sm:gap-1 rounded-xl bg-[#090A0F]/65 px-2.5 py-2"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                    const isFilled = (hoverRating || personalRating) >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        aria-label={`Rate ${starVal} out of 10`}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onClick={() => handleRatingSelect(starVal)}
                        className="p-1 sm:p-1.5 rounded-lg hover:bg-white/[0.07] hover:scale-110 transition-all focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-150",
                            isFilled
                              ? "text-[#FBBF24] fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                              : "text-white/25 hover:text-[#FBBF24]/80"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Balanced Segmented Watch Status */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#9499AC] block">
                  Watch Status
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "want", label: "Watchlist", icon: Bookmark },
                    { key: "watching", label: "Watching", icon: Play },
                    { key: "watched", label: "Watched", icon: CheckCircle2 },
                    { key: "dropped", label: "Dropped", icon: Trash2 },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = currentStatus === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => handleStatusChange(s.key as MovieStatus)}
                        className={cn(
                          "h-10 px-2.5 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                          isActive
                            ? "bg-[#00D878]/18 text-[#00D878] font-semibold"
                            : "bg-white/[0.04] text-[#9499AC] hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unified Screening Date & Reminder Row */}
              <div className="rounded-2xl bg-white/[0.035] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-[#9499AC]">
                  <Calendar className="w-3.5 h-3.5 text-[#00D878] shrink-0" />
                  <span>Screening Date</span>
                  <input
                    type="date"
                    value={watchedDate}
                    onChange={(e) => setWatchedDate(e.target.value)}
                    className="bg-[#090A0F]/80 text-xs text-white rounded-xl px-3 py-1.5 outline-none border-0 focus:bg-[#090A0F] transition [color-scheme:dark]"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRemindToWatch(!remindToWatch);
                    showToast(!remindToWatch ? "Reminder set for this film" : "Reminder removed");
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer",
                    remindToWatch
                      ? "bg-[#00D878]/18 text-[#00D878] font-semibold"
                      : "bg-white/[0.05] text-[#B4B9C9] hover:bg-white/[0.09] hover:text-white"
                  )}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{remindToWatch ? "Reminder Active" : "Remind to Watch"}</span>
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* RIGHT: YOUR THOUGHTS (Unified Journal Card)                     */}
            {/* --------------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#00D878]">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Private Impressions</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight text-white">
                    Your Thoughts
                  </h3>
                </div>
                {personalReview && (
                  <button
                    type="button"
                    onClick={handleClearReview}
                    className="text-xs text-[#9499AC] hover:text-rose-400 transition cursor-pointer mt-1"
                  >
                    Clear Notes
                  </button>
                )}
              </div>

              <div className="flex-1 rounded-2xl bg-[#090A0F]/75 p-4 sm:p-5 flex flex-col justify-between gap-4">
                <textarea
                  value={personalReview}
                  onChange={(e) => setPersonalReview(e.target.value)}
                  rows={6}
                  placeholder="Write your reflections, favorite scenes, or who you watched this with..."
                  className="w-full flex-1 min-h-[160px] bg-transparent text-sm sm:text-[15px] text-white placeholder:text-[#7E8498] outline-none border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-[#8B92A5]">
                    {personalReview.length > 0
                      ? `${personalReview.length} characters • Synced to vault`
                      : "Saved privately to your personal vault"}
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={isSavingReview}
                    className="px-5 py-2.5 rounded-full bg-[#00D878] hover:bg-[#00C26B] text-[#050608] text-xs font-semibold transition shadow-lg shadow-[#00D878]/15 inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSavingReview ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Save Review</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. THE STORY (Movie Overview)                                       */}
      {/* =================================================================== */}
      {movie.overview && (
        <section
          aria-label="The Story"
          className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#00D878] shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#00D878] font-bold">
                Synopsis
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold font-heading tracking-[-0.015em] text-white mt-1">
              The Story
            </h2>

            {movie.tagline && (
              <blockquote className="text-lg sm:text-xl lg:text-2xl font-serif italic text-white/90 border-l-2 border-[#00D878] pl-4 sm:pl-6 my-4 leading-relaxed max-w-4xl">
                &ldquo;{movie.tagline}&rdquo;
              </blockquote>
            )}

            <div className="max-w-4xl text-base sm:text-lg lg:text-xl text-[#D1D5DB] leading-relaxed font-normal space-y-4">
              <p>
                {isOverviewExpanded || movie.overview.length <= 320
                  ? movie.overview
                  : `${movie.overview.slice(0, 320)}...`}
              </p>

              {movie.overview.length > 320 && (
                <button
                  type="button"
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                  className="text-xs font-semibold text-[#00D878] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isOverviewExpanded ? "Read Less" : "Read Full Story"}</span>
                  {isOverviewExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 4. BEHIND THE FILM (Movie Information & Production)                 */}
      {/* =================================================================== */}
      <section
        aria-label="Behind the Film"
        className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Clapperboard className="w-3.5 h-3.5 text-[#00D878] shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#00D878] font-bold">
                Production & Specifications
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold font-heading tracking-[-0.015em] text-white mt-1">
              Behind the Film
            </h2>
          </div>

          {/* Responsive 4-Column Editorial Grid (Clean typography, no borders) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-sm">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Status
              </p>
              <p className="text-white font-bold text-base sm:text-lg">
                {formatMovieStatusLabel(movie)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Release Date
              </p>
              <p className="text-white font-bold text-base sm:text-lg">
                {movie.release_date
                  ? new Date(movie.release_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Runtime
              </p>
              <p className="text-white font-bold text-base sm:text-lg">
                {movie.runtime ? `${movie.runtime} min (${formatRuntime(movie.runtime)})` : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Original Language
              </p>
              <p className="text-white font-bold text-base sm:text-lg">
                {formatLanguageName(movie.original_language)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Director
              </p>
              <p className="text-white font-bold text-base sm:text-lg">
                {directorName || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Screenplay / Writers
              </p>
              <p className="text-white font-bold text-base sm:text-lg truncate">
                {writersList.join(", ") || directorName || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Budget
              </p>
              <p className="text-white font-bold text-base sm:text-lg font-mono">
                {movie.budget && movie.budget > 0
                  ? `$${movie.budget.toLocaleString("en-US")}`
                  : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Revenue / Box Office
              </p>
              <p className="text-white font-bold text-base sm:text-lg font-mono">
                {movie.revenue && movie.revenue > 0
                  ? `$${movie.revenue.toLocaleString("en-US")}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Production Companies */}
          {movie.production_companies && movie.production_companies.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                Production Companies
              </p>
              <div className="flex flex-wrap gap-2">
                {movie.production_companies.map((co: any) => {
                  const companyName = typeof co === "string" ? co : co?.name;
                  if (!companyName) return null;
                  return (
                    <span
                      key={companyName}
                      className="px-3.5 py-1.5 rounded-xl bg-[#141520] text-xs text-[#D1D5DB] font-medium shadow-sm"
                    >
                      {companyName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Where to Watch Sub-Rail */}
          {(flatrateProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0) && (
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#8B92A5]">
                  Where to Watch (Powered by JustWatch)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {flatrateProviders.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0E1017] space-y-2.5 shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00D878] font-bold">
                      Streaming Subscription
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {flatrateProviders.map((p: any) => (
                        <div
                          key={p.provider_id || p.provider_name}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141520] text-xs text-white"
                        >
                          {p.logo_path && (
                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
                              <Image
                                src={getTmdbImageUrl(p.logo_path, "w92") || ""}
                                alt={p.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium">{p.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rentProviders.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0E1017] space-y-2.5 shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#FBBF24] font-bold">
                      Rent Online
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rentProviders.slice(0, 6).map((p: any) => (
                        <div
                          key={p.provider_id || p.provider_name}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141520] text-xs text-white"
                        >
                          {p.logo_path && (
                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
                              <Image
                                src={getTmdbImageUrl(p.logo_path, "w92") || ""}
                                alt={p.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium">{p.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {buyProviders.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0E1017] space-y-2.5 shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B92A5] font-bold">
                      Buy Digital
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {buyProviders.slice(0, 6).map((p: any) => (
                        <div
                          key={p.provider_id || p.provider_name}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141520] text-xs text-white"
                        >
                          {p.logo_path && (
                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
                              <Image
                                src={getTmdbImageUrl(p.logo_path, "w92") || ""}
                                alt={p.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium">{p.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. THE PEOPLE BEHIND THE FILM (Editorial Visionaries & Cast)        */}
      {/* =================================================================== */}
      {castList.length > 0 && (
        <section
          aria-label="The People Behind the Film"
          className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#00D878] font-semibold mb-1">
                CREATIVE ENSEMBLE
              </p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-xl sm:text-2xl font-heading font-semibold tracking-[-0.015em] text-white">
                  The People Behind the Film
                </h3>
                <span className="text-xs text-[#9496A1] font-sans tabular-nums">
                  ({movie.cast?.length || castList.length} members)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllCast(!showAllCast)}
                className="text-xs font-semibold text-[#00D878] hover:text-[#00B855] transition px-3.5 py-2 rounded-full bg-[#101118] hover:bg-[#151622] cursor-pointer"
              >
                {showAllCast ? "Show Carousel" : "View Full Cast"}
              </button>
              {!showAllCast && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => scrollCast("left")}
                    aria-label="Scroll left"
                    className="w-8 h-8 rounded-full bg-[#101118] text-white hover:bg-[#151622] grid place-items-center transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCast("right")}
                    aria-label="Scroll right"
                    className="w-8 h-8 rounded-full bg-[#101118] text-white hover:bg-[#151622] grid place-items-center transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Key Creative Visionaries Sub-strip */}
          {keyCrew.length > 0 && (
            <div className="mb-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9496A1] mb-3">
                Key Creative Visionaries
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {keyCrew.map((c) => (
                  <button
                    key={`${c.id}-${c.job}`}
                    type="button"
                    onClick={() => router.push(`/discover?q=${encodeURIComponent(c.name)}`)}
                    className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101118] hover:bg-[#151622] transition-colors text-left cursor-pointer"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00D878]/90 bg-[#00D878]/10 px-1.5 py-0.5 rounded">
                      {c.job}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#00D878] transition-colors">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cast Gallery */}
          {showAllCast ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
              {castList.map((actor: any) => renderCastCard(actor, true))}
            </div>
          ) : (
            <div
              ref={castScrollRef}
              className="flex items-start gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#1E1F2A] scrollbar-track-transparent"
            >
              {castList.map((actor: any) => renderCastCard(actor, false))}
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* 6. YOUR NEXT OBSESSION (Curated Editorial Recommendations)         */}
      {/* =================================================================== */}
      {recommendationsList.length > 0 && (
        <section
          aria-label="Your Next Obsession"
          className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 pb-32"
        >
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#00D878] font-semibold mb-1">
              CURATED DISCOVERY
            </p>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
              <h3 className="text-xl sm:text-2xl font-heading font-semibold tracking-[-0.015em] text-white">
                Your Next Obsession
              </h3>
              <p className="text-xs sm:text-sm text-[#9496A1] italic font-serif">
                Films that might stay with you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {recommendationsList.map((rec: any) => {
              const recPoster = rec.poster_path
                ? getTmdbImageUrl(rec.poster_path, "w780")
                : null;
              const recId = rec.tmdb_id || rec.id;
              return (
                <div
                  key={recId}
                  onClick={() => {
                    router.push(`/movie/${recId}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group relative flex flex-col cursor-pointer select-none"
                >
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#101118] shadow-xl shadow-black/60 group-hover:shadow-2xl group-hover:shadow-black/90 group-hover:-translate-y-1.5 transition-all duration-300">
                    {recPoster ? (
                      <Image
                        src={recPoster}
                        alt={rec.title}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                        <Film className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                    {typeof rec.imdb_rating === "number" && rec.imdb_rating > 0 ? (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-semibold tabular-nums text-[#FBBF24] flex items-center gap-1 shadow-md">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>IMDb {formatScore(rec.imdb_rating)}</span>
                      </div>
                    ) : typeof rec.letterboxd_rating === "number" && rec.letterboxd_rating > 0 ? (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-semibold tabular-nums text-white shadow-md">
                        <span>LB {formatScore(rec.letterboxd_rating)}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2.5 px-0.5 space-y-0.5">
                    <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-white truncate group-hover:text-[#00D664] transition-colors">
                      {rec.title}
                    </p>
                    <p className="text-xs sm:text-[13px] font-medium text-[#D0D4E0] tabular-nums">
                      {formatYear(rec.release_date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#00D878] text-black text-xs sm:text-sm font-bold shadow-2xl shadow-[#00D878]/30 border border-white/20 animate-slideUp flex items-center gap-2 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* YouTube Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerKey={movie.trailer_key}
        movieTitle={movie.title}
      />

      {/* Add To Collection Modal */}
      <AddToCollectionDialog
        isOpen={isCollectionDialogOpen}
        onClose={() => setIsCollectionDialogOpen(false)}
        movie={{
          id: tmdbId,
          tmdb_id: tmdbId,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          runtime: movie.runtime,
          genres: movie.genres,
        }}
        collections={library.collections}
        onToggleInCollection={(colId, m) => {
          const col = library.collections.find((c) => c.id === colId);
          const hasMovie = col?.movie_ids?.includes(tmdbId);
          if (hasMovie) {
            library.removeMovieFromCollection(colId, tmdbId);
            showToast("Removed from collection");
          } else {
            library.addMovieToCollection(colId, m);
            showToast("Added to collection");
          }
        }}
        onCreateCollection={(title, color, description, initialMovies) => {
          library.createCollection(title, color, description, initialMovies);
          showToast(`Created collection "${title}"`);
        }}
      />
    </div>
  );
}
