"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Film,
  Bookmark,
  CheckCircle2,
  Eye,
  Clock,
  TrendingUp,
  Upload,
  ArrowRight,
} from "lucide-react";
import { formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie, TimelineActivity, Collection } from "@/types";

// Exactly 3 allowed Movie Journey Event Types
export type JourneyEventType = "watched" | "added" | "viewed";

interface TimelineEvent {
  id: string;
  type: JourneyEventType;
  title: string;
  tmdb_id?: number;
  poster_path?: string;
  release_date?: string;
  occurred_at: string;
  movie?: Movie;
}

interface TimelineSectionProps {
  movies: Movie[];
  activities: TimelineActivity[];
  collections?: Collection[];
  onOpenDetail: (movie: Movie) => void;
  onNavigateToImport: () => void;
}

// 3 Movie Journey Event Configurations
const JOURNEY_CONFIG: Record<
  JourneyEventType,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badgeStyle: string;
    dotStyle: string;
  }
> = {
  watched: {
    label: "Marked as Watched",
    description: "Completed screening logged in personal vault",
    icon: CheckCircle2,
    color: "text-[#00D664]",
    badgeStyle: "bg-[#00D664]/10 text-[#00D664] border border-[#00D664]/30",
    dotStyle: "bg-[#00D664] ring-[#00D664]/30 shadow-[0_0_10px_#00D664]",
  },
  added: {
    label: "Added to Watchlist",
    description: "Saved to personal queue for future screening",
    icon: Bookmark,
    color: "text-indigo-400",
    badgeStyle: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30",
    dotStyle: "bg-indigo-400 ring-indigo-400/30 shadow-[0_0_10px_rgba(129,140,248,0.5)]",
  },
  viewed: {
    label: "Movie Opened",
    description: "Explored movie details, synopsis & credits",
    icon: Eye,
    color: "text-cyan-400",
    badgeStyle: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
    dotStyle: "bg-cyan-400 ring-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.5)]",
  },
};

/**
 * Format day-by-day headings: "Today", "Yesterday", or "24 October 2026"
 */
function formatTimelineDayHeading(dateKey: string): string {
  if (!dateKey || dateKey === "unknown") return "Earlier Timeline";

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  if (dateKey === todayStr) return "Today";
  if (dateKey === yesterdayStr) return "Yesterday";

  const parts = dateKey.split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }

  return dateKey;
}

/**
 * Format time of event (e.g. "10:45 AM") if timestamp is not a midnight/fallback date
 */
