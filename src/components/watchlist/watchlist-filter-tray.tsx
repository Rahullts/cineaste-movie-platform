"use client";

import * as React from "react";
import { Heart, RotateCcw } from "lucide-react";
import { CuratedStar } from "./watchlist-icons";

export interface FilterState {
  genre: string;
  year: string;
  runtime: string;
  minRating: string;
}

export const INITIAL_FILTER_STATE: FilterState = {
  genre: "",
  year: "",
  runtime: "",
  minRating: "",
};

interface WatchlistFilterTrayProps {
  isOpen: boolean;
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  availableGenres: string[];
  availableYears: string[];
}

/**
 * Cineaste Personal Film Archive — Collapsible Filter Tray
 * Compact dropdown selectors for Genre, Release Year, Runtime, TMDB Rating, and Favorites.
 */
export function WatchlistFilterTray({
  isOpen,
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  availableGenres,
  availableYears,
}: WatchlistFilterTrayProps) {
  if (!isOpen) return null;

  return (
    <div className="rounded-2xl bg-[#101118]/95 backdrop-blur-md p-3 sm:p-4 shadow-xl animate-fadeIn space-y-3">
      <div className="flex items-center justify-between text-xs text-[#9496A1] font-mono pb-2">
        <span className="uppercase tracking-wider font-semibold text-white/80">
          Archive Filter Matrix
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[#00D878] hover:underline transition font-sans"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Genre Selector */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#9496A1]">
            Genre
          </label>
          <select
            value={filters.genre}
            onChange={(e) => onChange({ genre: e.target.value })}
            className={`h-9 rounded-xl bg-[#14151F] px-3 text-xs outline-none transition cursor-pointer shadow-sm ${
              filters.genre
                ? "text-white font-medium ring-1 ring-[#00D878]/50"
                : "text-[#9496A1] hover:text-white"
            }`}
          >
            <option value="" className="bg-[#101118]">
              All Genres
            </option>
            {availableGenres.map((g) => (
              <option key={g} value={g} className="bg-[#101118]">
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#9496A1]">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChange({ year: e.target.value })}
            className={`h-9 rounded-xl bg-[#14151F] px-3 text-xs outline-none transition cursor-pointer shadow-sm ${
              filters.year
                ? "text-white font-medium ring-1 ring-[#00D878]/50"
                : "text-[#9496A1] hover:text-white"
            }`}
          >
            <option value="" className="bg-[#101118]">
              All Years
            </option>
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-[#101118]">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Runtime Selector */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#9496A1]">
            Runtime
          </label>
          <select
            value={filters.runtime}
            onChange={(e) => onChange({ runtime: e.target.value })}
            className={`h-9 rounded-xl bg-[#14151F] px-3 text-xs outline-none transition cursor-pointer shadow-sm ${
              filters.runtime
                ? "text-white font-medium ring-1 ring-[#00D878]/50"
                : "text-[#9496A1] hover:text-white"
            }`}
          >
            <option value="" className="bg-[#101118]">
              Any Length
            </option>
            <option value="short" className="bg-[#101118]">
              ≤ 90 min
            </option>
            <option value="medium" className="bg-[#101118]">
              90–150 min
            </option>
            <option value="long" className="bg-[#101118]">
              150+ min
            </option>
          </select>
        </div>

        {/* Rating Threshold */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#9496A1]">
            TMDB Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => onChange({ minRating: e.target.value })}
            className={`h-9 rounded-xl bg-[#14151F] px-3 text-xs outline-none transition cursor-pointer shadow-sm ${
              filters.minRating
                ? "text-white font-medium ring-1 ring-[#00D878]/50"
                : "text-[#9496A1] hover:text-white"
            }`}
          >
            <option value="" className="bg-[#101118]">
              Any Score
            </option>
            <option value="7" className="bg-[#101118]">
              7+ ★
            </option>
            <option value="8" className="bg-[#101118]">
              8+ ★
            </option>
            <option value="9" className="bg-[#101118]">
              9+ ★
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
