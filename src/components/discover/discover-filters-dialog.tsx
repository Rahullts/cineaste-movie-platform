"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
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
 * Multi-criteria Filter Popover with buffered draft state:
 * - Solid opaque surface so underlying cards/text never bleed through
 * - Stays open across multiple selections (including Mood) until Done or Cancel
 * - Explicit Done (applies changes) and Cancel (discards draft edits)
 */
export function DiscoverFiltersDialog({
  filters,
  onChange,
  onClear,
  compact = false,
}: DiscoverFiltersDialogProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] =
    React.useState<keyof DiscoverFilterState>("genre");
  const [draftFilters, setDraftFilters] =
    React.useState<DiscoverFilterState>(filters);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Sync draft state whenever menu opens or external filters clear
  React.useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
    }
  }, [isOpen, filters]);

  // Count applied vs draft active filters
  const appliedCount = Object.keys(INITIAL_FILTER_STATE).filter(
    (key) => !!filters[key as keyof DiscoverFilterState]
  ).length;
  const draftCount = Object.keys(INITIAL_FILTER_STATE).filter(
    (key) => !!draftFilters[key as keyof DiscoverFilterState]
  ).length;

  const handleCancel = React.useCallback(() => {
    setDraftFilters(filters);
    setIsOpen(false);
  }, [filters]);

  const handleApplyDone = React.useCallback(() => {
    onChange(draftFilters);
    setIsOpen(false);
  }, [draftFilters, onChange]);

  const handleClearDraft = () => {
    setDraftFilters(INITIAL_FILTER_STATE);
  };

  // Close on outside click or Escape (cancels unapplied draft)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCancel();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, handleCancel]);

  const setDraftVal = (
    key: keyof DiscoverFilterState,
    val: string | number
  ) => {
    setDraftFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="relative shrink-0" ref={dialogRef}>
      {/* Circular Filter Trigger */}
      <button
        type="button"
        data-testid="discover-filter-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "relative grid place-items-center transition-all cursor-pointer",
          compact
            ? "w-8 h-8 rounded-full text-xs"
            : "w-12 h-12 sm:h-14 sm:w-14 rounded-full shadow-lg",
          isOpen || appliedCount > 0
            ? "bg-[#00D878] text-black shadow-[#00D878]/30"
            : compact
              ? isLight
                ? "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-black/5"
                : "bg-transparent text-[#9496A1] hover:text-white hover:bg-white/10"
              : "bg-card border border-border text-foreground hover:border-[#00D878]/40"
        )}
        aria-label="Filters"
        aria-expanded={isOpen}
        title={appliedCount > 0 ? `${appliedCount} filters active` : "Open filters"}
      >
        <Filter className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
        {appliedCount > 0 && (
          <span
            className={cn(
              "absolute rounded-full bg-[#00D878] text-black font-bold grid place-items-center ring-2 ring-background",
              compact
                ? "-top-1 -right-1 w-4 h-4 text-[9px]"
                : "-top-1 -right-1 min-w-[20px] h-5 px-1 text-[11px]"
            )}
          >
            {appliedCount}
          </span>
        )}
      </button>

      {/* Solid Opaque Flyout Menu — zero underlying content bleed-through */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Discover Filters"
          data-testid="discover-filters-popover"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-full mt-3 right-0 w-[336px] max-w-[calc(100vw-1.5rem)] max-h-[75vh] overflow-y-auto no-scrollbar rounded-2xl border p-4 z-[80] origin-top-right shadow-[0_24px_64px_rgba(0,0,0,0.85)]",
            isLight
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-[#11121B] border-[#262838] text-[#F3F4F6]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-semibold">Filters</span>
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-xs text-muted-foreground hover:text-[#00D878] inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset selections</span>
              </button>
            )}
          </div>

          {/* 6 Category Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            {FILTER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.key;
              const hasActiveValue = !!draftFilters[cat.key];

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2.5 rounded-xl border transition cursor-pointer",
                    isSelected
                      ? "border-[#00D878]/60 bg-[#00D878]/12 text-[#00D878]"
                      : isLight
                        ? "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-950"
                        : "border-[#232534] bg-[#181A27] text-[#9496A1] hover:text-[#F3F4F6]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{cat.label}</span>
                  {hasActiveValue && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#00D878]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-options for selected category */}
          <div
            className={cn(
              "mt-3 pt-3 border-t max-h-52 overflow-y-auto no-scrollbar",
              isLight ? "border-slate-200" : "border-[#232534]"
            )}
          >
            {activeTab === "genre" && (
              <div className="flex flex-wrap gap-1.5">
                {TMDB_GENRES.map((g) => {
                  const isPicked = String(draftFilters.genre) === String(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        setDraftVal("genre", isPicked ? "" : String(g.id))
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
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
                  const isPicked = draftFilters.mood === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() =>
                        setDraftVal("mood", isPicked ? "" : opt.v)
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
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
                  const isPicked = draftFilters.language === opt.v;
                  return (
                    <button
                      key={opt.v || "any"}
                      type="button"
                      onClick={() =>
                        setDraftVal("language", isPicked ? "" : opt.v)
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
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
                  const isPicked = String(draftFilters.year) === strVal;
                  return (
                    <button
                      key={strVal || "any"}
                      type="button"
                      onClick={() =>
                        setDraftVal("year", isPicked ? "" : strVal)
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
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
                  const isPicked =
                    String(draftFilters.minRating) === String(opt.v);
                  return (
                    <button
                      key={String(opt.v) || "any"}
                      type="button"
                      onClick={() =>
                        setDraftVal(
                          "minRating",
                          isPicked ? "" : opt.v === "" ? "" : Number(opt.v)
                        )
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
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
                  const isPicked = draftFilters.length === opt.v;
                  return (
                    <button
                      key={opt.v || "any"}
                      type="button"
                      onClick={() =>
                        setDraftVal("length", isPicked ? "" : opt.v)
                      }
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer",
                        isPicked
                          ? "border-[#00D878] bg-[#00D878]/18 text-[#00D878] font-semibold"
                          : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
                            : "border-[#262838] bg-[#181A27] text-[#A2A5B4] hover:text-white"
                      )}
                    >
                      {opt.l}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Confirmation Actions: Cancel & Done */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              data-testid="discover-filters-cancel"
              onClick={handleCancel}
              className={cn(
                "h-9 px-4 rounded-xl text-xs font-semibold transition cursor-pointer",
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-[#1C1E2C] hover:bg-[#26293B] text-white/80 hover:text-white"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="discover-filters-done"
              onClick={handleApplyDone}
              className="flex-1 h-9 rounded-xl bg-[#00D878] text-black text-xs sm:text-sm font-bold hover:bg-[#00B855] transition cursor-pointer"
            >
              {draftCount > 0 ? `Done (${draftCount})` : "Done"}
            </button>
          </div>
          {appliedCount > 0 && draftCount === 0 && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="mt-2 w-full h-8 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              Clear applied filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
