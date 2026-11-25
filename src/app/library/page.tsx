"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tv,
  Bookmark,
  CheckCircle2,
  Heart,
  FolderHeart,
  Calendar,
  Upload,
  Clock,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlignJustify,
  ArrowUpDown,
  Search,
  RotateCcw,
  Film,
  Star,
  Library as LibraryIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  WatchlistCommandBar,
  ViewMode,
  SortOption,
  SortDirection,
} from "@/components/watchlist/watchlist-command-bar";
import {
  WatchlistFilterTray,
  FilterState,
  INITIAL_FILTER_STATE,
} from "@/components/watchlist/watchlist-filter-tray";
import { WatchlistFilterChips } from "@/components/watchlist/watchlist-filter-chips";
import { MoviePosterCard } from "@/components/movie-poster-card";
import { WatchlistListView } from "@/components/watchlist/watchlist-list-view";
import { WatchlistCompactView } from "@/components/watchlist/watchlist-compact-view";
import { FavoritesSection } from "@/components/library/favorites-section";
import { CollectionsSection } from "@/components/library/collections-section";
import { CreateCollectionDialog } from "@/components/library/create-collection-dialog";
import { AddToCollectionDialog } from "@/components/library/add-to-collection-dialog";
import { CollectionDetailSheet } from "@/components/library/collection-detail-sheet";
import { TimelineSection } from "@/components/activity/timeline-section";
import { ImportSection } from "@/components/activity/import-section";
import { useLibrary } from "@/lib/library-store";
import { formatScore, formatYear, cn } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, Collection } from "@/types";

function formatWatchedDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return undefined;
  }
}

export type LibraryTabKey =
  | "currently-watching"
  | "all-films"
  | "watched"
  | "favorites"
  | "collections"
  | "timeline"
  | "import";

interface LibraryTabConfig {
  key: LibraryTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getCount?: (store: any) => number | string;
}

/**
 * Cineaste My Library — Exactly SEVEN internal tabs in strict order:
 * 1. Currently Watching
 * 2. All Films
 * 3. Watched
 * 4. Favorites
 * 5. Collections
 * 6. Timeline
 * 7. Import
 */
