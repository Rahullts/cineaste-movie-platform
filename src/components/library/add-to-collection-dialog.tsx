"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Check,
  FolderPlus,
  FolderHeart,
  Sparkles,
} from "lucide-react";
import type { Movie, Collection } from "@/types";

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  collections: Collection[];
  onToggleInCollection: (collectionId: string, movie: Movie) => void;
  onCreateCollection: (
    title: string,
    color?: string,
    description?: string,
    initialMovies?: Movie[]
  ) => void;
}

const PRESET_COLORS = [
  "#00D878",
  "#6366F1",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#8B5CF6",
  "#EF4444",
  "#10B981",
];

export function AddToCollectionDialog({
  isOpen,
  onClose,
  movie,
  collections,
  onToggleInCollection,
  onCreateCollection,
}: AddToCollectionDialogProps) {
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newColor, setNewColor] = React.useState("#00D878");

  React.useEffect(() => {
    if (!isOpen) {
      setIsCreatingNew(false);
      setNewTitle("");
    }
  }, [isOpen]);

  if (!isOpen || !movie) return null;

  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;

  const movieId = movie.tmdb_id || movie.id;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCollection(newTitle.trim(), newColor, "", [movie]);
    setNewTitle("");
    setIsCreatingNew(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to Collection"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-[#101118] border border-[#1E1F2A] shadow-2xl p-5 animate-slideDown space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1F2A]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#00D878]/15 border border-[#00D878]/30 grid place-items-center text-[#00D878]">
              <FolderHeart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-[#F3F4F6]">
                Add to Collection
              </h3>
              <p className="text-[11px] text-[#9496A1]">
                Organize this film into your curated shelves
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9496A1] hover:text-[#F3F4F6] hover:bg-[#181820] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Movie Snippet */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A]/60">
          <div className="relative w-10 h-14 rounded-md overflow-hidden bg-[#1E1F2A] shrink-0 border border-white/5">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-[9px] text-[#9496A1]">
                No Art
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{movie.title}</p>
            <p className="text-[11px] text-[#9496A1]">
              {movie.release_date ? movie.release_date.split("-")[0] : "Cinema"} •{" "}
              {movie.vote_average ? `★ ${Number(movie.vote_average).toFixed(1)}` : "Unrated"}
            </p>
          </div>
        </div>

        {/* Collections List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {collections.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <p className="text-xs font-semibold text-white">No collections yet</p>
              <p className="text-[11px] text-[#9496A1]">
                Create your first curated shelf below.
              </p>
            </div>
          ) : (
            collections.map((col) => {
              const colMovieIds =
                col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
              const isIncluded = colMovieIds.includes(movieId);

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleInCollection(col.id, movie)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition select-none ${
                    isIncluded
                      ? "bg-[#00D878]/10 border-[#00D878]/40 text-white"
                      : "bg-[#141520]/60 border-[#1E1F2A] text-[#9496A1] hover:text-white hover:border-[#2A2B3D]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: col.color || "#00D878" }}
                    />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold truncate text-white">
                        {col.title}
                      </p>
                      <p className="text-[10px] text-[#9496A1]">
                        {colMovieIds.length} {colMovieIds.length === 1 ? "film" : "films"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-5 h-5 rounded-md grid place-items-center transition ${
                      isIncluded
                        ? "bg-[#00D878] text-black"
                        : "border border-white/20 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Inline Create New Collection Form */}
        {isCreatingNew ? (
          <form
            onSubmit={handleCreateNew}
            className="p-3 rounded-xl border border-[#00D878]/30 bg-[#00D878]/5 space-y-2.5"
          >
            <p className="text-[11px] font-bold text-[#00D878] uppercase tracking-wider">
              New Curated Collection
            </p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Masterpiece Cinema, Cyberpunk Vault..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-8 px-3 rounded-lg bg-[#101118] border border-[#1E1F2A] text-xs text-white placeholder:text-[#9496A1]/60 focus:outline-none focus:border-[#00D878]"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-4 h-4 rounded-full transition ${
                      newColor === color
                        ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-2.5 py-1 text-[11px] text-[#9496A1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1 rounded-lg bg-[#00D878] text-black font-bold text-[11px] hover:bg-[#00B855] disabled:opacity-40 transition"
                >
                  Create & Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="w-full h-9 rounded-xl border border-dashed border-[#1E1F2A] text-[#9496A1] hover:text-[#00D878] hover:border-[#00D878]/40 hover:bg-[#00D878]/5 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Collection</span>
          </button>
        )}

        {/* Modal Done Button */}
        <div className="pt-2 border-t border-[#1E1F2A] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1E1F2A] text-white hover:bg-[#2A2B3D] text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
