"use client";

import * as React from "react";
import { X, Check, Search, Film, FolderPlus, AlertCircle, Plus } from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, Collection } from "@/types";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { name: "Emerald", value: "#00D878" },
  { name: "Cobalt", value: "#4E6BFF" },
  { name: "Amber", value: "#E8A21A" },
  { name: "Rose", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Crimson", value: "#EF4444" },
  { name: "Teal", value: "#10B981" },
];

export interface CreateCollectionDialogProps {
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

export function CreateCollectionDialog({
  isOpen,
  onClose,
  onSave,
  availableMovies,
  editCollection = null,
}: CreateCollectionDialogProps) {
  if (!isOpen) return null;
  return (
    <CreateCollectionDialogContent
      onClose={onClose}
      onSave={onSave}
      availableMovies={availableMovies}
      editCollection={editCollection}
    />
  );
}

function CreateCollectionDialogContent({
  onClose,
  onSave,
  availableMovies,
  editCollection,
}: {
  onClose: () => void;
  onSave: CreateCollectionDialogProps["onSave"];
  availableMovies: Movie[];
  editCollection: Collection | null;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const [title, setTitle] = React.useState(editCollection?.title ?? "");
  const [description, setDescription] = React.useState(
    editCollection?.description ?? ""
  );
  const [color, setColor] = React.useState(editCollection?.color ?? "#00D878");
  const [selectedMovieIds, setSelectedMovieIds] = React.useState<number[]>(() =>
    editCollection
      ? editCollection.movie_ids ||
        editCollection.movies?.map((m) => m.tmdb_id || m.id) ||
        []
      : []
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 30);
    return () => {
      window.clearTimeout(timer);
      if (dialog.open) dialog.close();
    };
  }, []);

