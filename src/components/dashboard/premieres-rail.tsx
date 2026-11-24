"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarClock } from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { Movie } from "@/types";

interface PremieresRailProps {
  items: Movie[];
}

/**
 * Reconstructed 1:1 replica of Cineaste Upcoming Premieres Rail (Ebe)
 */
export function PremieresRail({ items }: PremieresRailProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
      {items.map((movie) => {
        const releaseDate = movie.release_date
          ? new Date(movie.release_date)
          : null;
        const formattedDate = releaseDate ? formatDate(releaseDate) : "";
        const relativeDate = releaseDate ? formatRelativeDate(releaseDate) : "";

        const posterUrl = movie.poster_path
          ? movie.poster_path.startsWith("http")
            ? movie.poster_path
            : `/api/image?path=${encodeURIComponent(movie.poster_path)}&w=780`
          : null;

        return (
          <Link
            key={movie.id || movie.tmdb_id}
            href={`/movie/${movie.tmdb_id}`}
            className="group shrink-0 w-40 sm:w-44 rounded-2xl border border-border/50 bg-[#101118] overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="aspect-[2/3] bg-muted relative overflow-hidden">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  width={176}
                  height={264}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-[#181820] flex items-center justify-center p-3 text-center">
                  <span className="text-xs text-[#9496A1] font-medium line-clamp-2">
                    {movie.title}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <CalendarClock className="w-3.5 h-3.5 text-primary" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="p-3">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors text-foreground">
                {movie.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {relativeDate}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
