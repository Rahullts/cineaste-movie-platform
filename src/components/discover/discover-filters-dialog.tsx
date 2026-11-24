"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FILTER_CATEGORIES,
  MOOD_OPTIONS,
  LANGUAGE_OPTIONS,
  YEAR_OPTIONS,
  RATING_OPTIONS,
  RUNTIME_OPTIONS,
  INITIAL_FILTER_STATE,
  type DiscoverFilterState,
} from "@/lib/constants/discover-filters";
import { TMDB_GENRES } from "@/lib/constants/tmdb-genres";

interface DiscoverFiltersDialogProps {
  filters: DiscoverFilterState;
  onChange: (updated: Partial<DiscoverFilterState>) => void;
  onClear: () => void;
  compact?: boolean;
}

/**
 * Reconstructed 1:1 replica of Cineaste Filter Trigger & Flyout (Kbe + hu)
 */
export function DiscoverFiltersDialog({
  filters,
  onChange,
  onClear,
  compact = false,
}: DiscoverFiltersDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    keyof DiscoverFilterState | null
  >(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Count active filters
  const activeCount = Object.keys(INITIAL_FILTER_STATE).filter(
    (key) => !!filters[key as keyof DiscoverFilterState]
  ).length;

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const setFilterVal = (
    key: keyof DiscoverFilterState,
    val: string | number
  ) => {
    onChange({ [key]: val });
  };

  return (
    <div className="relative shrink-0" ref={dialogRef}>
      {/* Circular Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative grid place-items-center transition-all cursor-pointer",
          compact
            ? "w-8 h-8 rounded-full text-xs"
            : "w-12 h-12 sm:h-14 sm:w-14 rounded-full shadow-lg",
          isOpen || activeCount > 0
            ? "bg-[#00D878] text-black shadow-[#00D878]/30"
            : compact
            ? "bg-transparent text-[#9496A1] hover:text-white hover:bg-white/10"
            : "bg-[#101118] border border-[#1E1F2A] text-[#F3F4F6] hover:border-[#00D878]/40"
        )}
        aria-label="Filters"
        title={activeCount > 0 ? `${activeCount} filters active` : "Open filters"}
      >
        <Filter className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
        {activeCount > 0 && (
          <span
            className={cn(
              "absolute rounded-full bg-[#00D878] text-black font-bold grid place-items-center ring-2 ring-[#0A0B0F]",
              compact
                ? "-top-1 -right-1 w-4 h-4 text-[9px]"
                : "-top-1 -right-1 min-w-[20px] h-5 px-1 text-[11px]"
            )}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Flyout Menu (exact styling from Kbe) */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 w-[320px] max-w-[calc(100vw-1.5rem)] max-h-[75vh] overflow-y-auto no-scrollbar rounded-2xl border border-[#1E1F2A] bg-[#101118]/95 backdrop-blur-2xl shadow-2xl p-4 z-50 origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-semibold text-[#F3F4F6]">Filters</span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-[#9496A1] hover:text-[#00D878] inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* 6 Category Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            {FILTER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.key;
              const hasActiveValue = !!filters[cat.key];

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(isSelected ? null : cat.key)}
                  className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl border transition ${
                    isSelected
                      ? "border-[#00D878]/50 bg-[#00D878]/10 text-[#00D878]"
                      : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{cat.label}</span>
                  {hasActiveValue && !isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#00D878]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-options for selected category */}
          {activeTab && (
            <div className="mt-3 pt-3 border-t border-[#1E1F2A]/60 max-h-52 overflow-y-auto no-scrollbar">
              {activeTab === "genre" && (
                <div className="flex flex-wrap gap-1.5">
                  {TMDB_GENRES.map((g) => {
                    const isPicked = String(filters.genre) === String(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() =>
                          setFilterVal("genre", isPicked ? "" : String(g.id))
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "mood" && (
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((opt) => {
                    const isPicked = filters.mood === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() =>
                          setFilterVal("mood", isPicked ? "" : opt.v)
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "language" && (
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isPicked = filters.language === opt.v;
                    return (
                      <button
                        key={opt.v || "any"}
                        type="button"
                        onClick={() =>
                          setFilterVal("language", isPicked ? "" : opt.v)
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "year" && (
                <div className="flex flex-wrap gap-1.5">
                  {YEAR_OPTIONS.map((yr) => {
                    const strVal = String(yr);
                    const isPicked = String(filters.year) === strVal;
                    return (
                      <button
                        key={strVal || "any"}
                        type="button"
                        onClick={() =>
                          setFilterVal("year", isPicked ? "" : strVal)
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {yr || "Any"}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "minRating" && (
                <div className="flex flex-wrap gap-1.5">
                  {RATING_OPTIONS.map((opt) => {
                    const isPicked = String(filters.minRating) === String(opt.v);
                    return (
                      <button
                        key={String(opt.v) || "any"}
                        type="button"
                        onClick={() =>
                          setFilterVal(
                            "minRating",
                            isPicked ? "" : Number(opt.v)
                          )
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "length" && (
                <div className="flex flex-wrap gap-1.5">
                  {RUNTIME_OPTIONS.map((opt) => {
                    const isPicked = filters.length === opt.v;
                    return (
                      <button
                        key={opt.v || "any"}
                        type="button"
                        onClick={() =>
                          setFilterVal("length", isPicked ? "" : opt.v)
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                          isPicked
                            ? "border-[#00D878]/50 bg-[#00D878]/15 text-[#00D878]"
                            : "border-[#1E1F2A] bg-[#181820]/60 text-[#9496A1] hover:text-[#F3F4F6]"
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bottom Confirmation Button */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 h-9 rounded-xl bg-[#00D878] text-black text-sm font-semibold hover:bg-[#00B855] transition"
            >
              {activeCount > 0 ? "Show results" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
