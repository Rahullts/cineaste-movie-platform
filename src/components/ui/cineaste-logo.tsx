"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CineasteLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showWordmark?: boolean;
  forceLightWordmark?: boolean;
}

/**
 * Cineaste Iconic Brandmark
 *
 * Inspired by flagship cinema archives (Letterboxd / MUBI / IMDb):
 * Three kinetic overlapping cinema projector discs — Warm Gold, Luminous
 * Emerald, and Cinema Sky — paired with a bold geometric wordmark.
 */
export function CineasteLogo({
  size = 34,
  className,
  showWordmark = false,
  forceLightWordmark = false,
  ...props
}: CineasteLogoProps) {
  const uid = React.useId().replace(/:/g, "");
  const gradGold = `c-gold-${uid}`;
  const gradEmerald = `c-em-${uid}`;
  const gradSky = `c-sky-${uid}`;
  const clipLeft = `c-clip-l-${uid}`;
  const clipRight = `c-clip-r-${uid}`;

  // Preserve proportional horizontal width for the 3-disc widescreen cinema triad
  const numSize = typeof size === "number" ? size : 34;
  const markWidth = Math.round(numSize * 1.48);
  const markHeight = numSize;

  return (
    <div className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}>
      <svg
        width={markWidth}
        height={markHeight}
        viewBox="0 0 54 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-[1.04]"
        aria-label="Cineaste Cinema Brandmark"
        {...props}
      >
        <defs>
          <linearGradient id={gradGold} x1="4" y1="6" x2="22" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB020" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id={gradEmerald} x1="16" y1="5" x2="38" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F58A" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
          <linearGradient id={gradSky} x1="32" y1="6" x2="50" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <clipPath id={clipLeft}>
            <circle cx="13.5" cy="18" r="10.2" />
          </clipPath>
          <clipPath id={clipRight}>
            <circle cx="40.5" cy="18" r="10.2" />
          </clipPath>
        </defs>

        {/* Left Film Spectrum Disc (Cinema Amber) */}
        <circle cx="13.5" cy="18" r="10.2" fill={`url(#${gradGold})`} />

        {/* Right Film Spectrum Disc (Projector Sapphire) */}
        <circle cx="40.5" cy="18" r="10.2" fill={`url(#${gradSky})`} />

        {/* Center Hero Disc (Cineaste Signature Emerald) */}
        <circle cx="27" cy="18" r="10.6" fill={`url(#${gradEmerald})`} />

        {/* Crisp Luminous Overlapping Lens Intersections */}
        <circle
          cx="27"
          cy="18"
          r="10.6"
          fill="#D9F99D"
          fillOpacity="0.62"
          clipPath={`url(#${clipLeft})`}
        />
        <circle
          cx="27"
          cy="18"
          r="10.6"
          fill="#A5F3FC"
          fillOpacity="0.58"
          clipPath={`url(#${clipRight})`}
        />

        {/* Subtle Central Cinema Aperture Pinpoint */}
        <circle cx="27" cy="18" r="2.1" fill="#05070A" fillOpacity="0.88" />
      </svg>

      {showWordmark && (
        <div className="flex items-baseline gap-1 min-w-0">
          <span
            className={cn(
              "font-brand text-[20px] sm:text-[22px] font-extrabold tracking-[-0.035em] truncate leading-none",
              forceLightWordmark ? "text-white" : "text-foreground"
            )}
          >
            Cineaste
          </span>
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E054] shrink-0 translate-y-[-1px]"
          />
        </div>
      )}
    </div>
  );
}
