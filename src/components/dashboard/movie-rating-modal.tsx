"use client";

import * as React from "react";
import { X, Star, Check, Film, Eye } from "lucide-react";
import { StarRating } from "@/components/dashboard/star-rating";
import { formatYear } from "@/lib/utils";
import type { Movie } from "@/types";

interface MovieRatingModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRating: (movie: Movie, rating?: number, review?: string) => void;
  onSkipRating: (movie: Movie) => void;
  onUnmarkWatched?: (movie: Movie) => void;
}

export function MovieRatingModal({
  movie,
  isOpen,
  onClose,
  onSaveRating,
  onSkipRating,
  onUnmarkWatched,
}: MovieRatingModalProps) {
  const [personalRating, setPersonalRating] = React.useState<number>(8);
  const [review, setReview] = React.useState<string>("");

  React.useEffect(() => {
    if (movie) {
      setPersonalRating(typeof movie.rating === "number" && movie.rating > 0 ? movie.rating : 8);
      setReview((movie as any)?.review || "");
    }
  }, [movie, isOpen]);

  if (!isOpen || !movie) return null;

  const posterPath = movie.poster_path;
  const cleanPoster = posterPath
    ? posterPath.startsWith("/")
      ? posterPath
      : `/${posterPath}`
    : null;
  const posterUrl = cleanPoster
    ? `/api/image?path=${encodeURIComponent(cleanPoster)}&w=780`
    : null;
  const fallbackPosterUrl = cleanPoster
    ? `https://image.tmdb.org/t/p/w500${cleanPoster}`
    : null;

  const releaseYear = formatYear(movie.release_date);

  const getRatingLabel = (score: number) => {
    if (score >= 9.5) return "Masterpiece";
    if (score >= 8.5) return "Exceptional Cinema";
    if (score >= 7.5) return "Very Good";
    if (score >= 6.5) return "Worth Watching";
    if (score >= 5.0) return "Average";
    return "Underwhelming";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1F2A] bg-[#0E0F16] p-6 sm:p-7 shadow-2xl shadow-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00D664]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-white/10 bg-white/5 grid place-items-center text-[#9496A1] hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-xl bg-[#00D664]/10 border border-[#00D664]/25 grid place-items-center text-[#00D664]">
            <Eye className="w-4 h-4 stroke-[1.8]" />
          </span>
          <div>
            <h2
              id="rating-modal-title"
              className="font-heading text-lg font-semibold tracking-[-0.015em] text-white leading-tight"
            >
              Log Screening
            </h2>
            <p className="text-xs text-[#9496A1]">Save your personal Cineaste rating</p>
          </div>
        </div>

        {/* Movie Info Snippet */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-5">
          <div className="w-12 h-[72px] rounded-lg overflow-hidden bg-black/50 shrink-0 relative border border-white/10">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (fallbackPosterUrl && target.src !== fallbackPosterUrl) {
                    target.src = fallbackPosterUrl;
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/40">
                <Film className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-sm text-white truncate">{movie.title}</h3>
            {releaseYear && releaseYear !== "--" && (
              <p className="text-xs tabular-nums text-[#9496A1] mt-0.5">{releaseYear}</p>
            )}
            <p className="text-[11px] text-[#00D664] font-medium mt-0.5">
              Personal Cineaste Vault Entry
            </p>
          </div>
        </div>

        {/* Interactive Star Rating */}
        <div className="space-y-2 mb-5 text-center">
          <label className="text-xs font-medium tracking-wide text-[#9496A1]">
            Your Personal Rating
          </label>
          <div className="flex flex-col items-center justify-center gap-2 pt-1">
            <StarRating
              value={personalRating}
              max={5}
              size={26}
              readOnly={false}
              onChange={(newVal) => setPersonalRating(Math.round(newVal * 2 * 10) / 10)}
            />
            <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[#FBBF24]">
              <Star className="w-3.5 h-3.5 fill-[#FBBF24] stroke-none" />
              <span>{personalRating.toFixed(1)} / 10</span>
              <span className="text-xs text-[#9496A1] font-normal ml-1">
                &bull; {getRatingLabel(personalRating)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => onSaveRating(movie, personalRating, review)}
            className="w-full h-11 rounded-full bg-[#00D664] hover:bg-[#00BF59] text-black font-semibold text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[#00D664]/20 active:scale-[0.99] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.2]" />
            <span>Save Rating ({personalRating.toFixed(1)}/10)</span>
          </button>

          <button
            type="button"
            onClick={() => onSkipRating(movie)}
            className="w-full h-10 rounded-full bg-white/[0.06] hover:bg-white/10 text-[#C7CCDA] hover:text-white font-medium text-xs transition cursor-pointer"
          >
            Mark Watched Without Rating
          </button>

          {movie.status === "watched" && onUnmarkWatched && (
            <button
              type="button"
              onClick={() => onUnmarkWatched(movie)}
              className="w-full h-10 rounded-full bg-rose-500/12 hover:bg-rose-500/20 text-rose-400 font-medium text-xs transition cursor-pointer"
            >
              Remove from Watched
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
