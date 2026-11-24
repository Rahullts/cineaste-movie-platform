"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { Movie } from "@/types";

interface RemindersRailProps {
  items: Movie[];
}

/**
 * Reconstructed 1:1 replica of Cineaste Reminders Rail (Abe)
 */
export function RemindersRail({ items }: RemindersRailProps) {
  if (!items || items.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
      {items.map((movie) => {
        const remindDate = movie.remind_on ? new Date(movie.remind_on) : null;
        const isOverdue = remindDate ? remindDate < now : false;
        const relativeStr = remindDate ? formatRelativeDate(remindDate) : "";
        const formattedDate = remindDate ? formatDate(remindDate) : "";

        const posterUrl = movie.poster_path
          ? movie.poster_path.startsWith("http")
            ? movie.poster_path
            : `/api/image?path=${encodeURIComponent(movie.poster_path)}&w=500`
          : null;

        return (
          <Link
            key={movie.id || movie.tmdb_id}
            href={`/movie/${movie.tmdb_id}`}
            className="group w-28 sm:w-32 shrink-0"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#101118] ring-1 ring-border/50 group-hover:ring-primary/40 transition-all">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  width={128}
                  height={192}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-[#181820] flex items-center justify-center p-2 text-center">
                  <span className="text-[11px] text-[#9496A1] line-clamp-2">
                    {movie.title}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm font-medium truncate mt-2 group-hover:text-primary transition-colors text-foreground">
              {movie.title}
            </p>

            <div className="flex items-center gap-1 mt-1 text-xs">
              <Bell
                className={`w-3 h-3 ${
                  isOverdue ? "text-[#E53935]" : "text-primary"
                }`}
              />
              <span
                className={
                  isOverdue
                    ? "text-[#E53935] font-medium"
                    : "text-muted-foreground"
                }
              >
                {isOverdue ? "Overdue · " : ""}
                {relativeStr}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
          </Link>
        );
      })}
    </div>
  );
}
