"use client";

import * as React from "react";
import { X, RotateCcw } from "lucide-react";
import type { FilterState } from "./watchlist-filter-tray";

interface WatchlistFilterChipsProps {
  search: string;
  onClearSearch: () => void;
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
  totalFilteredCount: number;
}

const RUNTIME_LABELS: Record<string, string> = {
  short: "≤ 90 min",
  medium: "90–150 min",
  long: "150+ min",
};

/**
 * Cineaste Removable Filter Chips Bar
 * Displays active filters as clean, removable chips below the toolbar.
 */
export function WatchlistFilterChips({
  search,
  onClearSearch,
  filters,
  onRemoveFilter,
  onClearAll,
  totalFilteredCount,
}: WatchlistFilterChipsProps) {
  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];

  if (search.trim()) {
    activeChips.push({
      id: "search",
      label: `Search: "${search}"`,
      onRemove: onClearSearch,
    });
  }

  if (filters.genre) {
    activeChips.push({
      id: "genre",
      label: `Genre: ${filters.genre}`,
      onRemove: () => onRemoveFilter("genre"),
    });
  }

  if (filters.year) {
    activeChips.push({
      id: "year",
      label: `Year: ${filters.year}`,
      onRemove: () => onRemoveFilter("year"),
    });
  }

  if (filters.runtime) {
    activeChips.push({
      id: "runtime",
      label: `Runtime: ${RUNTIME_LABELS[filters.runtime] || filters.runtime}`,
      onRemove: () => onRemoveFilter("runtime"),
    });
  }

  if (filters.minRating) {
    activeChips.push({
      id: "minRating",
      label: `Rating: ${filters.minRating}+ ★`,
      onRemove: () => onRemoveFilter("minRating"),
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
      <span className="text-xs text-[#9496A1] font-mono mr-1">
        Active ({activeChips.length}):
      </span>

      {activeChips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181820] border border-[#1E1F2A] text-xs text-white hover:border-[#00D878]/40 transition group"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="w-4 h-4 rounded-full flex items-center justify-center text-[#9496A1] hover:text-[#00D878] hover:bg-white/10 transition"
            title="Remove filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {activeChips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 text-xs text-[#00D878] hover:underline ml-1 font-medium transition"
        >
          <RotateCcw className="w-3 h-3" />
          Clear All
        </button>
      )}

      <span className="text-xs text-[#9496A1]/60 font-mono ml-auto hidden sm:inline">
        Showing {totalFilteredCount} matching films
      </span>
    </div>
  );
}
