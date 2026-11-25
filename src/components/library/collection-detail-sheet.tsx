"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  FolderHeart,
  Film,
  Calendar,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { tmdbFetch } from "@/lib/tmdb-service";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, Collection } from "@/types";

interface CollectionDetailSheetProps {
  collection: Collection | null;
  onClose: () => void;
  onEdit: (collection: Collection) => void;
  onDelete: (collectionId: string) => void;
  onRemoveMovie: (collectionId: string, tmdbId: number) => void;
  onAddMovie: (collectionId: string, movie: Movie) => void;
  onSelectMovieForDetail: (movie: Movie) => void;
  allLibraryMovies: Movie[];
}

export function CollectionDetailSheet({
  collection,
  onClose,
  onEdit,
  onDelete,
  onRemoveMovie,
  onAddMovie,
  onSelectMovieForDetail,
  allLibraryMovies,
}: CollectionDetailSheetProps) {
  const [isAddingFilm, setIsAddingFilm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Movie[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!collection) {
      setIsAddingFilm(false);
      setSearchQuery("");
      setSearchResults([]);
      setConfirmDelete(false);
    }
  }, [collection]);

  // Debounced search for adding films (first checks local library, then searches TMDB)
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearchingTmdb(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Local matches
      const localMatches = allLibraryMovies.filter((m) =>
        m.title.toLowerCase().includes(trimmed.toLowerCase())
      );

      setIsSearchingTmdb(true);
      try {
        const res = await tmdbFetch({ action: "search", query: trimmed, page: 1 });
        const tmdbMatches: Movie[] = res.results || [];
        // Combine, deduping by tmdb_id
        const map = new Map<number, Movie>();
        localMatches.forEach((m) => map.set(m.tmdb_id || m.id, m));
        tmdbMatches.forEach((m) => {
          const id = m.tmdb_id || m.id;
          if (!map.has(id)) map.set(id, m);
        });
        setSearchResults(Array.from(map.values()).slice(0, 8));
      } catch {
        setSearchResults(localMatches.slice(0, 8));
      } finally {
        setIsSearchingTmdb(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, allLibraryMovies]);

  if (!collection) return null;

  // Resolve actual movie objects for this collection
  const collectionMovieIds =
    collection.movie_ids || (collection.movies || []).map((m) => m.tmdb_id || m.id);
  
  // Prefer movies in collection.movies or match against allLibraryMovies
  const movieMap = new Map<number, Movie>();
  allLibraryMovies.forEach((m) => movieMap.set(m.tmdb_id || m.id, m));
  (collection.movies || []).forEach((m) => movieMap.set(m.tmdb_id || m.id, m));

  const collectionMovies = collectionMovieIds
    .map((id) => movieMap.get(id))
    .filter((m): m is Movie => Boolean(m));

  const collectionColor = collection.color || "#00D878";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collection Details"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-[#0D0E14] flex flex-col shadow-2xl animate-slideDown overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color Accent Top Bar */}
        <div
          className="h-1.5 w-full transition-colors"
          style={{ backgroundColor: collectionColor }}
        />

        {/* Sheet Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#141520] to-[#0D0E14] space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-2xl grid place-items-center text-black font-bold text-sm shrink-0 shadow-lg"
                style={{ backgroundColor: collectionColor }}
              >
                <FolderHeart className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-medium text-[#9496A1]">
                  Curated Collection
                </span>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                  {collection.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(collection)}
                title="Edit Collection"
                className="p-2 rounded-xl text-[#9496A1] hover:text-white hover:bg-white/8 transition cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Delete Collection"
                className="p-2 rounded-xl text-[#9496A1] hover:text-red-400 hover:bg-red-500/12 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-2 rounded-xl text-[#9496A1] hover:text-white hover:bg-white/8 transition ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {collection.description && (
            <p className="text-xs text-[#9496A1] leading-relaxed">
              {collection.description}
            </p>
          )}

          {/* Metadata & Actions Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-[#9496A1]">
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white font-semibold">
                {collectionMovies.length} {collectionMovies.length === 1 ? "film" : "films"}
              </span>
              <span>•</span>
              <span>Updated {new Date(collection.updated_at || collection.created_at).toLocaleDateString()}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingFilm(!isAddingFilm)}
              className="px-3.5 py-1.5 rounded-xl bg-[#00D878] text-black font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-[#00B855] transition shadow-md shadow-[#00D878]/15 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isAddingFilm ? "Done Adding" : "Add Films"}</span>
            </button>
          </div>

          {/* Delete Confirmation Alert */}
          {confirmDelete && (
            <div className="p-4 rounded-2xl bg-red-500/10 space-y-2">
              <p className="text-xs font-semibold text-red-400">
                Delete collection &quot;{collection.title}&quot;?
              </p>
              <p className="text-xs text-[#9496A1]">
                This will delete the collection shelf only. No movies or favorites will be removed from your vault.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onDelete(collection.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Yes, Delete Collection
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Inline Add Films Search Dropdown */}
          {isAddingFilm && (
            <div className="p-3.5 rounded-2xl bg-[#12141E] space-y-3 shadow-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9496A1]" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search TMDB or vault to add film..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#181B28] focus:bg-[#1E2233] text-xs text-white placeholder:text-[#9496A1]/60 outline-none border-0"
                />
              </div>

              {/* Live Results */}
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {isSearchingTmdb ? (
                  <p className="text-xs text-[#9496A1] py-2 text-center">Searching films...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((m) => {
                    const mId = m.tmdb_id || m.id;
                    const alreadyIn = collectionMovieIds.includes(mId);
                    const posterUrl = m.poster_path
                      ? m.poster_path.startsWith("http")
                        ? m.poster_path
                        : `/api/image?path=${encodeURIComponent(m.poster_path)}&w=342`
                      : null;

                    return (
                      <div
                        key={mId}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#161926]/80 hover:bg-[#1C2030] transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-7 h-10 rounded overflow-hidden bg-[#1E1F2A] shrink-0">
                            {posterUrl && (
                              <Image
                                src={posterUrl}
                                alt={m.title}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                            <p className="text-[11px] text-[#9496A1]">
                              {m.release_date ? m.release_date.split("-")[0] : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={alreadyIn}
                          onClick={() => onAddMovie(collection.id, m)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            alreadyIn
                              ? "bg-white/8 text-[#9496A1] cursor-default"
                              : "bg-[#00D878] text-black hover:bg-[#00B855]"
                          }`}
                        >
                          {alreadyIn ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })
                ) : searchQuery ? (
                  <p className="text-xs text-[#9496A1] py-2 text-center">
                    No films found matching &quot;{searchQuery}&quot;
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Collection Movies Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">
          {collectionMovies.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <span className="w-12 h-12 rounded-2xl bg-[#141520] grid place-items-center text-[#9496A1] mx-auto">
                <Film className="w-6 h-6" />
              </span>
              <p className="text-sm font-semibold text-white">This collection is empty</p>
              <p className="text-xs text-[#9496A1] max-w-sm mx-auto">
                Add films from your vault or search TMDB to build this curated shelf.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingFilm(true)}
                className="px-4 py-2 rounded-xl bg-[#00D878] text-black font-semibold text-xs hover:bg-[#00B855] transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Film</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {collectionMovies.map((movie) => {
                const mId = movie.tmdb_id || movie.id;
                const posterUrl = getTmdbImageUrl(movie.poster_path, "w342");

                return (
                  <div
                    key={mId}
                    className="group relative rounded-2xl overflow-hidden bg-[#141520] transition-transform duration-200 hover:-translate-y-0.5 shadow-md flex flex-col"
                  >
                    {/* Poster Artwork */}
                    <div
                      className="relative aspect-[2/3] w-full bg-[#181922] cursor-pointer overflow-hidden"
                      onClick={() => onSelectMovieForDetail(movie)}
                    >
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={movie.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs text-[#9496A1]">
                          No Poster
                        </div>
                      )}

                      {/* Top Action Overlay: Remove from collection */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMovie(collection.id, mId);
                        }}
                        title="Remove from collection"
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/80 hover:bg-red-600 text-[#9496A1] hover:text-white grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Score Badge */}
                      {movie.vote_average && Number(movie.vote_average) > 0 && (
                        <div
                          title="TMDB Community Score"
                          className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-medium text-[#FBBF24]"
                        >
                          ★ TMDB {Number(movie.vote_average).toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 bg-[#101118] space-y-0.5 flex-1 flex flex-col justify-between">
                      <p
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-[#00D878] transition"
                        onClick={() => onSelectMovieForDetail(movie)}
                      >
                        {movie.title}
                      </p>
                      <p className="text-[11px] text-[#9496A1] truncate">
                        {movie.release_date ? movie.release_date.split("-")[0] : "Cinema"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
