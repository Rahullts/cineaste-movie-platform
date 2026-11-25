"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Star,
  Heart,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  Film,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { formatScore, formatYear, formatRuntime } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import { StarRating } from "@/components/dashboard/star-rating";
import { tmdbFetch } from "@/lib/tmdb-service";
import {
  VaultMark,
  OrbitMark,
  CompletionFrameMark,
  CuratedStar,
} from "./watchlist-icons";
import type { Movie, MovieStatus } from "@/types";

interface WatchlistDetailSheetProps {
  movie: Movie | null;
  onClose: () => void;
  onUpdateStatus: (tmdbId: number, status: MovieStatus) => void;
  onUpdateRating: (tmdbId: number, rating?: number, review?: string) => void;
  onToggleFavorite: (movie: Movie) => void;
  onRemove: (id: number) => void;
  onTrackViewed?: (movie: Movie) => void;
}

/**
 * Cineaste Personal Film Archive — Detail Slide-Over Sheet
 * Deep charcoal drawer with full backdrop artwork, cast credits,
 * status switcher, 10-star rating, and review notes.
 */
export function WatchlistDetailSheet({
  movie,
  onClose,
  onUpdateStatus,
  onUpdateRating,
  onToggleFavorite,
  onRemove,
  onTrackViewed,
}: WatchlistDetailSheetProps) {
  const [userRating, setUserRating] = React.useState<number>(movie?.rating || 0);
  const [userReview, setUserReview] = React.useState<string>(movie?.review || "");
  const [cast, setCast] = React.useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  React.useEffect(() => {
    if (movie) {
      onTrackViewed?.(movie);
      const tmdbId = movie.tmdb_id || movie.id;
      setUserRating(movie.rating || 0);
      setUserReview(movie.review || "");

      // Fetch additional cast credits & details if tmdb_id exists
      let isCancelled = false;
      async function loadDetails() {
        if (!tmdbId) return;
        setIsLoadingDetails(true);
        try {
          const data = await tmdbFetch({ action: "details", id: tmdbId });
          if (!isCancelled && data) {
            setCast((data as any).cast?.slice(0, 8) || []);
          }
        } catch {
          // clean fallback
        } finally {
          if (!isCancelled) setIsLoadingDetails(false);
        }
      }
      loadDetails();
      return () => {
        isCancelled = true;
      };
    }
  }, [movie]);

  if (!movie) return null;

  const backdropUrl = getTmdbImageUrl(movie.backdrop_path, "w1280");
  const posterUrl = getTmdbImageUrl(movie.poster_path, "w500");

  const genreNames = (movie.genres || [])
    .map((g: any) => (typeof g === "string" ? g : g?.name || ""))
    .filter(Boolean);

  const handleRatingChange = (newRating: number) => {
    setUserRating(newRating);
    onUpdateRating(movie.tmdb_id || movie.id, newRating, userReview);
  };

  const handleReviewBlur = () => {
    onUpdateRating(movie.tmdb_id || movie.id, userRating, userReview);
  };

  const statuses: { key: MovieStatus; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "want", label: "In Watchlist", icon: VaultMark },
    { key: "watching", label: "Watching", icon: OrbitMark },
    { key: "watched", label: "Watched", icon: CompletionFrameMark },
    { key: "dropped", label: "Dropped", icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#101118] border-l border-[#1E1F2A] shadow-2xl flex flex-col overflow-y-auto no-scrollbar animate-slideLeft">
          {/* Header Backdrop Banner */}
          <div className="relative h-64 sm:h-72 w-full bg-[#14151F] shrink-0 overflow-hidden">
            {backdropUrl ? (
              <Image
                src={backdropUrl}
                alt={movie.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                <Film className="w-12 h-12 opacity-30" />
              </div>
            )}

            {/* Gradient Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101118] via-[#101118]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#101118]/70 via-transparent to-transparent" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-[#9496A1] hover:text-white border border-white/10 flex items-center justify-center transition backdrop-blur-md z-10"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Floating Poster & Title Overlay */}
            <div className="absolute bottom-4 left-5 right-5 flex items-end gap-4">
              <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-[#14151F] border-2 border-[#1E1F2A] shadow-2xl shrink-0">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#9496A1]">
                    <Film className="w-6 h-6 opacity-40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00D878] font-semibold">
                  Archive Record
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-white truncate leading-tight mt-0.5">
                  {movie.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#9496A1] font-mono mt-1">
                  <span>{formatYear(movie.release_date)}</span>
                  {movie.runtime ? <span>• {formatRuntime(movie.runtime)}</span> : null}
                  {(movie.vote_average || 0) > 0 && (
                    <span title="TMDB Community Score" className="flex items-center gap-1 text-[#FBBF24]">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] text-white/70">TMDB</span>
                      {formatScore(movie.vote_average)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-5 sm:p-7 space-y-6 flex-1">
            {/* Status Switcher Strip */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold">
                Viewing Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statuses.map((s) => {
                  const isCurrent = (movie.status || "want") === s.key;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => onUpdateStatus(movie.tmdb_id || movie.id, s.key)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        isCurrent
                          ? "bg-[#00D878] text-black border-[#00D878] shadow-md shadow-[#00D878]/20"
                          : "bg-[#14151F] border-[#1E1F2A] text-[#9496A1] hover:text-white hover:border-white/20"
                      }`}
                    >
                      <Icon size={14} className={isCurrent ? "text-black" : "text-[#9496A1]"} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Rating Strip */}
            <div className="p-4 rounded-2xl bg-[#14151F] border border-[#1E1F2A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold">
                  Personal Rating
                </span>
                <span className="text-xs font-mono font-bold text-[#00D878]">
                  {userRating > 0 ? `${userRating}/10` : "Not Rated"}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <StarRating
                  value={userRating}
                  onChange={handleRatingChange}
                  max={10}
                  size={20}
                  readOnly={false}
                />
              </div>
            </div>

            {/* Quick Actions Row: Favorite & Link */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleFavorite(movie)}
                className={`flex-1 h-11 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  movie.is_favorite
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                    : "bg-[#14151F] border-[#1E1F2A] text-[#9496A1] hover:text-rose-400 hover:border-rose-400/30"
                }`}
              >
                <Heart className={`w-4 h-4 ${movie.is_favorite ? "fill-current" : ""}`} />
                <span>{movie.is_favorite ? "Favorited in Archive" : "Add to Favorites"}</span>
              </button>

              <Link
                href={`/discover?q=${encodeURIComponent(movie.title)}`}
                className="h-11 px-4 rounded-xl bg-[#14151F] border border-[#1E1F2A] text-xs font-semibold text-[#9496A1] hover:text-white hover:border-[#00D878]/40 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Find More</span>
              </Link>
            </div>

            {/* Review Notes Area */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold flex items-center justify-between">
                <span>Personal Notes & Review</span>
                <span className="text-[10px] text-[#9496A1]/60 normal-case">
                  Auto-saved on blur
                </span>
              </label>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                onBlur={handleReviewBlur}
                placeholder="Write your cinematic impressions, thoughts, and memory anchors..."
                rows={4}
                className="w-full p-3 rounded-xl bg-[#14151F] border border-[#1E1F2A] text-xs sm:text-sm text-white placeholder:text-[#9496A1]/50 focus:border-[#00D878]/50 focus:ring-1 focus:ring-[#00D878]/20 outline-none resize-none transition"
              />
            </div>

            {/* Synopsis Overview */}
            {movie.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold">
                  Synopsis
                </h3>
                <p className="text-xs sm:text-sm text-[#F3F4F6]/80 leading-relaxed font-sans">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Genres */}
            {genreNames.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {genreNames.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-[#14151F] border border-[#1E1F2A] text-xs font-medium text-[#9496A1]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Cast List */}
            {cast.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#9496A1] font-semibold">
                  Key Cast
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {cast.map((actor: any) => (
                    <div
                      key={actor.id || actor.name}
                      className="p-2 rounded-xl bg-[#14151F] border border-[#1E1F2A] flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#101118] relative shrink-0">
                        {actor.profile_path ? (
                          <Image
                            src={getTmdbImageUrl(actor.profile_path, "w185") || ""}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9496A1]">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {actor.name}
                        </p>
                        <p className="text-[10px] text-[#9496A1] truncate">
                          {actor.character || "Cast"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone: Remove Film */}
            <div className="pt-4 border-t border-[#1E1F2A]">
              <button
                type="button"
                onClick={() => onRemove(movie.tmdb_id || movie.id)}
                className="w-full h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Personal Archive</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