  const filteredMovies = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableMovies;
    return availableMovies.filter((m) =>
      m.title.toLowerCase().includes(q)
    );
  }, [availableMovies, searchQuery]);

  const toggleMovie = (id: number) => {
    setSelectedMovieIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMessage("Please enter a collection title.");
      titleInputRef.current?.focus();
      return;
    }

    const picked = availableMovies.filter((m) =>
      selectedMovieIds.includes(m.tmdb_id || m.id)
    );
    onSave(trimmed, color, description.trim(), picked);
    onClose();
  };

  const activeColorMeta =
    ACCENT_COLORS.find((c) => c.value === color) ?? ACCENT_COLORS[0];

  return (
    <dialog
      ref={dialogRef}
      data-testid="create-collection-dialog"
      aria-labelledby="create-collection-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 m-auto w-[min(94vw,540px)] max-h-[88vh] p-0 border-0 bg-transparent text-foreground rounded-3xl overflow-visible backdrop:bg-black/75 backdrop:backdrop-blur-md open:flex open:flex-col animate-in fade-in zoom-in-95 duration-200"
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-h-[88vh] flex flex-col rounded-3xl bg-popover dark:bg-[#11131C] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Seamless Header */}
        <div className="px-6 pt-6 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 shadow-md transition-colors"
              style={{
                backgroundColor: `${color}22`,
                color,
              }}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="create-collection-title"
                className="font-heading text-lg font-semibold text-foreground tracking-tight truncate"
              >
                {editCollection ? "Edit Collection" : "New Curated Collection"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Curate custom shelves and thematic film archives
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close collection modal"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-accent dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-muted-foreground hover:text-foreground grid place-items-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body — zero horizontal divider lines, zero focus rings */}
        <div className="px-6 py-3 overflow-y-auto flex-1 space-y-5">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="collection-title-input"
              className="text-xs font-medium text-muted-foreground block"
            >
              Collection Title
            </label>
            <input
              ref={titleInputRef}
              id="collection-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Neo-Noir Favorites, Late Night Essentials..."
              className="w-full h-11 px-4 rounded-2xl bg-secondary focus:bg-accent dark:bg-[#171A26] dark:focus:bg-[#1E2232] text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0 transition-colors"
            />
            {errorMessage && (
              <p
                role="alert"
                className="text-xs text-rose-400 flex items-center gap-1.5 pt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="collection-desc-input"
              className="text-xs font-medium text-muted-foreground flex items-center justify-between"
            >
              <span>Description</span>
              <span className="text-[11px] opacity-65">Optional</span>
            </label>
            <textarea
              id="collection-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the mood, era, or curatorial theme..."
              className="w-full px-4 py-3 rounded-2xl bg-secondary focus:bg-accent dark:bg-[#171A26] dark:focus:bg-[#1E2232] text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0 resize-none transition-colors"
            />
          </div>

          {/* Sleek Circular Accent Color Dots — no pill gap or offset ring */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Shelf Accent
              </span>
              <span className="text-xs font-medium text-foreground">
                {activeColorMeta.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {ACCENT_COLORS.map((swatch) => {
                const isSelected = color === swatch.value;
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => setColor(swatch.value)}
                    aria-label={`Select ${swatch.name} accent`}
                    aria-pressed={isSelected}
                    className={cn(
                      "w-8 h-8 rounded-full grid place-items-center transition-transform cursor-pointer border-0 outline-none",
                      isSelected
                        ? "scale-110 shadow-lg"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    )}
                    style={{
                      backgroundColor: swatch.value,
                      boxShadow: isSelected
                        ? `0 6px 18px -2px ${swatch.value}80`
                        : undefined,
                    }}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#050608] stroke-[2.75]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Films From Vault */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Include Films from Vault
              </span>
              <span className="text-xs font-medium text-[#00D878]">
                {selectedMovieIds.length} selected
              </span>
            </div>

            {availableMovies.length > 5 && (
              <div className="relative flex items-center h-10 rounded-xl bg-secondary focus-within:bg-accent dark:bg-[#171A26] dark:focus-within:bg-[#1E2232] px-3.5 gap-2.5 transition-colors">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter your library titles..."
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none focus:ring-0"
                />
              </div>
            )}

            {availableMovies.length === 0 ? (
              <div className="rounded-2xl bg-secondary dark:bg-[#171A26] px-4 py-5 text-center text-xs text-muted-foreground">
                Save films to your library first, or create the shelf now and add films later.
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="rounded-2xl bg-secondary dark:bg-[#171A26] px-4 py-4 text-center text-xs text-muted-foreground">
                No library films match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredMovies.map((film) => {
                  const id = film.tmdb_id || film.id;
                  const isPicked = selectedMovieIds.includes(id);
                  const poster = getTmdbImageUrl(film.poster_path, "w92");
                  const year = film.release_date?.slice(0, 4);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleMovie(id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 p-2 rounded-2xl transition-colors text-left cursor-pointer",
                        isPicked
                          ? "bg-[#00D878]/15"
                          : "bg-secondary hover:bg-accent dark:bg-[#171A26] dark:hover:bg-[#1E2232]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-11 rounded-lg overflow-hidden bg-background shrink-0">
                          {poster ? (
                            <img
                              src={poster}
                              alt={film.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground">
                              <Film className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {film.title}
                          </p>
                          {year && (
                            <p className="text-[11px] text-muted-foreground">
                              {year}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          "w-7 h-7 rounded-xl grid place-items-center shrink-0 transition-colors",
                          isPicked
                            ? "bg-[#00D878] text-[#050608]"
                            : "bg-background dark:bg-white/[0.07] text-muted-foreground"
                        )}
                      >
                        {isPicked ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Seamless Action Footer */}
        <div className="px-6 py-4 bg-muted dark:bg-[#0C0E15] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-transparent hover:bg-secondary dark:hover:bg-white/[0.07] text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 px-5 rounded-xl bg-[#00D878] hover:bg-[#00C26B] text-[#050608] font-heading font-semibold text-xs shadow-lg shadow-[#00D878]/15 transition active:scale-[0.98] cursor-pointer"
          >
            {editCollection ? "Save Changes" : "Create Collection"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
