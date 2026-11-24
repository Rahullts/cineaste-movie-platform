"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlignJustify,
  ArrowUpDown,
  Heart,
} from "lucide-react";
import {
  VaultMark,
  OrbitMark,
  CompletionFrameMark,
  CuratedStar,
  ArchiveStack,
} from "./watchlist-icons";
import type { Movie } from "@/types";

export type StatusTabKey = "watching" | "watched" | "all" | "favorites";
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

export interface StatusTabConfig {
  key: StatusTabKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const STATUS_TABS: StatusTabConfig[] = [
  { key: "watching", label: "Currently Watching", shortLabel: "Watching", icon: OrbitMark },
  { key: "watched", label: "Watched", shortLabel: "Watched", icon: CompletionFrameMark },
  { key: "all", label: "All Films", shortLabel: "All", icon: ArchiveStack },
  { key: "favorites", label: "Favorites", shortLabel: "Favorites", icon: Heart },
];

interface WatchlistCommandBarProps {
  activeTab: StatusTabKey;
  onTabChange: (tab: StatusTabKey) => void;
  movies: Movie[];
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
 * Cineaste Personal Film Archive — Unified Command Row
 * Exactly 4 primary internal tabs:
 * 1. Currently Watching
 * 2. Watched
 * 3. All Films
 * 4. Favorites
 */
export function WatchlistCommandBar({
  activeTab,
  onTabChange,
  movies = [],
  sortBy,
  onSortChange,
  sortDirection,
  onToggleDirection,
  isFiltersOpen,
  onToggleFilters,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
}: WatchlistCommandBarProps) {
  // Compute counts for all 4 primary tabs accurately from real library store
  const getTabCount = (tabKey: StatusTabKey): number => {
    switch (tabKey) {
      case "all":
        return movies.length;
      case "watching":
        return movies.filter((m) => m.status === "watching").length;
      case "watched":
        return movies.filter((m) => m.status === "watched").length;
      case "favorites":
        return movies.filter((m) => Boolean(m.is_favorite)).length;
      default:
        return 0;
    }
  };

  return (
    <div className="rounded-2xl bg-[#101118]/95 backdrop-blur-md p-2 sm:p-2.5 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      {/* ================================================================= */}
      {/* LEFT SIDE: 5-Category Library Navigation                          */}
      {/* ================================================================= */}
      <nav
        aria-label="Archive View Categories"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {STATUS_TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap select-none ${
                isActive
                  ? "bg-[#00D878] text-black font-semibold shadow-md shadow-[#00D878]/20"
                  : "text-[#9496A1] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                size={15}
                className={`transition-transform duration-200 ${
                  isActive ? "text-black" : "text-[#9496A1] group-hover:text-white"
                }`}
              />

              {/* Responsive Label */}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.shortLabel}</span>

              {/* Count Badge */}
              <span
                className={`text-[10px] sm:text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                  isActive
                    ? "bg-black/25 text-black"
                    : "bg-[#181820] text-[#9496A1] group-hover:text-white"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ================================================================= */}
      {/* RIGHT SIDE: Sort, Direction, Filters Toggle & View Mode Switcher  */}
      {/* ================================================================= */}
      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 justify-end shrink-0 pt-2 xl:pt-0">
        {/* Sort Criteria Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            aria-label="Sort Archive By"
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-9 sm:h-10 rounded-xl bg-[#14151F] px-3 pr-7 text-xs sm:text-sm text-white focus:ring-1 focus:ring-[#00D878]/50 outline-none transition cursor-pointer appearance-none shadow-sm"
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
          className="h-9 sm:h-10 px-2.5 rounded-xl bg-[#14151F] text-xs sm:text-sm text-[#9496A1] hover:text-white hover:bg-[#1A1B28] transition flex items-center gap-1 select-none shadow-sm"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#00D878]" />
          <span className="font-mono text-xs hidden sm:inline">
            {sortDirection === "asc" ? "ASC" : "DESC"}
          </span>
        </button>

        {/* Collapsible Filters Toggle Button */}
        <button
          type="button"
          onClick={onToggleFilters}
          className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 transition select-none shadow-sm ${
            isFiltersOpen || hasActiveFilters
              ? "bg-[#00D878]/15 text-[#00D878] font-semibold"
              : "bg-[#14151F] text-[#9496A1] hover:text-white hover:bg-[#1A1B28]"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#00D878] ml-0.5 animate-pulse" />
          )}
        </button>

        {/* 3-Way Presentation Switcher: Grid, List, Compact */}
        <div className="flex rounded-xl overflow-hidden bg-[#14151F] p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Cinematic Grid View"
            className={`w-7 h-7 sm:w-8 sm:h-8 grid place-items-center rounded-lg transition ${
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
            className={`w-7 h-7 sm:w-8 sm:h-8 grid place-items-center rounded-lg transition ${
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
            className={`w-7 h-7 sm:w-8 sm:h-8 grid place-items-center rounded-lg transition ${
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
  );
}
