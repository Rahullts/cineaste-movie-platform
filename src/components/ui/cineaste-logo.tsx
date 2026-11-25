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
          <linearGradient id={gradArc} x1="4" y1="4" x2="31" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#12F084" />
            <stop offset="100%" stopColor="#00B855" />
          </linearGradient>
          <radialGradient id={gradLens} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1B212E" />
            <stop offset="100%" stopColor="#090B10" />
          </radialGradient>
        </defs>

        {/* Outer circular film reel ring (no square microchip borders) */}
        <circle
          cx="18"
          cy="18"
          r="16"
          fill={`url(#${gradLens})`}
        />

        {/* Delicate 35mm cinema track arc */}
        <circle
          cx="18"
          cy="18"
          r="13.5"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Sculpted Film-Arc 'C' Ribbon */}
        <path
          d="M25.6 10.6C23.7 8.4 21 7.2 17.8 7.2C11.8 7.2 7.2 11.9 7.2 18C7.2 24.1 11.8 28.8 17.8 28.8C21 28.8 23.7 27.6 25.6 25.4L22.3 22.3C21.1 23.6 19.6 24.3 17.8 24.3C14.3 24.3 11.7 21.6 11.7 18C11.7 14.4 14.3 11.7 17.8 11.7C19.6 11.7 21.1 12.4 22.3 13.7L25.6 10.6Z"
          fill={`url(#${gradArc})`}
        />

        {/* Precision Film Projector Aperture Frame & Light Beam inside the 'C' */}
        <path
          d="M15.8 15.1C15.8 14.6 16.35 14.3 16.78 14.56L21.9 17.46C22.32 17.7 22.32 18.3 21.9 18.54L16.78 21.44C16.35 21.7 15.8 21.4 15.8 20.9V15.1Z"
          fill="#FFFFFF"
          fillOpacity="0.92"
        />

        {/* Subtle sprocket accent nodes on open reel edge */}
        <circle cx="28.2" cy="14.2" r="1.15" fill="#12F084" fillOpacity="0.85" />
        <circle cx="28.2" cy="21.8" r="1.15" fill="#12F084" fillOpacity="0.85" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-serif text-[17px] sm:text-[18px] font-semibold tracking-[0.18em] truncate leading-none",
              forceLightWordmark ? "text-white" : "text-foreground"
            )}
          >
            CINEASTE
          </span>
          <span
            className={cn(
              "text-[9.5px] uppercase tracking-[0.22em] font-medium mt-1 truncate hidden sm:block leading-none",
              forceLightWordmark ? "text-white/75" : "text-muted-foreground"
            )}
          >
            CURATED CINEMA
          </span>
        </div>
      )}
    </div>
  );
}
