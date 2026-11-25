"use client";

import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * 1. Cinematic Clapperboard / Home Symbol (Dashboard)
 * Distinctive slanted clapper stick with chevron scene stripes + film slate base.
 */
export function CinematicDashboardIcon({ className, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Lower slate container */}
      <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z" />
      {/* Upper angled clapper stick */}
      <path d="M4 11V7.5a1.5 1.5 0 0 1 1.2-1.47l12-2.4a1.5 1.5 0 0 1 1.77 1.2L20 11H4z" />
      {/* Diagonal scene stripes on clapper */}
      <path d="m8.5 5.5 1.8 5.5" />
      <path d="m13.2 4.5 1.8 5.5" />
    </svg>
  );
}

/**
 * 2. Cinematic Lens / Camera Iris Aperture (Discover)
 * Precision 6-blade camera iris diaphragm symbol.
 */
export function CinematicDiscoverIcon({ className, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer lens barrel */}
      <circle cx="12" cy="12" r="9.5" />
      {/* 6 precision aperture iris blades */}
      <path d="m14.3 2.8-4.2 6.6" />
      <path d="m20.7 7.5-7.3 2.3" />
      <path d="m21.1 15.6-5.9 4.7" />
      <path d="m9.7 21.2 4.2-6.6" />
      <path d="m3.3 16.5 7.3-2.3" />
      <path d="m2.9 8.4 5.9-4.7" />
    </svg>
  );
}

/**
 * 3. Cinematic Film-Strip Bookmark (My Library / Watchlist)
 * Custom ribbon bookmark with twin film sprocket perforations.
 */
export function CinematicLibraryIcon({ className, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bookmark contour with cinematic tail notch */}
      <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h11A1.5 1.5 0 0 1 19 3.5V22l-7-3.8L5 22V3.5z" />
      {/* Film sprocket perforations */}
      <circle cx="9" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * 4. Cinematic Console / Adjustment Console (Settings)
 * Precision triple-slider audio/color-grading console.
 */
export function CinematicSettingsIcon({ className, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horizontal tracks with precision slider grips */}
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="8" cy="6" r="2.2" fill="var(--surface, #0E0F15)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="2.2" fill="var(--surface, #0E0F15)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="18" r="2.2" fill="var(--surface, #0E0F15)" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * 5. Cinematic Bookmark Icon (Watchlist Action)
 */
export function CinematicBookmarkIcon({
  className,
  size = 15,
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4z" />
    </svg>
  );
}

/**
 * 6. Cinematic Heart Icon (Favorite Action)
 */
export function CinematicHeartIcon({
  className,
  size = 15,
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * 7. Cinematic Watched Check Icon (Completion Indicator)
 */
export function CinematicWatchedCheckIcon({
  className,
  size = 13,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
