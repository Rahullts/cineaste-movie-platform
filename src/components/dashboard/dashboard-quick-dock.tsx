"use client";

import * as React from "react";
import { Plus, Search, Bookmark, Eye, Film } from "lucide-react";

interface DashboardQuickDockProps {
  watchlistCount: number;
  watchedCount: number;
  onOpenQuickAdd: () => void;
}

export function DashboardQuickDock({
  watchlistCount,
  watchedCount,
  onOpenQuickAdd,
}: DashboardQuickDockProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      aria-label="Central Quick Add and Navigation Bar"
      className="p-3.5 sm:p-4 rounded-3xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-2xl shadow-black/40 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 select-none"
    >
      {/* Left: Vault Snapshot Status */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <span className="w-10 h-10 rounded-2xl bg-[#00D878]/15 border border-[#00D878]/30 grid place-items-center shrink-0 text-[#00D878]">
          <Film className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Your Personal Film Vault</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D878]/10 text-[#00D878] border border-[#00D878]/30 font-mono">
              Live
            </span>
          </p>
          <p className="text-xs text-[#9496A1] truncate">
            <span className="text-white font-medium">{watchlistCount}</span> in watchlist •{" "}
            <span className="text-white font-medium">{watchedCount}</span> watched
          </p>
        </div>
      </div>

      {/* Center: Central Quick Add Action (Prominent, High-Priority Button) */}
      <div className="w-full md:w-auto flex justify-center">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="w-full md:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-[#00D878] text-black font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 shadow-xl shadow-[#00D878]/25 hover:bg-[#00B855] hover:scale-105 active:scale-95 transition select-none"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          <span>Quick Add Movie</span>
          <span className="hidden sm:inline-flex items-center text-[10px] bg-black/20 text-black px-2 py-0.5 rounded-full font-mono ml-1 font-semibold">
            Search TMDB
          </span>
        </button>
      </div>

      {/* Right: Quick Section Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto justify-start md:justify-end text-xs">
        {[
          { id: "section-recently-added", label: "[01] Added" },
          { id: "section-recently-watched", label: "[02] Watched" },
          { id: "section-collections", label: "[03] Shelves" },
          { id: "section-recommendations", label: "[04] For You" },
          { id: "section-explore", label: "[05] Explore" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className="shrink-0 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#9496A1] hover:text-white hover:border-[#00D878]/40 hover:bg-[#00D878]/10 transition font-mono text-[11px] font-semibold"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