function formatEventTime(isoString: string): string | null {
  if (!isoString) return null;
  if (isoString.endsWith("T12:00:00Z") || isoString.endsWith("T00:00:00Z")) {
    return null; // Date-only import, omit artificial time
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

export function TimelineSection({
  movies,
  activities,
  onOpenDetail,
  onNavigateToImport,
}: TimelineSectionProps) {
  const [filterType, setFilterType] = React.useState<string>("all");
  const [selectedYear, setSelectedYear] = React.useState<string>("all");

  const movieMap = React.useMemo(() => {
    const map = new Map<number, Movie>();
    movies.forEach((m) => {
      const key = m.tmdb_id || m.id;
      if (key) map.set(key, m);
    });
    return map;
  }, [movies]);

  // Consolidate ONLY the 3 movie journey events using real timestamps
  const consolidatedEvents = React.useMemo(() => {
    const events: TimelineEvent[] = [];
    const seen = new Set<string>();

    // 1. Explicit activities from library store (ONLY "watched", "added", "viewed")
    activities.forEach((act) => {
      if (act.type !== "watched" && act.type !== "added" && act.type !== "viewed") {
        return; // Exclude favorited, rated, reviewed, collections, imports
      }

      const movieId = act.tmdb_id;
      const matched = movieId ? movieMap.get(movieId) : undefined;
      const dateKey = act.occurred_at ? act.occurred_at.split("T")[0] : "";
      const dedupKey = `${act.type}-${movieId || act.title}-${dateKey}`;

      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        events.push({
          id: act.id,
          type: act.type,
          title: act.title,
          tmdb_id: movieId,
          poster_path: act.poster_path || matched?.poster_path,
          release_date: matched?.release_date,
          occurred_at: act.occurred_at,
          movie: matched || (movieId ? { id: movieId, tmdb_id: movieId, title: act.title, poster_path: act.poster_path } : undefined),
        });
      }
    });

    // 2. Movie Vault records (Preserve original stored dates for saved and watched films)
    movies.forEach((m) => {
      const mId = m.tmdb_id || m.id;
      if (!mId) return;

      // Watched Journey Events
      if (m.status === "watched" && m.watched_date) {
        const dateKey = m.watched_date;
        const dedupKey = `watched-${mId}-${dateKey}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          events.push({
            id: `vault-watched-${mId}-${dateKey}`,
            type: "watched",
            title: m.title,
            tmdb_id: mId,
            poster_path: m.poster_path,
            release_date: m.release_date,
            occurred_at: m.watched_at || `${dateKey}T12:00:00Z`,
            movie: m,
          });
        }
      }

      // Added to Watchlist Journey Events (Original created date)
      if (m.created_date) {
        const dateKey = m.created_date.split("T")[0];
        const dedupKey = `added-${mId}-${dateKey}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          events.push({
            id: `vault-added-${mId}-${dateKey}`,
            type: "added",
            title: m.title,
            tmdb_id: mId,
            poster_path: m.poster_path,
            release_date: m.release_date,
            occurred_at: m.created_date,
            movie: m,
          });
        }
      }
    });

    // 3. Chronological Sort: strictly newest first with original timestamps
    events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    return events;
  }, [activities, movies, movieMap]);

  // Extract valid years for selector
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    consolidatedEvents.forEach((ev) => {
      const y = ev.occurred_at.slice(0, 4);
      if (y && !isNaN(Number(y)) && y.length === 4) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [consolidatedEvents]);

  // Apply filters (Event Type & Year)
  const filteredEvents = React.useMemo(() => {
    return consolidatedEvents.filter((ev) => {
      if (filterType !== "all" && ev.type !== filterType) return false;
      if (selectedYear !== "all" && !ev.occurred_at.startsWith(selectedYear)) return false;
      return true;
    });
  }, [consolidatedEvents, filterType, selectedYear]);

  // Group by Day (Day-by-Day format)
  const groupedByDate = React.useMemo(() => {
    const groups: { dateKey: string; dateHeading: string; events: TimelineEvent[] }[] = [];
    const map = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((ev) => {
      const dateKey = ev.occurred_at ? ev.occurred_at.split("T")[0] : "unknown";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
        groups.push({
          dateKey,
          dateHeading: formatTimelineDayHeading(dateKey),
          events: map.get(dateKey)!,
        });
      }
      map.get(dateKey)!.push(ev);
    });

    return groups;
  }, [filteredEvents]);

  // Journey Statistics
  const journeyStats = React.useMemo(() => {
    const totalScreenings = movies.filter((m) => m.status === "watched").length;
    const totalMinutes = movies
      .filter((m) => m.status === "watched")
      .reduce((acc, m) => acc + (m.runtime || 115), 0);
    const watchlistQueue = movies.filter((m) => m.status === "want").length;

    return {
      screenings: totalScreenings,
      hours: Math.round(totalMinutes / 60),
      watchlistQueue,
      activeDays: groupedByDate.length,
    };
  }, [movies, groupedByDate]);

  return (
    <div className="space-y-6">
      {/* 4-Card Personal Cinema Journey Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1]">
              Screenings Logged
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D664]" />
          </div>
          <p className="text-xl sm:text-2xl font-heading font-black text-white">
            {journeyStats.screenings}
          </p>
          <p className="text-[10px] text-[#9496A1]">completed screenings</p>
        </div>

        <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1]">
              Watch Time Screened
            </span>
            <Clock className="w-3.5 h-3.5 text-[#00D664]" />
          </div>
          <p className="text-xl sm:text-2xl font-heading font-black text-white">
            {journeyStats.hours}h
          </p>
          <p className="text-[10px] text-[#9496A1]">total runtime in vault</p>
        </div>

        <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1]">
              Queue in Watchlist
            </span>
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-heading font-black text-white">
            {journeyStats.watchlistQueue}
          </p>
          <p className="text-[10px] text-[#9496A1]">awaiting discovery</p>
        </div>

        <div className="p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9496A1]">
              Journey Days
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl sm:text-2xl font-heading font-black text-white">
            {journeyStats.activeDays}
          </p>
          <p className="text-[10px] text-[#9496A1]">days on cinema chronicle</p>
        </div>
      </div>

      {/* Filter Toolbar: Exactly 3 Journey Events */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Journey Events" },
            { id: "watched", label: "Marked as Watched", icon: CheckCircle2 },
            { id: "added", label: "Added to Watchlist", icon: Bookmark },
            { id: "viewed", label: "Movie Opened", icon: Eye },
          ].map((tab) => {
            const isCur = filterType === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isCur
                    ? "bg-[#00D664] text-black font-bold shadow-md shadow-[#00D664]/20"
                    : "text-[#9496A1] hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {TabIcon && <TabIcon className="w-3 h-3" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Year Selector */}
        {availableYears.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#9496A1]">
            <Calendar className="w-3.5 h-3.5 text-[#00D664]" />
            <span>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-[#141520] border border-[#1E1F2A] text-xs text-white focus:outline-none focus:border-[#00D664] cursor-pointer"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline Stream: Day-by-Day Journey Spine */}
      {groupedByDate.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-[#1E1F2A] bg-[#101118]/40 p-8 space-y-4">
          <span className="w-16 h-16 rounded-3xl bg-[#00D664]/10 border border-[#00D664]/30 grid place-items-center text-[#00D664] mx-auto shadow-xl">
            <Film className="w-8 h-8" />
          </span>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading text-lg font-bold text-white">
              {filterType !== "all" || selectedYear !== "all"
                ? "No matching cinema journey events"
                : "Your Personal Cinema Journey is Empty"}
            </h3>
            <p className="text-xs text-[#9496A1] leading-relaxed">
              {filterType !== "all" || selectedYear !== "all"
                ? "Try adjusting your journey filters or selected year."
                : "Save films to your watchlist, log completed screenings, or open movie details to build your day-by-day cinema chronicle."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToImport}
              className="px-5 py-2 rounded-full bg-[#00D664] text-black font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#00B855] transition shadow-xl shadow-[#00D664]/25"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Import Letterboxd History</span>
            </button>
            <Link
              href="/discover"
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs inline-flex items-center gap-2 transition"
            >
              <Film className="w-4 h-4" />
              <span>Browse Discover</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8">
          {/* Continuous Vertical Timeline Track */}
          <div className="absolute left-2.5 sm:left-3 top-3 bottom-3 w-px bg-gradient-to-b from-[#00D664]/50 via-[#1E1F2A] to-transparent" />

          <div className="space-y-8">
            {groupedByDate.map((group) => (
              <div key={group.dateKey} className="space-y-3.5">
                {/* Day-by-Day Heading ("Today", "Yesterday", or "24 October 2026") */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D664]" />
                  <h3 className="text-xs sm:text-sm font-heading font-black tracking-wider uppercase text-white font-mono">
                    {group.dateHeading}
                  </h3>
                  <span className="text-[10px] text-[#9496A1] font-mono">
                    ({group.events.length} {group.events.length === 1 ? "event" : "events"})
                  </span>
                </div>

                {/* Day's Movie Journey Entries */}
                <div className="space-y-3">
                  {group.events.map((event) => {
                    const cfg = JOURNEY_CONFIG[event.type] || JOURNEY_CONFIG.added;
                    const Icon = cfg.icon;
                    const posterUrl = getTmdbImageUrl(event.poster_path, "w342");
                    const timeLabel = formatEventTime(event.occurred_at);
                    const releaseYear = formatYear(event.release_date || event.movie?.release_date);
                    const movieTarget = event.movie || ({ id: event.tmdb_id, tmdb_id: event.tmdb_id, title: event.title, poster_path: event.poster_path } as Movie);
                    const handleOpenThisMovie = () => {
                      if (movieTarget.tmdb_id || movieTarget.id) {
                        onOpenDetail(movieTarget);
                      }
                    };

                    return (
                      <div
                        key={event.id}
                        className="relative flex items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-2xl border border-[#1E1F2A] bg-[#101118]/85 backdrop-blur-md hover:border-[#00D664]/40 hover:bg-[#12131F] transition-all shadow-md group"
                      >
                        {/* Dot on the spine */}
                        <span
                          className={`absolute -left-[20px] sm:-left-[26px] w-2.5 h-2.5 rounded-full ring-4 ring-[#0A0B0F] ${cfg.dotStyle}`}
                        />

                        {/* Prominent Movie Poster: Main Visual Element */}
                        <div
                          className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-[#181922] shrink-0 border border-white/10 group-hover:scale-[1.03] group-hover:shadow-lg transition-transform cursor-pointer shadow-md select-none"
                          onClick={handleOpenThisMovie}
                          title={`View details for ${event.title}`}
                        >
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={event.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center bg-[#151622] text-[#9496A1] p-2 text-center">
                              <Film className="w-6 h-6 mb-1 text-white/20" />
                              <span className="text-[9px] line-clamp-2">{event.title}</span>
                            </div>
                          )}
                        </div>

                        {/* Movie & Journey Event Information */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          {/* Event Badge & Time */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.badgeStyle}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{cfg.label}</span>
                            </span>

                            {timeLabel && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#9496A1] font-mono">
                                <Clock className="w-3 h-3 text-[#9496A1]" />
                                <span>{timeLabel}</span>
                              </span>
                            )}
                          </div>

                          {/* Movie Title & Release Year */}
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h4
                              className="font-heading text-base sm:text-lg font-bold text-white group-hover:text-[#00D664] transition cursor-pointer"
                              onClick={handleOpenThisMovie}
                            >
                              {event.title}
                            </h4>
                            {releaseYear && (
                              <span className="text-xs text-[#9496A1] font-mono">
                                ({releaseYear})
                              </span>
                            )}
                          </div>

                          {/* Journey Event Description */}
                          <p className="text-xs text-[#9496A1] leading-relaxed line-clamp-1">
                            {cfg.description}
                          </p>

                          {/* Interactive Detail Link */}
                          {(movieTarget.tmdb_id || movieTarget.id) && (
                            <button
                              type="button"
                              onClick={handleOpenThisMovie}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00D664] hover:text-[#00B855] hover:underline pt-0.5"
                            >
                              <span>View Movie Details</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
