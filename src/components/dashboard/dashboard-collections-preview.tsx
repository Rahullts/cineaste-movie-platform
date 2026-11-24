"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FolderHeart, Plus, ArrowRight, Layers, Film } from "lucide-react";
import type { Movie, Collection } from "@/types";

interface DashboardCollectionsPreviewProps {
  collections: Collection[];
  allMovies: Movie[];
  onOpenCreate: () => void;
}

function CollageImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = React.useState(false);
  if (error) {
    return (
      <div className="w-full h-full bg-[#181926] flex items-center justify-center text-[#9496A1]/40">
        <Film className="w-4 h-4" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="120px"
      className={className || "object-cover"}
      onError={() => setError(true)}
    />
  );
}

export function DashboardCollectionsPreview({
  collections,
  allMovies,
  onOpenCreate,
}: DashboardCollectionsPreviewProps) {
  // Map for fast poster resolution by movie tmdb_id/id
  const movieMap = React.useMemo(() => {
    const map = new Map<number, Movie>();
    allMovies.forEach((m) => map.set(m.tmdb_id || m.id, m));
    return map;
  }, [allMovies]);

  if (collections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1E1F2A] bg-[#101118]/60 p-8 sm:p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-[#9496A1] mx-auto grid place-items-center">
          <FolderHeart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white font-heading">
            No collections created yet
          </h3>
          <p className="text-xs text-[#9496A1] max-w-md mx-auto leading-relaxed">
            Organize your cinema vault into thematic shelves, director retrospectives, or mood curations.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-5 py-2 rounded-full bg-[#00D878] hover:bg-[#00B855] text-black font-extrabold text-xs inline-flex items-center gap-1.5 transition shadow-lg shadow-[#00D878]/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Create First Collection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {collections.slice(0, 4).map((col) => {
        const movieIds =
          col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
        const count = movieIds.length;

        // Resolve up to 4 posters for preview collage
        const collagePosters = movieIds
          .map((id) => {
            const found =
              movieMap.get(id) ||
              (col.movies || []).find((m) => (m.tmdb_id || m.id) === id);
            return found?.poster_path || null;
          })
          .filter((p): p is string => Boolean(p))
          .slice(0, 4);

        const accentColor = col.color || "#00D878";

        return (
          <Link
            key={col.id}
            href={`/activity?tab=collections`}
            className="group relative rounded-2xl bg-[#101118] border border-[#1E1F2A] hover:border-[#00D878]/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col hover:-translate-y-1"
          >
            {/* Color Accent Bar */}
            <div
              className="h-1.5 w-full transition-colors"
              style={{ backgroundColor: accentColor }}
            />

            {/* Poster Collage Header */}
            <div className="relative aspect-[16/10] w-full bg-[#141520] overflow-hidden">
              {collagePosters.length >= 4 ? (
                /* 2x2 Grid */
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-black">
                  {collagePosters.map((poster, idx) => (
                    <div key={idx} className="relative w-full h-full overflow-hidden">
                      <CollageImage
                        src={
                          poster.startsWith("http")
                            ? poster
                            : `/api/image?path=${encodeURIComponent(poster)}&w=500`
                        }
                        alt={col.title}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : collagePosters.length > 0 ? (
                /* 1 to 3 Posters */
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#181922] to-[#0D0E14]">
                  {collagePosters.map((poster, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-28 rounded-md shadow-2xl overflow-hidden border border-white/10"
                      style={{
                        transform: `translateX(${(idx - (collagePosters.length - 1) / 2) * 24}px) rotate(${
                          (idx - (collagePosters.length - 1) / 2) * 6
                        }deg)`,
                        zIndex: idx + 1,
                      }}
                    >
                      <CollageImage
                        src={
                          poster.startsWith("http")
                            ? poster
                            : `/api/image?path=${encodeURIComponent(poster)}&w=500`
                        }
                        alt={col.title}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty collection artwork */
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#9496A1]/40 bg-gradient-to-br from-[#141520] to-[#0D0E14]">
                  <Film className="w-8 h-8" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Empty Shelf
                  </span>
                </div>
              )}
            </div>

            {/* Collection Details */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-white group-hover:text-[#00D878] transition-colors truncate">
                  {col.title}
                </h4>
                {col.description && (
                  <p className="text-[11px] text-[#9496A1] line-clamp-1 mt-0.5">
                    {col.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#1E1F2A]/60 text-[10px] font-mono text-[#9496A1]">
                <span>
                  {count} {count === 1 ? "film" : "films"}
                </span>
                <span className="text-[#00D878] opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5 font-sans font-semibold">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
