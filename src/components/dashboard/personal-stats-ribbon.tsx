"use client";

import * as React from "react";
import { Clock, Star, Bookmark, CheckCircle2 } from "lucide-react";
import type { Movie } from "@/types";

interface PersonalStatsRibbonProps {
  movies: Movie[];
}

export function PersonalStatsRibbon({ movies }: PersonalStatsRibbonProps) {
  // 1. Watched Movies Collection
  const watchedMovies = React.useMemo(
    () => movies.filter((m) => m.status === "watched"),
    [movies]
  );

  // 2. Total Watch Time (Calculated strictly from watched movies with valid positive runtime)
  const watchTimeStats = React.useMemo(() => {
    const validRuntimeMovies = watchedMovies.filter(
      (m) => typeof m.runtime === "number" && m.runtime > 0
    );
    const totalMinutes = validRuntimeMovies.reduce(
      (acc, m) => acc + (m.runtime || 0),
      0
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let displayString = "0m";
    if (totalMinutes > 0) {
      if (hours > 0 && minutes > 0) {
        displayString = `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        displayString = `${hours}h`;
      } else {
        displayString = `${minutes}m`;
      }
    }

    return {
      display: displayString,
      countWithRuntime: validRuntimeMovies.length,
    };
  }, [watchedMovies]);

  // 3. Average Personal Rating (Using ONLY user's personal ratings, never TMDB vote_average)
  const personalRatingStats = React.useMemo(() => {
    const ratedMovies = movies.filter(
      (m) => typeof m.rating === "number" && m.rating > 0
    );
    if (ratedMovies.length === 0) {
      return {
        display: "—",
        count: 0,
      };
    }
    const sum = ratedMovies.reduce((acc, m) => acc + (m.rating || 0), 0);
    const avg = (sum / ratedMovies.length).toFixed(1);

    return {
      display: `${avg} ★`,
      count: ratedMovies.length,
    };
  }, [movies]);

  // 4. Watchlist Count (Unwatched films currently queued)
  const watchlistCount = React.useMemo(
    () => movies.filter((m) => (m.status || "want") !== "watched").length,
    [movies]
  );

  // 5. Watched Movies Count (Screenings completed)
  const watchedCount = watchedMovies.length;

  return (
    <section
      aria-label="Personal Cinema Statistics"
      className="w-full rounded-2xl bg-[#101118]/85 border border-[#1E1F2A] p-4 sm:p-5 backdrop-blur-md shadow-xl select-none"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-[#1E1F2A]">
        {/* Metric 1: Total Watch Time */}
        <div className="flex items-center gap-3.5 px-2 md:px-5">
          <div className="w-10 h-10 rounded-xl bg-[#00D878]/10 border border-[#00D878]/20 grid place-items-center text-[#00D878] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1] block truncate">
              Total Watch Time
            </span>
            <p className="text-lg sm:text-xl font-heading font-black text-white tabular-nums tracking-tight">
              {watchTimeStats.display}
            </p>
            <p className="text-[10px] text-[#9496A1]/70 truncate">
              {watchTimeStats.countWithRuntime} screened films
            </p>
          </div>
        </div>

        {/* Metric 2: Average Personal Rating */}
        <div className="flex items-center gap-3.5 px-2 md:px-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400 shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1] block truncate">
              Average Personal Rating
            </span>
            <p className="text-lg sm:text-xl font-heading font-black text-white tabular-nums tracking-tight">
              {personalRatingStats.display}
            </p>
            <p className="text-[10px] text-[#9496A1]/70 truncate">
              {personalRatingStats.count > 0
                ? `${personalRatingStats.count} personal rating${personalRatingStats.count === 1 ? "" : "s"}`
                : "No personal ratings yet"}
            </p>
          </div>
        </div>

        {/* Metric 3: Watchlist Count */}
        <div className="flex items-center gap-3.5 px-2 md:px-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-indigo-400 shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1] block truncate">
              Watchlist Count
            </span>
            <p className="text-lg sm:text-xl font-heading font-black text-white tabular-nums tracking-tight">
              {watchlistCount}
            </p>
            <p className="text-[10px] text-[#9496A1]/70 truncate">
              films queued to watch
            </p>
          </div>
        </div>

        {/* Metric 4: Watched Movies Count */}
        <div className="flex items-center gap-3.5 px-2 md:px-5">
          <div className="w-10 h-10 rounded-xl bg-[#00D878]/10 border border-[#00D878]/20 grid place-items-center text-[#00D878] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1] block truncate">
              Watched Movies
            </span>
            <p className="text-lg sm:text-xl font-heading font-black text-white tabular-nums tracking-tight">
              {watchedCount}
            </p>
            <p className="text-[10px] text-[#9496A1]/70 truncate">
              completed screenings
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
