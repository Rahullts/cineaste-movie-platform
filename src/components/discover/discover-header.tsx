"use client";

import * as React from "react";

interface DiscoverHeaderProps {
  searchSlot: React.ReactNode;
  navSlot?: React.ReactNode;
}

/**
 * Cineaste Centered Editorial Discover Header
 * Centered search experience with balanced width and integrated Explore navigation.
 * Compact and free of excess vertical gaps.
 */
export function DiscoverHeader({ searchSlot, navSlot }: DiscoverHeaderProps) {
  return (
    <header className="relative w-full pt-1 sm:pt-2">
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
        {/* Discover Title */}
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#00D878] shadow-sm shadow-[#00D878]/50" />
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F3F4F6]">
            Discover
          </h1>
        </div>

        {/* Centered Search Controls */}
        <div className="w-full">
          {searchSlot}
        </div>

        {/* Integrated Explore Navigation System */}
        {navSlot && (
          <div className="w-full mt-3 sm:mt-3.5">
            {navSlot}
          </div>
        )}
      </div>
    </header>
  );
}
