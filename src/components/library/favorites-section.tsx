"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Film,
  Star,
  FolderPlus,
  Compass,
  ArrowUpDown,
} from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie } from "@/types";

interface FavoritesSectionProps {
  favoriteMovies: Movie[];
  onToggleFavorite: (movie: Movie) => void;
  onOpenDetail: (movie: Movie) => void;
  onOpenAddToCollection: (movie: Movie) => void;
}

export function FavoritesSection({
  favoriteMovies,
  onToggleFavorite,
  onOpenDetail,
  onOpenAddToCollection,
}: FavoritesSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState<string>("all");
  const [selectedDecade, setSelectedDecade] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"title" | "rating" | "release" | "recent">("recent");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Extract available genres from favorites
  const availableGenres = React.useMemo(() => {
    const genreSet = new Set<string>();
    favoriteMovies.forEach((m) => {
      (m.genres || []).forEach((g) => {
        const name = typeof g === "string" ? g : g.name;
        if (name) genreSet.add(name);
      });
    });
    return Array.from(genreSet).sort();
  }, [favoriteMovies]);

  // Filter & Sort
  const processedFavorites = React.useMemo(() => {
    let result = favoriteMovies.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDirector = m.director && m.director.toLowerCase().includes(q);
        if (!matchTitle && !matchDirector) return false;
      }
      // Genre
      if (selectedGenre !== "all") {
        const hasGenre = (m.genres || []).some((g) => {
          const name = typeof g === "string" ? g : g.name;
          return name === selectedGenre;
        });
        if (!hasGenre) return false;
      }
      // Decade
      if (selectedDecade !== "all" && m.release_date) {
        const year = parseInt(m.release_date.split("-")[0], 10);
        if (selectedDecade === "2020s" && year < 2020) return false;
        if (selectedDecade === "2010s" && (year < 2010 || year > 2019)) return false;
        if (selectedDecade === "2000s" && (year < 2000 || year > 2009)) return false;
        if (selectedDecade === "1990s" && (year < 1990 || year > 1999)) return false;
        if (selectedDecade === "classic" && year >= 1990) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "rating") {
        const ratingA = a.rating || Number(a.vote_average) || 0;
        const ratingB = b.rating || Number(b.vote_average) || 0;
        return ratingB - ratingA;
      }
      if (sortBy === "release") {
        const yearA = a.release_date ? parseInt(a.release_date.split("-")[0], 10) : 0;
        const yearB = b.release_date ? parseInt(b.release_date.split("-")[0], 10) : 0;
        return yearB - yearA;
      }
      // Default: recent (updated_date or created_date)
      const dateA = new Date(a.updated_date || a.created_date || 0).getTime();
      const dateB = new Date(b.updated_date || b.created_date || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [favoriteMovies, searchQuery, selectedGenre, selectedDecade, sortBy]);

  return (
    <div className="space-y-6">
      {/* Command & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#101118]/80 backdrop-blur-md shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Left: Summary & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 shrink-0">
            <Heart className="w-4 h-4 text-[#00D878] fill-[#00D878]" />
            <span className="text-xs font-bold text-white font-mono">
              {favoriteMovies.length} {favoriteMovies.length === 1 ? "Favorite" : "Favorites"}
            </span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9496A1]" />
            <input
              type="text"
              placeholder="Search favorites by title or director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#141520] focus:bg-[#1B1D2C] text-xs text-white placeholder:text-[#9496A1]/60 outline-none border-0 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* Right: Filters, Sorting & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#141520] focus:bg-[#1B1D2C] text-xs text-white outline-none border-0 cursor-pointer transition-colors"
            >
              <option value="all">All Genres</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          {/* Era Filter */}
          <select
            value={selectedDecade}
            onChange={(e) => setSelectedDecade(e.target.value)}
            className="h-9 px-3 rounded-xl bg-[#141520] focus:bg-[#1B1D2C] text-xs text-white outline-none border-0 cursor-pointer transition-colors"
          >
            <option value="all">All Eras</option>
            <option value="2020s">2020s</option>
            <option value="2010s">2010s</option>
            <option value="2000s">2000s</option>
            <option value="1990s">1990s</option>
            <option value="classic">Classics (&lt; 1990)</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-[#141520] focus:bg-[#1B1D2C] text-xs text-white outline-none border-0 cursor-pointer transition-colors"
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="release">Release Year</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>

          {/* View Switcher */}
          <div className="flex items-center rounded-xl bg-[#141520] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-[#00D878] text-black"
                  : "text-[#9496A1] hover:text-white"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-[#00D878] text-black"
                  : "text-[#9496A1] hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid, List, or Empty State */}
      {processedFavorites.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#101118]/60 p-8 space-y-4 shadow-xl">
          <span className="w-16 h-16 rounded-3xl bg-[#00D878]/10 grid place-items-center text-[#00D878] mx-auto shadow-xl">
            <Heart className="w-8 h-8 fill-[#00D878]" />
          </span>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading text-lg font-bold text-white">
              {searchQuery || selectedGenre !== "all" || selectedDecade !== "all"
                ? "No matching favorites"
                : "No Favorites Saved Yet"}
            </h3>
            <p className="text-xs text-[#9496A1] leading-relaxed">
              {searchQuery || selectedGenre !== "all" || selectedDecade !== "all"
                ? "No films match your current filters. Try resetting the search or filter options."
                : "Your favorites archive holds films that define your cinematic taste. Click the heart icon on any movie in your vault or discover to bookmark it here."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/discover"
              className="px-5 py-2 rounded-full bg-[#00D878] text-black font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#00B855] transition shadow-xl shadow-[#00D878]/25"
            >
              <Compass className="w-4 h-4 stroke-[2.5]" />
              <span>Explore Discover</span>
            </Link>
            <Link
              href="/watchlist"
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs inline-flex items-center gap-2 transition"
            >
              <Film className="w-4 h-4" />
              <span>Browse Vault</span>
            </Link>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Poster Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3.5 sm:gap-4">
          {processedFavorites.map((movie) => {
            const mId = movie.tmdb_id || movie.id;
            const posterUrl = getTmdbImageUrl(movie.poster_path, "w500");

            return (
              <div
                key={mId}
                className="group relative rounded-2xl overflow-hidden bg-[#101118] transition-all duration-300 shadow-xl flex flex-col hover:-translate-y-1"
              >
                {/* Poster Artwork */}
                <div
                  className="relative aspect-[2/3] w-full bg-[#181922] cursor-pointer overflow-hidden"
                  onClick={() => onOpenDetail(movie)}
                >
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 16vw, 12vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-[#9496A1]">
                      No Poster
                    </div>
                  )}

                  {/* Gradient bottom shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#101118] via-[#101118]/70 to-transparent pointer-events-none" />

                  {/* Top-Right Favorite Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(movie);
                    }}
                    title="Remove from favorites"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/80 backdrop-blur-md text-red-500 hover:text-red-400 grid place-items-center transition shadow-lg"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>

                  {/* Top-Left Add-to-Collection */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddToCollection(movie);
                    }}
                    title="Add to Collection"
                    className="absolute top-2.5 left-2.5 w-8 h-8 rounded-xl bg-black/80 backdrop-blur-md text-[#9496A1] hover:text-[#00D878] grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>

                  {/* Rating Badge (Personal rating prioritized; community score labeled TMDB) */}
                  {movie.rating ? (
                    <div
                      title="Your Personal Cineaste Rating"
                      className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[11px] font-mono text-[#00D878] font-bold flex items-center gap-1 shadow-md"
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span>{movie.rating}/10</span>
                    </div>
                  ) : movie.vote_average && Number(movie.vote_average) > 0 ? (
                    <div
                      title="TMDB Community Score"
                      className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[11px] font-mono text-[#FBBF24] font-bold flex items-center gap-1 shadow-md"
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[9px] text-white/70">TMDB</span>
                      <span>{Number(movie.vote_average).toFixed(1)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Metadata Body */}
                <div
                  className="p-3 bg-[#101118] space-y-1 flex-1 flex flex-col justify-between cursor-pointer"
                  onClick={() => onOpenDetail(movie)}
                >
                  <p className="text-xs font-bold text-white truncate hover:text-[#00D878] transition">
                    {movie.title}
                  </p>
                  <p className="text-[10px] text-[#9496A1] truncate">
                    {movie.release_date ? movie.release_date.split("-")[0] : "Cinema"}
                    {movie.runtime ? ` • ${movie.runtime}m` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {processedFavorites.map((movie) => {
            const mId = movie.tmdb_id || movie.id;
            const posterUrl = getTmdbImageUrl(movie.poster_path, "w185");

            return (
              <div
                key={mId}
                className="group flex items-center justify-between p-3 rounded-2xl bg-[#101118] transition shadow-md gap-4"
              >
                {/* Left: Thumbnail & Info */}
                <div
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onOpenDetail(movie)}
                >
                  <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-[#181922] shrink-0">
                    {posterUrl && (
                      <Image
                        src={posterUrl}
                        alt={movie.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-[#00D878] transition">
                      {movie.title}
                    </p>
                    <p className="text-xs text-[#9496A1]">
                      {movie.release_date ? movie.release_date.split("-")[0] : "Cinema"}
                      {movie.director ? ` • Dir. ${movie.director}` : ""}
                      {movie.runtime ? ` • ${movie.runtime}m` : ""}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                {movie.rating ? (
                  <div
                    title="Your Personal Cineaste Rating"
                    className="px-2.5 py-1 rounded-lg bg-[#00D878]/10 border border-[#00D878]/30 text-xs font-mono text-[#00D878] font-bold flex items-center gap-1 shrink-0"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{movie.rating}/10</span>
                  </div>
                ) : movie.vote_average ? (
                  <div
                    title="TMDB Community Score"
                    className="px-2.5 py-1 rounded-lg bg-black/50 border border-[#FBBF24]/30 text-xs font-mono text-[#FBBF24] font-bold flex items-center gap-1 shrink-0"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[9px] text-white/70">TMDB</span>
                    <span>{Number(movie.vote_average).toFixed(1)}</span>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenAddToCollection(movie)}
                    title="Add to Collection"
                    className="p-2 rounded-xl text-[#9496A1] hover:text-[#00D878] hover:bg-white/5 border border-[#1E1F2A] transition"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(movie)}
                    title="Remove from favorites"
                    className="p-2 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-[#1E1F2A] transition"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
