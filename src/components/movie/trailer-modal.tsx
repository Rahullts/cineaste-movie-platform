"use client";

import * as React from "react";
import { X, Film } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey?: string | null;
  movieTitle: string;
}

export function TrailerModal({
  isOpen,
  onClose,
  trailerKey,
  movieTitle,
}: TrailerModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Official Trailer for ${movieTitle}`}
      data-testid="trailer-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-[#0D0E14] border border-[#1E1F2A] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header — solid opaque bar isolated above video layer */}
        <div className="relative z-20 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 border-b border-[#1E1F2A] bg-[#101118] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#00D878] shrink-0 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#00D878] font-semibold shrink-0">
              Official Trailer
            </span>
            <span className="text-xs text-[#D1D5DB] truncate">
              • {movieTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close trailer"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition border border-white/15 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative z-10 aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          {trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movieTitle} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 block"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8 text-[#9496A1]">
              <Film className="w-12 h-12 opacity-30 text-[#00D878]" />
              <p className="text-sm font-semibold text-white">
                Trailer Not Available
              </p>
              <p className="text-xs max-w-sm">
                No official streaming trailer was provided for {movieTitle} in
                TMDB video records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
