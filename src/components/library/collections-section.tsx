"use client";

import * as React from "react";
import Image from "next/image";
import {
  FolderHeart,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  Film,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, Collection } from "@/types";

interface CollectionsSectionProps {
  collections: Collection[];
  allMovies: Movie[];
  onOpenCreate: () => void;
  onOpenEdit: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onSelectCollection: (collection: Collection) => void;
}

export function CollectionsSection({
  collections,
  allMovies,
  onOpenCreate,
  onOpenEdit,
  onDeleteCollection,
  onSelectCollection,
}: CollectionsSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updated" | "count" | "alpha">("updated");

  // Movie map for rapid lookup of poster paths
  const movieMap = React.useMemo(() => {
    const map = new Map<number, Movie>();
    allMovies.forEach((m) => map.set(m.tmdb_id || m.id, m));
    return map;
  }, [allMovies]);

  // Filter & Sort
  const processedCollections = React.useMemo(() => {
    let result = collections.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      if (sortBy === "count") {
        const countA = (a.movie_ids || a.movies || []).length;
        const countB = (b.movie_ids || b.movies || []).length;
        return countB - countA;
      }
      if (sortBy === "alpha") {
        return a.title.localeCompare(b.title);
      }
      // default: updated / created
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return result;
  }, [collections, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Command & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#101118]/80 backdrop-blur-md shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Left: Summary & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 shrink-0">
            <FolderHeart className="w-4 h-4 text-[#00D878]" />
            <span className="text-xs font-bold text-white font-mono">
              {collections.length} {collections.length === 1 ? "Collection" : "Collections"}
            </span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9496A1]" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#141520] text-xs text-white placeholder:text-[#9496A1]/60 focus:outline-none focus:ring-1 focus:ring-[#00D878]"
            />
          </div>
        </div>

        {/* Right: Sort & Create CTA */}
        <div className="flex items-center gap-2.5 justify-end">
          <div className="flex items-center gap-1 text-xs text-[#9496A1]">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-[#141520] text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D878] cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="count">Most Films</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="h-9 px-4 rounded-xl bg-[#00D878] text-white font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#00B855] hover:scale-102 active:scale-98 transition shadow-lg shadow-[#00D878]/20 select-none cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {/* Collections Grid or Empty State */}
      {processedCollections.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#101118]/60 p-8 space-y-4 shadow-xl">
          <span className="w-16 h-16 rounded-3xl bg-[#00D878]/10 grid place-items-center text-[#00D878] mx-auto shadow-xl">
            <Layers className="w-8 h-8" />
          </span>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading text-lg font-bold text-white">
              {searchQuery ? "No matching collections" : "Your Curated Library is Empty"}
            </h3>
            <p className="text-xs text-[#9496A1] leading-relaxed">
              {searchQuery
                ? `No collections found matching "${searchQuery}". Try a different keyword.`
                : "Create thematic shelves, director spotlights, genre deep-dives, or award winners. Group your films into custom collections."}
            </p>
          </div>
          {!searchQuery && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenCreate}
                className="px-6 py-2.5 rounded-full bg-[#00D878] text-white font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#00B855] transition shadow-xl shadow-[#00D878]/25 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white stroke-[3]" />
                <span>Create Your First Collection</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {processedCollections.map((collection) => {
            const movieIds =
              collection.movie_ids ||
              (collection.movies || []).map((m) => m.tmdb_id || m.id);

            // Collect posters for collage
            const collagePosters = movieIds
              .map((id) => {
                const found =
                  movieMap.get(id) ||
                  (collection.movies || []).find((m) => (m.tmdb_id || m.id) === id);
                return found?.poster_path || null;
              })
              .filter((p): p is string => Boolean(p))
              .slice(0, 4);

            const accentColor = collection.color || "#00D878";

            return (
              <div
                key={collection.id}
                className="group relative rounded-2xl bg-[#101118] transition-all duration-300 shadow-xl overflow-hidden flex flex-col hover:-translate-y-1"
              >
                {/* Accent Color Header Stripe */}
                <div
                  className="h-1.5 w-full transition-colors"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Intelligent Poster Collage Header */}
                <div
                  className="relative aspect-[16/10] w-full bg-[#141520] cursor-pointer overflow-hidden"
                  onClick={() => onSelectCollection(collection)}
                >
                  {collagePosters.length >= 4 ? (
                    /* 2x2 Poster Collage */
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-black">
                      {collagePosters.map((poster, idx) => (
                        <div key={idx} className="relative w-full h-full overflow-hidden">
                          <Image
                            src={getTmdbImageUrl(poster, "w185") || ""}
                            alt={collection.title}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ) : collagePosters.length > 0 ? (
                    /* 1 to 3 Posters with Fan Layout */
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#181922] to-[#0D0E14]">
                      {collagePosters.map((poster, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-36 rounded-md shadow-2xl overflow-hidden"
                          style={{
                            transform: `translateX(${(idx - (collagePosters.length - 1) / 2) * 28}px) rotate(${
                              (idx - (collagePosters.length - 1) / 2) * 8
                            }deg)`,
                            zIndex: idx + 1,
                          }}
                        >
                          <Image
                            src={getTmdbImageUrl(poster, "w185") || ""}
                            alt={collection.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Collection Placeholder with glowing icon */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#141520] to-[#0A0B0F]">
                      <span
                        className="w-12 h-12 rounded-2xl grid place-items-center text-white shadow-lg"
                        style={{ backgroundColor: `${accentColor}25` }}
                      >
                        <Film className="w-6 h-6" style={{ color: accentColor }} />
                      </span>
                      <span className="text-[11px] text-[#9496A1]">Empty Shelf</span>
                    </div>
                  )}

                  {/* Dark gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#101118] via-[#101118]/80 to-transparent pointer-events-none" />

                  {/* Top Film Count Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-white font-bold flex items-center gap-1.5 shadow-md">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span>{movieIds.length} {movieIds.length === 1 ? "film" : "films"}</span>
                  </div>

                  {/* Quick Action Overlay: Edit & Delete */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit(collection);
                      }}
                      title="Edit Collection"
                      className="w-7 h-7 rounded-lg bg-black/80 hover:bg-white/20 text-[#9496A1] hover:text-white grid place-items-center transition shadow-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCollection(collection.id);
                      }}
                      title="Delete Collection"
                      className="w-7 h-7 rounded-lg bg-black/80 hover:bg-red-600 text-[#9496A1] hover:text-white grid place-items-center transition shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div
                  className="p-4 flex-1 flex flex-col justify-between space-y-3 cursor-pointer"
                  onClick={() => onSelectCollection(collection)}
                >
                  <div className="space-y-1">
                    <h3 className="font-heading text-sm sm:text-base font-bold text-white group-hover:text-[#00D878] transition truncate">
                      {collection.title}
                    </h3>
                    <p className="text-xs text-[#9496A1] line-clamp-2 leading-relaxed">
                      {collection.description || "A curated selection of memorable cinema."}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 text-[11px] text-[#9496A1]">
                    <span>
                      {(() => {
                        const raw = (collection as any).created_date || collection.created_at || collection.updated_at;
                        const d = raw ? new Date(raw) : null;
                        return d && !isNaN(d.getTime())
                          ? d.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Curated Shelf";
                      })()}
                    </span>
                    <span className="flex items-center gap-1 text-[#00D878] font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
