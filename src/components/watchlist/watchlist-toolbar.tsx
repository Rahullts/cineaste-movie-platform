"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlignJustify,
  ArrowUpDown,
  X,
} from "lucide-react";

export type ViewMode = "grid" | "list" | "compact";
export type SortOption =
  | "recent"
  | "updated"
  | "title"
  | "year"
  | "rating"
  | "runtime";
export type SortDirection = "asc" | "desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title (A-Z)" },
  { value: "year", label: "Release year" },
  { value: "rating", label: "TMDB rating" },
  { value: "runtime", label: "Runtime" },
];

interface WatchlistToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  sortBy: SortOption;
  onSortChange: (val: SortOption) => void;
  sortDirection: SortDirection;
  onToggleDirection: () => void;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Cineaste Personal Film Archive — Streamlined Toolbar
 * Compact, unified control strip with scoped inline archive filter,
 * sorting, direction, filter drawer toggle, and 3-way view switcher.
 * NO duplicate giant search bar.
 */
export function WatchlistToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  sortDirection,
  onToggleDirection,
  isFiltersOpen,
  onToggleFilters,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
}: WatchlistToolbarProps) {
  return (
    <div className="rounded-2xl border-0 bg-[#101118]/95 backdrop-blur-md p-2 sm:p-2.5 shadow-md">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Scoped Inline Archive Filter (Compact, NOT a duplicate global search) */}
        <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9496A1] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter archive or genre..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#14151F] focus:bg-[#1B1D2C] border-0 text-xs sm:text-sm text-white placeholder:text-[#9496A1]/60 outline-none focus:outline-none focus:ring-0 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-[#9496A1] hover:text-white transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort, Direction, Filters Toggle, and View Mode Group */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 justify-end">
          {/* Sort Criteria Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              aria-label="Sort Archive By"
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="h-10 rounded-xl bg-[#14151F] focus:bg-[#1B1D2C] border-0 px-3 pr-7 text-xs sm:text-sm text-white outline-none transition-colors cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#101118]">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9496A1]">
              ▼
            </div>
          </div>

          {/* Sort Direction Toggle Button */}
          <button
            type="button"
            onClick={onToggleDirection}
            title={`Sort Direction: ${sortDirection === "asc" ? "Ascending" : "Descending"}`}
            className="h-10 px-2.5 rounded-xl bg-[#14151F] hover:bg-[#1B1D2C] border-0 text-xs sm:text-sm text-[#9496A1] hover:text-white transition flex items-center gap-1 select-none"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00D878]" />
            <span className="font-mono text-xs">{sortDirection === "asc" ? "ASC" : "DESC"}</span>
          </button>

          {/* Collapsible Filter Toggle */}
          <button
            type="button"
            onClick={onToggleFilters}
            className={`h-10 px-3.5 rounded-xl border-0 text-xs sm:text-sm inline-flex items-center gap-1.5 transition select-none ${
              isFiltersOpen || hasActiveFilters
                ? "bg-[#00D878]/18 text-[#00D878] font-semibold"
                : "bg-[#14151F] hover:bg-[#1B1D2C] text-[#9496A1] hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#00D878] ml-0.5 animate-pulse" />
            )}
          </button>

          {/* 3-Way Presentation Switcher: Grid, List, Compact */}
          <div className="flex rounded-xl border-0 overflow-hidden bg-[#14151F] p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              title="Cinematic Grid View"
              className={`w-8 h-8 grid place-items-center rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-[#00D878] text-black font-semibold shadow-sm"
                  : "text-[#9496A1] hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              title="Editorial List View"
              className={`w-8 h-8 grid place-items-center rounded-lg transition ${
                viewMode === "list"
                  ? "bg-[#00D878] text-black font-semibold shadow-sm"
                  : "text-[#9496A1] hover:text-white hover:bg-white/5"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("compact")}
              title="Compact Archive View"
              className={`w-8 h-8 grid place-items-center rounded-lg transition ${
                viewMode === "compact"
                  ? "bg-[#00D878] text-black font-semibold shadow-sm"
                  : "text-[#9496A1] hover:text-white hover:bg-white/5"
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
