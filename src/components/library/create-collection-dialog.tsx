"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  FolderPlus,
  Palette,
  Film,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import type { Movie, Collection } from "@/types";

interface CreateCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    color: string,
    description: string,
    selectedMovies: Movie[]
  ) => void;
  availableMovies: Movie[];
  editCollection?: Collection | null;
}

const PALETTE = [
  { name: "Cineaste Emerald", hex: "#00D878" },
  { name: "Electric Indigo", hex: "#6366F1" },
  { name: "Warm Amber", hex: "#F59E0B" },
  { name: "Neon Pink", hex: "#EC4899" },
  { name: "Ocean Cyan", hex: "#06B6D4" },
  { name: "Deep Violet", hex: "#8B5CF6" },
  { name: "Cinema Ruby", hex: "#EF4444" },
  { name: "Mint Sage", hex: "#10B981" },
];

export function CreateCollectionDialog({
  isOpen,
  onClose,
  onSave,
  availableMovies,
  editCollection = null,
}: CreateCollectionDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#00D878");
  const [selectedMovieIds, setSelectedMovieIds] = React.useState<number[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (editCollection) {
        setTitle(editCollection.title);
        setDescription(editCollection.description || "");
        setColor(editCollection.color || "#00D878");
        const existingIds =
          editCollection.movie_ids ||
          (editCollection.movies || []).map((m) => m.tmdb_id || m.id);
        setSelectedMovieIds(existingIds);
      } else {
        setTitle("");
        setDescription("");
        setColor("#00D878");
        setSelectedMovieIds([]);
      }
      setSearchQuery("");
      setErrorMessage(null);
    }
  }, [isOpen, editCollection]);

  if (!isOpen) return null;

  const filteredMovies = availableMovies.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.director && m.director.toLowerCase().includes(q))
    );
  });

  const toggleSelectMovie = (movie: Movie) => {
    const id = movie.tmdb_id || movie.id;
    if (selectedMovieIds.includes(id)) {
      setSelectedMovieIds(selectedMovieIds.filter((mId) => mId !== id));
    } else {
      setSelectedMovieIds([...selectedMovieIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a collection title.");
      return;
    }
    const selectedMovies = availableMovies.filter((m) =>
      selectedMovieIds.includes(m.tmdb_id || m.id)
    );
    onSave(title.trim(), color, description.trim(), selectedMovies);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editCollection ? "Edit Collection" : "Create Collection"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-[#101118] border border-[#1E1F2A] shadow-2xl animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1F2A]">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl grid place-items-center text-black font-bold shadow-sm"
              style={{ backgroundColor: color }}
            >
              <FolderPlus className="w-5 h-5 text-black" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-white">
                {editCollection ? "Edit Curated Collection" : "Create Curated Collection"}
              </h2>
              <p className="text-xs text-[#9496A1]">
                Curate custom shelves and thematic archives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9496A1] hover:text-white hover:bg-[#181820] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Collection Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Collection Title <span className="text-[#00D878]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Masterpiece Cinema, 90s Noir, Mindbenders..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-[#141520] border border-[#1E1F2A] text-sm text-white placeholder:text-[#9496A1]/60 focus:outline-none focus:border-[#00D878] focus:ring-1 focus:ring-[#00D878] transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Description <span className="text-[#9496A1] font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Describe the mood, theme or rationale for this collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141520] border border-[#1E1F2A] text-xs text-white placeholder:text-[#9496A1]/60 focus:outline-none focus:border-[#00D878] focus:ring-1 focus:ring-[#00D878] transition resize-none"
            />
          </div>

          {/* Accent Color Palette */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider flex items-center justify-between">
              <span>Accent Color</span>
              <span className="text-[11px] font-mono text-[#9496A1]">{color}</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PALETTE.map((p) => {
                const isSelected = color.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setColor(p.hex)}
                    title={p.name}
                    className={`h-9 rounded-xl flex items-center justify-center transition ${
                      isSelected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#101118] scale-105"
                        : "opacity-80 hover:opacity-100 hover:scale-102"
                    }`}
                    style={{ backgroundColor: p.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Movie Picker from User Library */}
          <div className="space-y-2.5 pt-2 border-t border-[#1E1F2A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
                Select Films from Vault ({selectedMovieIds.length} selected)
              </label>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9496A1]" />
              <input
                type="text"
                placeholder="Search films in your library to include..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#141520] border border-[#1E1F2A] text-xs text-white placeholder:text-[#9496A1]/60 focus:outline-none focus:border-[#00D878]"
              />
            </div>

            {/* Movie List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {availableMovies.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#9496A1]">
                  Your vault has no films yet. You can still create this collection and add films later.
                </div>
              ) : filteredMovies.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#9496A1]">
                  No films matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredMovies.map((movie) => {
                  const mId = movie.tmdb_id || movie.id;
                  const isChecked = selectedMovieIds.includes(mId);
                  const posterUrl = movie.poster_path
                    ? movie.poster_path.startsWith("http")
                      ? movie.poster_path
                      : `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                    : null;

                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => toggleSelectMovie(movie)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border transition ${
                        isChecked
                          ? "bg-[#00D878]/10 border-[#00D878]/40 text-white"
                          : "bg-[#141520]/60 border-[#1E1F2A] text-[#9496A1] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-7 h-10 rounded overflow-hidden bg-[#1E1F2A] shrink-0 border border-white/5">
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={movie.title}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-[7px] text-[#9496A1]">
                              No Art
                            </div>
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {movie.title}
                          </p>
                          <p className="text-[10px] text-[#9496A1]">
                            {movie.release_date ? movie.release_date.split("-")[0] : ""}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-4 h-4 rounded grid place-items-center transition ${
                          isChecked
                            ? "bg-[#00D878] text-black"
                            : "border border-white/20 text-transparent"
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E1F2A] bg-[#0A0B0F] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9496A1] hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-[#00D878] text-black font-bold text-xs hover:bg-[#00B855] transition shadow-lg shadow-[#00D878]/20"
          >
            {editCollection ? "Save Changes" : "Create Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}
