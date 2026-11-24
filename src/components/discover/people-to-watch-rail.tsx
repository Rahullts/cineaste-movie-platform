"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, User, Users, ArrowRight } from "lucide-react";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { PersonItem } from "./people-rail";

interface PeopleToWatchRailProps {
  people: PersonItem[];
  loading?: boolean;
}

/**
 * Cineaste People to Watch Editorial Rail
 * Prominent portrait photography showcase for trending actors and directors.
 * Clean, restrained, and displayed strictly once.
 */
export function PeopleToWatchRail({
  people = [],
  loading = false,
}: PeopleToWatchRailProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * scrollRef.current.clientWidth * 0.75,
        behavior: "smooth",
      });
    }
  };

  if (!loading && people.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-[#00D878] grid place-items-center text-black shadow-sm shrink-0">
            <Users className="w-3.5 h-3.5 text-black" />
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#F3F4F6]">
            People to Watch
          </h2>
        </div>

        <button
          type="button"
          onClick={() => handleScroll(1)}
          className="text-xs font-semibold text-[#00D878] hover:underline inline-flex items-center gap-1 transition"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="shrink-0 w-[120px] sm:w-[140px] aspect-square rounded-2xl bg-[#101118] border border-[#1E1F2A] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative group/rail">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            className="hidden md:grid absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition duration-200 shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Rail Items Track */}
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
          >
            {people.map((person) => {
              const profileUrl = getTmdbImageUrl(person.profile_path, "w185");

              return (
                <div
                  key={person.id}
                  className="w-[120px] sm:w-[140px] shrink-0 group/person flex flex-col items-center text-center cursor-pointer"
                >
                  {/* Portrait Card */}
                  <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-2xl overflow-hidden bg-[#101118] border border-[#1E1F2A] transition-all duration-300 group-hover/person:border-[#00D878]/50 group-hover/person:shadow-xl group-hover/person:shadow-black/60">
                    {profileUrl ? (
                      <Image
                        src={profileUrl}
                        alt={person.name}
                        width={140}
                        height={140}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/person:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#181820] text-[#9496A1]">
                        <User className="w-8 h-8 opacity-40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/person:opacity-100 transition-opacity" />
                  </div>

                  {/* Name & Profession */}
                  <div className="mt-2.5 w-full px-1">
                    <h3 className="text-sm font-semibold truncate leading-tight text-[#F3F4F6] group-hover/person:text-[#00D878] transition-colors">
                      {person.name}
                    </h3>
                    {person.known_for_department && (
                      <p className="text-xs text-[#9496A1] mt-0.5 truncate">
                        {person.known_for_department}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => handleScroll(1)}
            className="hidden md:grid absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 place-items-center rounded-full bg-[#0A0B0F]/90 backdrop-blur border border-[#1E1F2A] opacity-0 group-hover/rail:opacity-100 transition duration-200 shadow-xl hover:scale-105 text-[#F3F4F6] hover:border-[#00D878]/50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
