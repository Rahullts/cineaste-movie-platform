"use client";

import * as React from "react";
import type { Movie } from "@/types";
import {
  VaultMark,
  OrbitMark,
  CompletionFrameMark,
  CuratedStar,
  ArchiveStack,
} from "./watchlist-icons";

export type StatusTabKey = "want" | "watching" | "watched" | "favorites" | "all";

export interface StatusTabConfig {
  key: StatusTabKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const STATUS_TABS: StatusTabConfig[] = [
  { key: "want", label: "Watchlist", shortLabel: "Watchlist", icon: VaultMark },
  { key: "watching", label: "Currently Watching", shortLabel: "Watching", icon: OrbitMark },
  { key: "watched", label: "Watched", shortLabel: "Watched", icon: CompletionFrameMark },
  { key: "favorites", label: "Favorites", shortLabel: "Favorites", icon: CuratedStar },
  { key: "all", label: "All Films", shortLabel: "All", icon: ArchiveStack },
];

interface WatchlistStatusTabsProps {
  activeTab: StatusTabKey;
  onTabChange: (tab: StatusTabKey) => void;
  movies: Movie[];
}

/**
 * Cineaste Personal Film Archive — Distinctive Library Navigation
 * 5-tab responsive navigation with custom Cineaste iconography and live count badges.
 */
export function WatchlistStatusTabs({
  activeTab,
  onTabChange,
  movies = [],
}: WatchlistStatusTabsProps) {
  // Compute counts for all 5 tabs accurately from real library store
  const getTabCount = (tabKey: StatusTabKey): number => {
    switch (tabKey) {
      case "all":
        return movies.length;
      case "favorites":
        return movies.filter((m) => Boolean(m.is_favorite)).length;
      case "watching":
        return movies.filter((m) => m.status === "watching").length;
      case "watched":
        return movies.filter((m) => m.status === "watched").length;
      case "want":
      default:
        return movies.filter((m) => (m.status || "want") === "want").length;
    }
  };

  return (
    <nav
      aria-label="Archive View Category"
      className="inline-flex p-1 rounded-2xl bg-[#101118]/90 border border-[#1E1F2A] backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full shadow-sm"
    >
      <div className="flex items-center gap-1 min-w-full sm:min-w-0">
        {STATUS_TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`group relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap select-none ${
                isActive
                  ? "bg-[#00D878] text-black font-semibold shadow-md shadow-[#00D878]/20"
                  : "text-[#9496A1] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                size={16}
                className={`transition-transform duration-200 ${
                  isActive ? "text-black" : "text-[#9496A1] group-hover:text-white"
                }`}
              />

              {/* Full label on sm+, short label on mobile */}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.shortLabel}</span>

              {/* Live Count Pill */}
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-black/20 text-black font-bold"
                    : "bg-[#181820] text-[#9496A1] group-hover:text-white border border-[#1E1F2A]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
