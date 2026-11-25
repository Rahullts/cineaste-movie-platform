"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Upload, Calendar, Gem } from "lucide-react";
import { useLibrary } from "@/lib/library-store";
import { AppShell } from "@/components/layout/app-shell";
import { ImportSection } from "@/components/activity/import-section";
import { TimelineSection } from "@/components/activity/timeline-section";
import { CollectionsSection } from "@/components/library/collections-section";
import { CreateCollectionDialog } from "@/components/library/create-collection-dialog";
import { AddToCollectionDialog } from "@/components/library/add-to-collection-dialog";
import { CollectionDetailSheet } from "@/components/library/collection-detail-sheet";
import type { Movie, Collection } from "@/types";

type ActivityTab = "import" | "collections" | "timeline";

function ActivityHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const library = useLibrary();

  // Active Tab state synced with URL ?tab=import|collections|timeline
  const tabParam = searchParams.get("tab");
  const activeTab: ActivityTab =
    tabParam === "import"
      ? "import"
      : tabParam === "collections"
      ? "collections"
      : "timeline";

  const handleTabChange = (tab: ActivityTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/activity?${params.toString()}`, { scroll: false });
  };

  const handleOpenMovieDetail = (movie: Movie) => {
    router.push(`/movie/${movie.tmdb_id || movie.id}`);
  };

  // Collections dialog and sheet states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = React.useState<Collection | null>(null);
  const [addToColMovie, setAddToColMovie] = React.useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = React.useState<Movie | null>(null);

  // Keep selectedCollection in sync with library updates (including temp->UUID resolution)
  React.useEffect(() => {
    if (selectedCollection) {
      const resolvedId = library.resolveCollectionId(selectedCollection.id);
      const refreshed = library.collections.find(
        (c) => c.id === selectedCollection.id || c.id === resolvedId
      );
      if (refreshed) {
        if (refreshed !== selectedCollection) {
          setSelectedCollection(refreshed);
        }
      } else {
        setSelectedCollection(null);
      }
    }
  }, [library, selectedCollection]);

  const handleSaveCollection = (
    title: string,
    color: string,
    description: string,
    selectedMovies: Movie[]
  ) => {
    if (editingCollection) {
      library.updateCollection(editingCollection.id, {
        title,
        color,
        description,
        movie_ids: selectedMovies.map((m) => m.tmdb_id || m.id),
        movies: selectedMovies,
        movie_count: selectedMovies.length,
      });
      setEditingCollection(null);
    } else {
      library.createCollection(title, color, description, selectedMovies);
    }
  };

  const handleToggleInCollection = (collectionId: string, movie: Movie) => {
    const resolvedId = library.resolveCollectionId(collectionId);
    const col = library.collections.find(
      (c) => c.id === collectionId || c.id === resolvedId
    );
    if (!col) return;
    const movieId = movie.tmdb_id || movie.id;
    const currentIds =
      col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);

    if (currentIds.includes(movieId)) {
      void library.removeMovieFromCollection(col.id, movieId);
    } else {
      void library.addMovieToCollection(col.id, movie);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 select-none">
      {/* Shared Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-[#1E1F2A] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00D664] bg-[#00D664]/10 border border-[#00D664]/20 px-2.5 py-0.5 rounded-full">
              Cinema Chronicle
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            Activity Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#9496A1]">
            Everything you add, import and experience — in one place.
          </p>
        </div>

        {/* Unified 3-Tab Segmented Internal Navigation */}
        <div className="flex items-center p-1 rounded-2xl bg-[#141520] border border-[#1E1F2A] shadow-inner">
          {/* Tab 1: Import */}
          <button
            type="button"
            onClick={() => handleTabChange("import")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === "import"
                ? "bg-[#00D664] text-black shadow-lg shadow-[#00D664]/25"
                : "text-[#9496A1] hover:text-white hover:bg-white/5"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Tab 2: Collections (Identified with Gem icon) */}
          <button
            type="button"
            onClick={() => handleTabChange("collections")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === "collections"
                ? "bg-[#00D664] text-black shadow-lg shadow-[#00D664]/25"
                : "text-[#9496A1] hover:text-white hover:bg-white/5"
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Collections</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === "collections"
                  ? "bg-black/20 text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {library.collections.length}
            </span>
          </button>

          {/* Tab 3: Timeline */}
          <button
            type="button"
            onClick={() => handleTabChange("timeline")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === "timeline"
                ? "bg-[#00D664] text-black shadow-lg shadow-[#00D664]/25"
                : "text-[#9496A1] hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Tab 1: Import Section */}
      <div className={activeTab === "import" ? "block" : "hidden"}>
        <ImportSection
          existingMovies={library.movies}
          onBatchImport={library.batchImportMovies}
          onCreateCollection={library.createCollection}
        />
      </div>

      {/* Main Tab 2: Collections Section */}
      <div className={activeTab === "collections" ? "block" : "hidden"}>
        <CollectionsSection
          collections={library.collections}
          allMovies={library.movies}
          onOpenCreate={() => {
            setEditingCollection(null);
            setIsCreateOpen(true);
          }}
          onOpenEdit={(col) => {
            setEditingCollection(col);
            setIsCreateOpen(true);
          }}
          onDeleteCollection={library.deleteCollection}
          onSelectCollection={(col) => setSelectedCollection(col)}
        />
      </div>

      {/* Main Tab 3: Timeline Section */}
      <div className={activeTab === "timeline" ? "block" : "hidden"}>
        <TimelineSection
          movies={library.movies}
          activities={library.activities}
          collections={library.collections}
          onOpenDetail={handleOpenMovieDetail}
          onNavigateToImport={() => handleTabChange("import")}
        />
      </div>

      {/* Create / Edit Collection Dialog */}
      <CreateCollectionDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCollection(null);
        }}
        onSave={handleSaveCollection}
        availableMovies={library.movies}
        editCollection={editingCollection}
      />

      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        isOpen={Boolean(addToColMovie)}
        onClose={() => setAddToColMovie(null)}
        movie={addToColMovie}
        collections={library.collections}
        onToggleInCollection={handleToggleInCollection}
        onCreateCollection={(title, color, desc, initial) =>
          library.createCollection(title, color, desc, initial)
        }
      />

      {/* Collection Detail Slide-Over Sheet */}
      <CollectionDetailSheet
        collection={selectedCollection}
        onClose={() => setSelectedCollection(null)}
        onEdit={(col) => {
          setSelectedCollection(null);
          setEditingCollection(col);
          setIsCreateOpen(true);
        }}
        onDelete={(colId) => {
          library.deleteCollection(colId);
          setSelectedCollection(null);
        }}
        onRemoveMovie={library.removeMovieFromCollection}
        onAddMovie={library.addMovieToCollection}
        onSelectMovieForDetail={handleOpenMovieDetail}
        allLibraryMovies={library.movies}
      />
    </div>
  );
}

export default function ActivityHubPage() {
  return (
    <AppShell>
      <React.Suspense
        fallback={
          <div className="w-full py-16 text-center text-xs text-[#9496A1]">
            Loading Activity Hub...
          </div>
        }
      >
        <ActivityHubContent />
      </React.Suspense>
    </AppShell>
  );
}