const LIBRARY_TABS: LibraryTabConfig[] = [
  {
    key: "currently-watching",
    label: "Currently Watching",
    icon: Tv,
    getCount: (s) => s.movies.filter((m: Movie) => m.status === "watching").length,
  },
  {
    key: "all-films",
    label: "All Films",
    icon: Bookmark,
    getCount: (s) => s.movies.length,
  },
  {
    key: "watched",
    label: "Watched",
    icon: CheckCircle2,
    getCount: (s) => s.movies.filter((m: Movie) => m.status === "watched").length,
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    getCount: (s) => s.movies.filter((m: Movie) => m.is_favorite).length,
  },
  {
    key: "collections",
    label: "Collections",
    icon: FolderHeart,
    getCount: (s) => s.collections.length,
  },
  {
    key: "timeline",
    label: "Timeline",
    icon: Calendar,
  },
  {
    key: "import",
    label: "Import",
    icon: Upload,
  },
];

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const library = useLibrary();

  const tabRailRef = React.useRef<HTMLDivElement>(null);
  const [canScrollTabsRight, setCanScrollTabsRight] = React.useState(false);

  const checkTabsOverflow = React.useCallback(() => {
    const el = tabRailRef.current;
    if (!el) return;
    setCanScrollTabsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    checkTabsOverflow();
    window.addEventListener("resize", checkTabsOverflow);
    return () => window.removeEventListener("resize", checkTabsOverflow);
  }, [checkTabsOverflow, library.movies.length, library.collections.length]);

  // Primary tab state synced with URL ?tab=...
  const rawTab = (searchParams.get("tab") || "all-films").toLowerCase();
  const activeTab: LibraryTabKey =
    rawTab === "currently-watching" || rawTab === "watching"
      ? "currently-watching"
      : rawTab === "all-films" || rawTab === "all" || rawTab === "watchlist"
      ? "all-films"
      : rawTab === "watched"
      ? "watched"
      : rawTab === "favorites" || rawTab === "favorite"
      ? "favorites"
      : rawTab === "collections" || rawTab === "collection"
      ? "collections"
      : rawTab === "timeline"
      ? "timeline"
      : rawTab === "import"
      ? "import"
      : "all-films";

  const handleTabChange = (tab: LibraryTabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/library?${params.toString()}`, { scroll: false });
  };

  // View & Filter states for All Films / Currently Watching / Watched
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [sortBy, setSortBy] = React.useState<SortOption>("recent");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [isFiltersOpen, setIsFiltersOpen] = React.useState<boolean>(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [filters, setFilters] = React.useState<FilterState>(INITIAL_FILTER_STATE);

  const handleOpenMovieDetail = (movie: Movie) => {
    router.push(`/movie/${movie.tmdb_id || movie.id}`);
  };

  // Collections dialog states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null);
  const [detailCollection, setDetailCollection] = React.useState<Collection | null>(null);
  const [movieForAddDialog, setMovieForAddDialog] = React.useState<Movie | null>(null);

  // Derive active collection live from shared LibraryContext so edits/adds reflect without closing
  const activeDetailCollection = React.useMemo(() => {
    if (!detailCollection) return null;
    const resolvedId = library.resolveCollectionId(detailCollection.id);
    return (
      library.collections.find(
        (c) => c.id === detailCollection.id || c.id === resolvedId
      ) || null
    );
  }, [detailCollection, library]);

  // Categorized movie datasets
  const watchingMovies = React.useMemo(() => {
    return library.movies.filter((m) => m.status === "watching");
  }, [library.movies]);

  const watchlistMovies = React.useMemo(() => {
    return library.movies.filter((m) => (m.status || "want") !== "watched");
  }, [library.movies]);

  const watchedMovies = React.useMemo(() => {
    return library.movies.filter((m) => m.status === "watched");
  }, [library.movies]);

  const favoriteMovies = React.useMemo(() => {
    return library.movies.filter((m) => m.is_favorite);
  }, [library.movies]);

  // Total watched runtime calculation
  const totalWatchedMinutes = React.useMemo(() => {
    return watchedMovies.reduce((acc, m) => acc + (m.runtime || 110), 0);
  }, [watchedMovies]);

  // Genre extractor
  const getGenreNames = React.useCallback((m: Movie): string[] => {
    if (m.genres && Array.isArray(m.genres)) {
      return m.genres.map((g: any) => (typeof g === "string" ? g : g?.name || "")).filter(Boolean);
    }
    return [];
  }, []);

  // Filter & sort for All Films Tab
  const processedAllMovies = React.useMemo(() => {
    let list = [...library.movies];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (filters.genre) {
      list = list.filter((m) =>
        getGenreNames(m).some((g) => g.toLowerCase() === filters.genre.toLowerCase())
      );
    }
    if (filters.year) {
      list = list.filter((m) => formatYear(m.release_date) === filters.year);
    }
    if (filters.runtime) {
      list = list.filter((m) => {
        const r = m.runtime || 0;
        if (filters.runtime === "<90") return r > 0 && r < 90;
        if (filters.runtime === "90-120") return r >= 90 && r <= 120;
        if (filters.runtime === ">120") return r > 120;
        return true;
      });
    }
    if (filters.minRating) {
      const min = parseFloat(filters.minRating);
      list = list.filter((m) => (m.vote_average || 0) >= min);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "year") {
        const ya = parseInt(formatYear(a.release_date)) || 0;
        const yb = parseInt(formatYear(b.release_date)) || 0;
        cmp = ya - yb;
      } else if (sortBy === "rating") {
        cmp = (a.vote_average || 0) - (b.vote_average || 0);
      } else if (sortBy === "runtime") {
        cmp = (a.runtime || 0) - (b.runtime || 0);
      } else {
        const ta = new Date(a.created_date || 0).getTime();
        const tb = new Date(b.created_date || 0).getTime();
        cmp = ta - tb;
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });

    return list;
  }, [library.movies, searchTerm, filters, sortBy, sortDirection, getGenreNames]);

  // Overall Statistics Metrics (5 core metrics per specification)
  const stats = React.useMemo(() => {
    const want = watchlistMovies.length;
    const watched = watchedMovies.length;
    const fav = favoriteMovies.length;
    const collectionsCount = library.collections.length;
    const hours = Math.floor(totalWatchedMinutes / 60);

    return { want, watched, fav, collectionsCount, hours };
  }, [watchlistMovies, watchedMovies, favoriteMovies, library.collections, totalWatchedMinutes]);

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

  const handleToggleWatched = (movie: Movie) => {
    if (movie.status === "watched") {
      library.updateStatus(movie.tmdb_id || movie.id, "want");
    } else {
      library.markWatched(movie);
    }
  };

  const handleToggleInCollection = (collectionId: string, movie: Movie) => {
    const resolvedId = library.resolveCollectionId(collectionId);
    const col = library.collections.find(
      (c) => c.id === collectionId || c.id === resolvedId
    );
    if (!col) return;
    const mId = movie.tmdb_id || movie.id;
    const currentIds =
      col.movie_ids || (col.movies || []).map((m) => m.tmdb_id || m.id);
    if (currentIds.includes(mId)) {
      void library.removeMovieFromCollection(col.id, mId);
    } else {
      void library.addMovieToCollection(col.id, movie);
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-7 space-y-6 sm:space-y-8 pb-24 select-none">
        {/* ================================================================= */}
        {/* COMPACT MY LIBRARY HEADER                                         */}
        {/* ================================================================= */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <LibraryIcon className="w-6 h-6 text-[#00D878] shrink-0" />
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                My Library
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Your personal cinema sanctuary. Screenings, queues, shelves and film diary.
            </p>
          </div>

          {/* Quick Actions with WHITE Plus Icons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-quick-add"))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00D878] hover:bg-[#00BF59] text-white font-bold text-xs shadow-md shadow-[#00D878]/20 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
              <span className="text-white">Quick Add</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCollection(null);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card hover:bg-muted text-foreground font-semibold text-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Collection</span>
            </button>
          </div>
        </section>

        {/* ================================================================= */}
        {/* COMPACT 7-TAB HORIZONTAL SUB-NAVIGATION (Zero Tab Clipping)       */}
        {/* ================================================================= */}
        <div className="relative">
          <div
            ref={tabRailRef}
            onScroll={checkTabsOverflow}
            className="flex items-center md:flex-wrap gap-1.5 overflow-x-auto md:overflow-visible no-scrollbar pb-2.5 pr-8 md:pr-0"
          >
            {LIBRARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const count = tab.getCount ? tab.getCount(library) : null;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-[#00D878]/15 text-[#00D878] font-bold ring-1 ring-[#00D878]/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive && "text-[#00D878]")} />
                  <span>{tab.label}</span>
                  {count !== null && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                        isActive
                          ? "bg-[#00D878]/20 text-[#00D878] font-bold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {canScrollTabsRight && (
            <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-2.5 w-12 bg-gradient-to-l from-background via-background/85 to-transparent flex items-center justify-end">
              <button
                type="button"
                aria-label="Scroll library tabs right"
                onClick={() => tabRailRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
                className="pointer-events-auto h-7 w-7 rounded-full bg-card border border-border text-foreground grid place-items-center shadow-md cursor-pointer"
              >
                <span className="text-xs font-bold">›</span>
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: CURRENTLY WATCHING                                         */}
        {/* ================================================================= */}
        {activeTab === "currently-watching" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#00D878]" />
                  <span>Currently Watching ({watchingMovies.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Films and series you have actively started and are in progress.
                </p>
              </div>
            </div>

            {watchingMovies.length === 0 ? (
              <div className="rounded-3xl bg-card/40 p-12 text-center space-y-4 shadow-xl border border-border/40">
                <div className="w-14 h-14 rounded-2xl bg-[#00D878]/10 text-[#00D878] mx-auto grid place-items-center">
                  <Tv className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-foreground">No active screenings</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click &ldquo;Currently Watching&rdquo; inside any film&apos;s details to feature it in your active screening room.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("all-films")}
                  className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold cursor-pointer"
                >
                  Browse All Films
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {watchingMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    subLabel="Watching"
                    enableWatchedAction={true}
                    onOpenDetail={() => handleOpenMovieDetail(movie)}
                    onToggleWatched={() => handleToggleWatched(movie)}
                    onToggleFavorite={() => library.toggleFavorite(movie)}
                    onRemove={(id) => library.removeFromWatchlist(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ALL FILMS                                                  */}
        {/* ================================================================= */}
        {activeTab === "all-films" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/80 p-3 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">
                  Films ({processedAllMovies.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    isFiltersOpen || filters.genre || filters.year || filters.runtime || filters.minRating
                      ? "bg-[#00D878]/15 text-[#00D878]"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>
              </div>

              {/* View Modes & Sorting */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-card text-xs text-foreground rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#00D878]"
                >
                  <option value="recent">Recently Added</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="year">Release Year</option>
                  <option value="rating">Rating</option>
                  <option value="runtime">Runtime</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                  className="p-1.5 rounded-lg bg-card text-muted-foreground hover:text-foreground cursor-pointer"
                  title={`Direction: ${sortDirection}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>

                {/* View Modes */}
                <div className="flex items-center bg-card rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md cursor-pointer",
                      viewMode === "grid" ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md cursor-pointer",
                      viewMode === "list" ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("compact")}
                    className={cn(
                      "p-1.5 rounded-md cursor-pointer",
                      viewMode === "compact" ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Compact View"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tray */}
            {isFiltersOpen && (
              <div className="p-4 rounded-2xl bg-card space-y-3 shadow-xl animate-slideDown">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground uppercase">Filter Catalog</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setFilters(INITIAL_FILTER_STATE);
                    }}
                    className="text-xs text-[#00D878] hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full h-9 px-3 rounded-lg bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-[#00D878]"
                  />
                  <select
                    value={filters.runtime}
                    onChange={(e) => setFilters((f) => ({ ...f, runtime: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-[#00D878]"
                  >
                    <option value="">Any Runtime</option>
                    <option value="<90">&lt; 90 mins</option>
                    <option value="90-120">90 - 120 mins</option>
                    <option value=">120">&gt; 120 mins</option>
                  </select>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters((f) => ({ ...f, minRating: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-[#00D878]"
                  >
                    <option value="">Any Rating</option>
                    <option value="8.0">8.0+ Rating</option>
                    <option value="7.0">7.0+ Rating</option>
                    <option value="6.0">6.0+ Rating</option>
                  </select>
                </div>
              </div>
            )}

            {/* Display Movies */}
            {processedAllMovies.length === 0 ? (
              <div className="rounded-3xl bg-card/40 p-12 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-[#00D878]/10 text-[#00D878] mx-auto grid place-items-center">
                  <Bookmark className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-foreground">Your Cinema Vault is Ready</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Add movies to your personal library using Quick Add or by discovering curated films.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("open-quick-add"))}
                  className="px-5 py-2.5 rounded-full bg-[#00D878] hover:bg-[#00BF59] text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00D878]/20"
                >
                  <Plus className="w-4 h-4 text-white stroke-[3]" />
                  <span>Quick Add Film</span>
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {processedAllMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    subLabel={
                      movie.status === "watched"
                        ? "Watched"
                        : movie.status === "watching"
                          ? "Watching"
                          : movie.status === "dropped"
                            ? "Dropped"
                            : "In Watchlist"
                    }
                    onOpenDetail={() => handleOpenMovieDetail(movie)}
                    enableWatchedAction={true}
                    onToggleWatched={() => handleToggleWatched(movie)}
                    onToggleFavorite={() => library.toggleFavorite(movie)}
                    onRemove={(id) => library.removeFromWatchlist(id)}
                  />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <WatchlistListView
                items={processedAllMovies}
                onOpenDetail={handleOpenMovieDetail}
                onToggleWatched={handleToggleWatched}
                onToggleFavorite={library.toggleFavorite}
                onRemove={(id) => library.removeFromWatchlist(id)}
              />
            ) : (
              <WatchlistCompactView
                items={processedAllMovies}
                onOpenDetail={handleOpenMovieDetail}
                onToggleFavorite={library.toggleFavorite}
                onRemove={(id) => library.removeFromWatchlist(id)}
              />
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: WATCHED MOVIES                                             */}
        {/* ================================================================= */}
        {activeTab === "watched" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                  <span>Logged Screenings ({watchedMovies.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Films you have finished watching with your personal ratings and screening history.
                </p>
              </div>
            </div>

            {watchedMovies.length === 0 ? (
              <div className="rounded-3xl bg-card/40 p-12 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 text-[#38BDF8] mx-auto grid place-items-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-foreground">No watched movies yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Mark films as watched from your queue or log screenings with personal ratings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {watchedMovies.map((movie, idx) => (
                  <MoviePosterCard
                    key={movie.tmdb_id || movie.id}
                    movie={movie}
                    variant="grid"
                    index={idx}
                    isWatched={true}
                    watchedDate={formatWatchedDate(movie.watched_date || movie.watched_at)}
                    personalRating={typeof movie.rating === "number" ? movie.rating : undefined}
                    enableWatchedAction={true}
                    onOpenDetail={() => handleOpenMovieDetail(movie)}
                    onToggleWatched={() => handleToggleWatched(movie)}
                    onToggleFavorite={() => library.toggleFavorite(movie)}
                    onRemove={(id) => library.removeFromWatchlist(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: FAVORITES                                                  */}
        {/* ================================================================= */}
        {activeTab === "favorites" && (
          <FavoritesSection
            favoriteMovies={favoriteMovies}
            onOpenDetail={handleOpenMovieDetail}
            onToggleFavorite={library.toggleFavorite}
            onOpenAddToCollection={(m) => setMovieForAddDialog(m)}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 5: COLLECTIONS                                                */}
        {/* ================================================================= */}
        {activeTab === "collections" && (
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
            onDeleteCollection={(id) => library.deleteCollection(id)}
            onSelectCollection={(col) => setDetailCollection(col)}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 6: TIMELINE                                                   */}
        {/* ================================================================= */}
        {activeTab === "timeline" && (
          <TimelineSection
            movies={library.movies}
            activities={library.activities}
            collections={library.collections}
            onOpenDetail={handleOpenMovieDetail}
            onNavigateToImport={() => handleTabChange("import")}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 7: IMPORT                                                     */}
        {/* ================================================================= */}
        {activeTab === "import" && (
          <ImportSection
            existingMovies={library.movies}
            onBatchImport={(movies, acts) => library.batchImportMovies(movies, acts)}
            onCreateCollection={(title, color, desc, initial) =>
              library.createCollection(title, color, desc, initial)
            }
          />
        )}

        {/* ================================================================= */}
        {/* DIALOGS & OVERLAYS                                                */}
        {/* ================================================================= */}
        <CreateCollectionDialog
          isOpen={isCreateOpen}
          editCollection={editingCollection}
          availableMovies={library.movies}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingCollection(null);
          }}
          onSave={handleSaveCollection}
        />

        <AddToCollectionDialog
          isOpen={Boolean(movieForAddDialog)}
          movie={movieForAddDialog}
          collections={library.collections}
          onClose={() => setMovieForAddDialog(null)}
          onCreateCollection={(title, color, desc, initial) =>
            library.createCollection(title, color, desc, initial)
          }
          onToggleInCollection={handleToggleInCollection}
        />

        <CollectionDetailSheet
          collection={activeDetailCollection}
          allLibraryMovies={library.movies}
          onClose={() => setDetailCollection(null)}
          onSelectMovieForDetail={handleOpenMovieDetail}
          onRemoveMovie={(colId, mId) => library.removeMovieFromCollection(colId, mId)}
          onAddMovie={(colId, movie) => library.addMovieToCollection(colId, movie)}
          onEdit={(c) => {
            setDetailCollection(null);
            setEditingCollection(c);
            setIsCreateOpen(true);
          }}
          onDelete={(colId) => {
            library.deleteCollection(colId);
            setDetailCollection(null);
          }}
        />
      </div>
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0A0B0F]" />}>
      <LibraryContent />
    </React.Suspense>
  );
}
