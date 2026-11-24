"use client";

import * as React from "react";
import { formatRuntime } from "@/lib/utils";
import {
  VaultMark,
  OrbitMark,
  CompletionFrameMark,
  ChronoDial,
} from "./watchlist-icons";

interface WatchlistStatsBarProps {
  total: number;
  unwatched: number;
  watched: number;
  totalMinutes: number;
  watchedWithRuntimeCount?: number;
}

/**
 * Cineaste Personal Film Archive — Architectural Statistics Strip
 * Compact, cohesive horizontal metric strip with prominent typography,
 * consistent alignment, reduced padding, and custom Cineaste vector marks.
 */
export function WatchlistStatsBar({
  total,
  unwatched,
  watched,
  totalMinutes,
  watchedWithRuntimeCount,
}: WatchlistStatsBarProps) {
  // Determine honest runtime display
  const hasWatched = watched > 0;
  const runtimeKnownCount =
    typeof watchedWithRuntimeCount === "number"
      ? watchedWithRuntimeCount
      : totalMinutes > 0
      ? watched
      : 0;

  let runtimeValue = "0m";
  let runtimeSub = "0 screenings";

  if (hasWatched) {
    if (totalMinutes > 0) {
      runtimeValue = formatRuntime(totalMinutes) || `${totalMinutes}m`;
      runtimeSub =
        runtimeKnownCount < watched
          ? `${runtimeKnownCount} of ${watched} logged`
          : `across ${watched} screenings`;
    } else {
      runtimeValue = "Data pending";
      runtimeSub = `0 of ${watched} runtimes`;
    }
  }

  const metrics = [
    {
      id: "total",
      label: "TOTAL SAVED",
      value: total,
      sub: "in archive",
      icon: VaultMark,
      iconColor: "text-[#00D878]",
      accentBg: "group-hover:bg-[#00D878]/5",
      iconBg: "bg-[#00D878]/10 border-[#00D878]/20",
    },
    {
      id: "unwatched",
      label: "UNWATCHED",
      value: unwatched,
      sub: "awaiting discovery",
      icon: OrbitMark,
      iconColor: "text-[#FBBF24]",
      accentBg: "group-hover:bg-[#FBBF24]/5",
      iconBg: "bg-[#FBBF24]/10 border-[#FBBF24]/20",
    },
    {
      id: "watched",
      label: "WATCHED",
      value: watched,
      sub: "screenings completed",
      icon: CompletionFrameMark,
      iconColor: "text-[#00D878]",
      accentBg: "group-hover:bg-[#00D878]/5",
      iconBg: "bg-[#00D878]/10 border-[#00D878]/20",
    },
    {
      id: "runtime",
      label: "WATCH TIME",
      value: runtimeValue,
      sub: runtimeSub,
      icon: ChronoDial,
      iconColor: "text-[#F59E0B]",
      accentBg: "group-hover:bg-[#F59E0B]/5",
      iconBg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
    },
  ];

  return (
    <section
      aria-label="Archive Statistics Strip"
      className="rounded-2xl border border-[#1E1F2A] bg-[#101118]/90 backdrop-blur-md overflow-hidden shadow-md"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#1E1F2A]">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`group relative px-4 sm:px-5 py-3.5 sm:py-4 transition-all duration-200 ${m.accentBg} flex items-center gap-3.5`}
            >
              {/* Custom Icon in Geometric Housing */}
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.iconBg} ${m.iconColor} group-hover:scale-105 transition-transform duration-200 shadow-sm`}
              >
                <Icon size={20} />
              </div>

              {/* Number and Label Stack */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl sm:text-3xl font-heading font-black tabular-nums tracking-tight text-white leading-none">
                    {m.value}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold text-[#9496A1] group-hover:text-white transition-colors uppercase truncate">
                    {m.label}
                  </span>
                  <span className="text-[10px] text-[#9496A1]/50 hidden sm:inline truncate">
                    • {m.sub}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
