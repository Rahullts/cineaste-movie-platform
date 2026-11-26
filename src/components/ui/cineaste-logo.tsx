"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CineasteLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showWordmark?: boolean;
  forceLightWordmark?: boolean;
  variant?: "primary" | "monochrome" | "emerald";
}

/**
 * Cineaste Official Identity — "The Aperture Gate"
 *
 * Original chamfered projection-gate C-monogram framing a suspended widescreen
 * film memory plate, paired cleanly with our geometric CINEASTE wordmark.
 */
export function CineasteLogo({
  size = 28,
  className,
  showWordmark = false,
  forceLightWordmark = false,
  variant = "primary",
  ...props
}: CineasteLogoProps) {
  const numericSize = typeof size === "number" ? size : 28;
  const wordmarkHeight = Math.round(numericSize * 0.72);
  const wordmarkWidth = Math.round(wordmarkHeight * (124 / 24));

  const accentFill =
    variant === "monochrome"
      ? "currentColor"
      : forceLightWordmark
        ? "#00D664"
        : "#00D664";

  const frameClass =
    variant === "emerald"
      ? "text-[#00D664]"
      : forceLightWordmark
        ? "text-[#F3F4F6]"
        : "text-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 shrink-0 select-none",
        frameClass,
        className
      )}
    >
      {/* Standalone Aperture Gate Symbol */}
      <svg
        width={numericSize}
        height={numericSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-[1px]"
        aria-label="Cineaste Aperture Gate Symbol"
        {...props}
      >
        {/* Architectural Chamfered Projection Gate 'C' */}
        <path
          d="M7 4H24.5V9H8.8V23H24.5V28H7L3 24V8L7 4Z"
          fill="currentColor"
        />
        {/* Suspended Widescreen Memory Frame */}
        <path
          d="M13.5 13H29V16.8L26.8 19H13.5V13Z"
          fill={variant === "monochrome" ? "currentColor" : accentFill}
          fillOpacity={variant === "monochrome" ? 0.75 : 1}
          className="transition-opacity duration-200"
        />
      </svg>

      {/* Bespoke Horizontal Vector Wordmark */}
      {showWordmark && (
        <svg
          width={wordmarkWidth}
          height={wordmarkHeight}
          viewBox="0 0 124 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="CINEASTE"
          className="shrink-0"
        >
          <g
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="butt"
            strokeLinejoin="bevel"
          >
            {/* C */}
            <path d="M13.5 7.5C12.3 5.9 10.4 5 8.2 5C4.6 5 2.2 8 2.2 12C2.2 16 4.6 19 8.2 19C10.4 19 12.3 18.1 13.5 16.5" />
            {/* I */}
            <path d="M20.5 5V19" />
            {/* N */}
            <path d="M27.5 19V5L38.5 19V5" />
            {/* E */}
            <path d="M54.5 5H45.5V19H54.5M45.5 12H53" />
            {/* A */}
            <path d="M61 19L66.5 5L72 19M62.8 14.8H70.2" />
            {/* S */}
            <path d="M87 7.4C86 5.8 84.3 5 82.2 5C79.4 5 77.5 6.6 77.5 8.6C77.5 10.8 79.4 11.6 82.3 12.2C85.2 12.8 87.3 13.6 87.3 16C87.3 18 85.2 19 82.3 19C79.9 19 78 18 77 16.4" />
            {/* T */}
            <path d="M92.5 5H103.5M98 5V19" />
            {/* E */}
            <path d="M118 5H109V19H118M109 12H116.5" />
          </g>
        </svg>
      )}
    </span>
  );
}
