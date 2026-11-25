"use client";

import * as React from "react";
import { X, Check, Plus, FolderPlus, Film, Bookmark, AlertCircle } from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, Collection } from "@/types";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Emerald", value: "#00D878" },
  { name: "Cobalt", value: "#4E6BFF" },
  { name: "Amber", value: "#E8A21A" },
  { name: "Rose", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Violet", value: "#8B5CF6" },
];

export interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  collections: Collection[];
  onToggleInCollection: (collectionId: string, movie: Movie) => void;
  onCreateCollection: (
    title: string,
    color: string,
    description: string,
    initialMovies: Movie[]
  ) => Collection | void;
}

export function AddToCollectionDialog({
  isOpen,
  onClose,
  movie,
  collections,
  onToggleInCollection,
  onCreateCollection,
}: AddToCollectionDialogProps) {
  if (!isOpen || !movie) return null;
  return (
    <AddToCollectionDialogContent
      onClose={onClose}
      movie={movie}
      collections={collections}
      onToggleInCollection={onToggleInCollection}
      onCreateCollection={onCreateCollection}
    />
  );
}

function AddToCollectionDialogContent({
  onClose,
  movie,
  collections,
  onToggleInCollection,
  onCreateCollection,
}: {
  onClose: () => void;
  movie: Movie;
  collections: Collection[];
  onToggleInCollection: AddToCollectionDialogProps["onToggleInCollection"];
  onCreateCollection: AddToCollectionDialogProps["onCreateCollection"];
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const newInputRef = React.useRef<HTMLInputElement>(null);

  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newColor, setNewColor] = React.useState("#00D878");
  const [createError, setCreateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  React.useEffect(() => {
    if (isCreatingNew) {
      const timer = window.setTimeout(() => {
        newInputRef.current?.focus();
      }, 30);
      return () => window.clearTimeout(timer);
    }
  }, [isCreatingNew]);

  const movieId = movie.tmdb_id || movie.id;
  const posterUrl = getTmdbImageUrl(movie.poster_path, "w185");
  const releaseYear = movie.release_date?.slice(0, 4);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setCreateError("Please enter a shelf name.");
      newInputRef.current?.focus();
      return;
    }
    onCreateCollection(trimmed, newColor, "", [movie]);
    setNewTitle("");
    setCreateError(null);
    setIsCreatingNew(false);
  };

  return (
    <dialog
      ref={dialogRef}
      data-testid="add-to-collection-dialog"
      aria-labelledby="add-to-collection-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 m-auto w-[min(94vw,460px)] max-h-[84vh] p-0 border-0 bg-transparent text-foreground rounded-3xl overflow-visible backdrop:bg-black/75 backdrop:backdrop-blur-md open:flex open:flex-col animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-full max-h-[84vh] flex flex-col rounded-3xl bg-popover dark:bg-[#11131C] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D878]/12 text-[#00D878] grid place-items-center shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <h2
              id="add-to-collection-title"
              className="font-heading text-base font-semibold text-foreground tracking-tight"
            >
              Save to Collection
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close save to collection"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-muted-foreground hover:text-foreground grid place-items-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Film Preview Card — borderless tonal card */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-secondary dark:bg-[#171A26]">
            <div className="w-10 h-14 rounded-xl overflow-hidden bg-background shrink-0">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">
                  <Film className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-foreground truncate">
                {movie.title}
              </p>
              {releaseYear && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {releaseYear}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Collections List & Inline Create */}
        <div className="px-6 pb-5 overflow-y-auto flex-1 space-y-2">
          {collections.length === 0 && !isCreatingNew ? (
            <div className="rounded-2xl bg-secondary dark:bg-[#171A26] p-6 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                No collections yet
              </p>
              <p className="text-xs text-muted-foreground">
                Create a curated shelf below to organize your favorite films.
              </p>
            </div>
          ) : (
            collections.map((col) => {
              const memberIds =
                col.movie_ids ||
                col.movies?.map((m) => m.tmdb_id || m.id) ||
                [];
              const isInside = memberIds.includes(movieId);
              const accent = col.color || "#00D878";

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleInCollection(col.id, movie)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-3 rounded-2xl transition-colors text-left cursor-pointer",
                    isInside
                      ? "bg-[#00D878]/15"
                      : "bg-secondary hover:bg-accent dark:bg-[#171A26] dark:hover:bg-[#1E2232]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {col.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {memberIds.length}{" "}
                        {memberIds.length === 1 ? "film" : "films"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "w-7 h-7 rounded-xl grid place-items-center shrink-0 transition-colors",
                      isInside
                        ? "bg-[#00D878] text-[#050608]"
                        : "bg-background dark:bg-white/[0.07] text-muted-foreground"
                    )}
                  >
                    {isInside ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
              );
            })
          )}

          {isCreatingNew && (
            <form
              noValidate
              onSubmit={handleQuickCreate}
              className="rounded-2xl bg-secondary dark:bg-[#171A26] p-4 space-y-3 mt-2"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="inline-collection-name"
                  className="text-xs font-medium text-muted-foreground block"
                >
                  New Shelf Title
                </label>
                <input
                  ref={newInputRef}
                  id="inline-collection-name"
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="e.g. Weekend Watchlist, Coen Classics..."
                  className="w-full h-10 px-3.5 rounded-xl bg-background focus:bg-accent dark:bg-[#0E1018] dark:focus:bg-[#121521] text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0 transition-colors"
                />
                {createError && (
                  <p
                    role="alert"
                    className="text-xs text-rose-400 flex items-center gap-1 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{createError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => {
                    const active = newColor === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        aria-label={`Select ${c.name} color`}
                        className={cn(
                          "w-6 h-6 rounded-full grid place-items-center transition-transform cursor-pointer border-0",
                          active ? "scale-110 shadow-md" : "opacity-80 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c.value }}
                      >
                        {active && (
                          <Check className="w-3 h-3 text-[#050608] stroke-[2.75]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setCreateError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-[#00D878] hover:bg-[#00C26B] text-[#050608] text-xs font-semibold cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Seamless Footer */}
        <div className="px-6 py-4 bg-muted dark:bg-[#0C0E15] flex items-center justify-between gap-3">
          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D878] hover:text-[#00BF6A] transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Automatically includes {movie.title}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-secondary hover:bg-accent dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-xs font-semibold text-foreground transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
