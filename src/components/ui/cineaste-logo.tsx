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
 * Cineaste Cinema Monogram
 *
 * Sculptural 35mm film-reel 'C' arch fused with a precision cinema aperture
 * lens and twin film sprocket perforations — distinctly motion-picture craft.
 */
export function CineasteLogo({
  size = 34,
  className,
  showWordmark = false,
  forceLightWordmark = false,
  ...props
}: CineasteLogoProps) {
  const uid = React.useId().replace(/:/g, "");
  const gradArc = `c-arc-${uid}`;
  const gradLens = `c-lens-${uid}`;
  const gradRim = `c-rim-${uid}`;
  const gradCore = `c-core-${uid}`;

  return (
    <div className={cn("inline-flex items-center gap-3 shrink-0 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-label="Cineaste Cinema Brandmark"
        {...props}
      >
        <defs>
          <linearGradient id={gradRim} x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3A445C" />
            <stop offset="50%" stopColor="#1E2536" />
            <stop offset="100%" stopColor="#0E121B" />
          </linearGradient>
          <radialGradient id={gradLens} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C2333" />
            <stop offset="80%" stopColor="#0B0E15" />
            <stop offset="100%" stopColor="#05070A" />
          </radialGradient>
          <linearGradient id={gradArc} x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F5A0" />
            <stop offset="45%" stopColor="#00D878" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id={gradCore} x1="14" y1="14" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C6F6D5" />
          </linearGradient>
        </defs>

        {/* Outer Precision Cinema Lens Barrel */}
        <circle
          cx="18"
          cy="18"
          r="16.5"
          fill={`url(#${gradLens})`}
          stroke={`url(#${gradRim})`}
          strokeWidth="0.85"
        />

        {/* 12-Segment Cinema Lens Calibration Scale (Subtle luxury detailing) */}
        <g opacity="0.28" stroke="#FFFFFF" strokeWidth="0.75" strokeLinecap="round">
          <line x1="18" y1="2.8" x2="18" y2="4.4" />
          <line x1="18" y1="31.6" x2="18" y2="33.2" />
          <line x1="2.8" y1="18" x2="4.4" y2="18" />
          <line x1="31.6" y1="18" x2="33.2" y2="18" />
          <line x1="7.25" y1="7.25" x2="8.3" y2="8.3" />
          <line x1="27.7" y1="27.7" x2="28.75" y2="28.75" />
          <line x1="7.25" y1="28.75" x2="8.3" y2="27.7" />
          <line x1="27.7" y1="8.3" x2="28.75" y2="7.25" />
        </g>

        {/* Delicate Inner Optical Track */}
        <circle
          cx="18"
          cy="18"
          r="13"
          stroke="#00D878"
          strokeOpacity="0.18"
          strokeWidth="0.75"
          strokeDasharray="1.5 2.5"
        />

        {/* Sculpted Cinema Iris 'C' Arch — Seamless Golden Proportion */}
        <path
          d="M25.2 11.2C23.3 9.2 20.8 8.1 17.8 8.1C12.3 8.1 7.8 12.5 7.8 18C7.8 23.5 12.3 27.9 17.8 27.9C20.8 27.9 23.3 26.8 25.2 24.8C25.6 24.4 25.6 23.7 25.1 23.3L23.4 21.8C23.0 21.4 22.4 21.5 22.0 21.9C20.9 23.1 19.4 23.8 17.8 23.8C14.6 23.8 12.0 21.2 12.0 18C12.0 14.8 14.6 12.2 17.8 12.2C19.4 12.2 20.9 12.9 22.0 14.1C22.4 14.5 23.0 14.6 23.4 14.2L25.1 12.7C25.6 12.3 25.6 11.6 25.2 11.2Z"
          fill={`url(#${gradArc})`}
        />

        {/* Optical Prism Core Focal Point (Subtle 4-Point Star Refraction) */}
        <path
          d="M18 14.8L18.7 17.3L21.2 18L18.7 18.7L18 21.2L17.3 18.7L14.8 18L17.3 17.3L18 14.8Z"
          fill={`url(#${gradCore})`}
          fillOpacity="0.95"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-serif text-[16px] sm:text-[17px] font-medium tracking-[0.22em] truncate leading-none",
              forceLightWordmark ? "text-white" : "text-foreground"
            )}
          >
            CINEASTE
          </span>
          <span
            className={cn(
              "text-[8.5px] uppercase tracking-[0.34em] font-semibold mt-1 truncate hidden sm:block leading-none",
              forceLightWordmark ? "text-white/60" : "text-muted-foreground/90"
            )}
          >
            CURATED CINEMA
          </span>
        </div>
      )}
    </div>
  );
}
