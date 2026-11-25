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
 * Cineaste Distinctive Brandmark
 * 
 * Concept:
 * An iconic geometric monogram merging a cinematic camera aperture iris
 * with an anamorphic film frame and the letter 'C'.
 * 
 * Features:
 * - Geometric interlocking shutter blades forming a bold 'C'.
 * - Vibrant Cineaste Green (#00D664) focal core.
 * - Precision film corner notches.
 * - Perfectly legible from 16px to 256px.
 * - High-contrast rendering in both dark and light themes.
 */
export function CineasteLogo({
  size = 32,
  className,
  showWordmark = false,
  forceLightWordmark = false,
  ...props
}: CineasteLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-label="Cineaste Brandmark"
        {...props}
      >
        <defs>
          {/* Signature Cineaste Green Gradient */}
          <linearGradient id="c-green-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF77" />
            <stop offset="100%" stopColor="#00B855" />
          </linearGradient>

          {/* Deep Titanium Body Gradient */}
          <linearGradient id="c-frame-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E202B" />
            <stop offset="100%" stopColor="#0C0D12" />
          </linearGradient>

          {/* Blade Shadow Filter */}
          <filter id="c-blade-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. Precision Squircle Frame (Film Cell Aspect) */}
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="8"
          fill="url(#c-frame-bg)"
          stroke="#00D664"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />

        {/* 2. Film Perforation / Corner Registration Dots */}
        <circle cx="5" cy="5" r="1" fill="#00D664" fillOpacity="0.5" />
        <circle cx="27" cy="5" r="1" fill="#00D664" fillOpacity="0.5" />
        <circle cx="5" cy="27" r="1" fill="#00D664" fillOpacity="0.5" />
        <circle cx="27" cy="27" r="1" fill="#00D664" fillOpacity="0.5" />

        {/* 3. The Aperture Monogram 'C' (Continuous Cinematic Blade Arc) */}
        <path
          d="M22.5 10.8C20.9 8.5 18.2 7 15.2 7C10.2 7 6.2 11 6.2 16C6.2 21 10.2 25 15.2 25C18.2 25 20.9 23.5 22.5 21.2L18.8 19C17.9 20.3 16.5 21.2 14.8 21.2C12 21.2 9.8 18.9 9.8 16C9.8 13.1 12 10.8 14.8 10.8C16.5 10.8 17.9 11.7 18.8 13L22.5 10.8Z"
          fill="url(#c-green-glow)"
          filter="url(#c-blade-shadow)"
        />

        {/* 4. Secondary Iris Aperture Blade (Top Right Shutter) */}
        <path
          d="M20 7.8L15 15.8L17.5 15.8L23 9Z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />

        {/* 5. Central Anamorphic Focal Point */}
        <circle cx="15.2" cy="16" r="2.2" fill="#0C0D12" stroke="#00D664" strokeWidth="1.2" />
        <circle cx="15.2" cy="16" r="0.8" fill="#00D664" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-heading text-sm font-black tracking-widest truncate leading-none",
              forceLightWordmark ? "text-white" : "text-foreground"
            )}
          >
            CINEASTE
          </span>
          <span
            className={cn(
              "text-[8px] uppercase tracking-wider font-semibold mt-0.5 truncate hidden sm:block",
              forceLightWordmark ? "text-white/75" : "text-muted-foreground"
            )}
          >
            CINEMA, CURATED.
          </span>
        </div>
      )}
    </div>
  );
}