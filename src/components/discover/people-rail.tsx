"use client";

import * as React from "react";
import Image from "next/image";

export interface PersonItem {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
}

interface PeopleRailProps {
  people?: PersonItem[];
  loading?: boolean;
}

/**
 * Reconstructed 1:1 replica of Cineaste Trending People Rail (Jbe)
 */
export function PeopleRail({ people = [], loading = false }: PeopleRailProps) {
  if (!loading && people.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-[#F3F4F6]">
          People to watch
        </h2>
        <p className="text-xs text-[#9496A1] mt-0.5">
          Actors and directors trending right now
        </p>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="shrink-0 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-[#181820] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-1">
          {people.map((person) => {
            const profileUrl = person.profile_path
              ? person.profile_path.startsWith("http")
                ? person.profile_path
                : `/api/image?path=${encodeURIComponent(person.profile_path)}&w=h632`
              : null;

            return (
              <div
                key={person.id}
                className="shrink-0 flex flex-col items-center gap-2 w-[100px] sm:w-[120px] group cursor-pointer"
              >
                <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full overflow-hidden bg-[#181820] ring-1 ring-[#1E1F2A] group-hover:ring-[#00D878]/40 transition-all">
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      alt={person.name}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[#9496A1] text-2xl font-heading">
                      {person.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                <div className="text-center w-full px-1">
                  <p className="text-xs font-medium truncate leading-tight text-[#F3F4F6] group-hover:text-[#00D878] transition-colors">
                    {person.name}
                  </p>
                  {person.known_for_department && (
                    <p className="text-[10px] text-[#9496A1] mt-0.5 truncate">
                      {person.known_for_department}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
