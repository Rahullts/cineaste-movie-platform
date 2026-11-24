"use client";

import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Cineaste Vault Mark — Total Saved / Personal Film Archive
 * Geometric faceted vault canister with concentric precision tracks and central core.
 */
export function VaultMark({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${className}`}
      {...props}
    >
      {/* Outer octagonal vault frame */}
      <path
        d="M7 3h10l4 4v10l-4 4H7l-4-4V7l4-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Concentric archive ring */}
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="3 1.5"
        opacity="0.8"
      />
      {/* Central vault diamond core */}
      <polygon
        points="12,9.2 14.8,12 12,14.8 9.2,12"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Precision emerald nucleus */}
      <circle cx="12" cy="12" r="1.2" fill="#00D878" />
      {/* Cardinal vault locks */}
      <line x1="12" y1="4.5" x2="12" y2="6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12" y1="17.8" x2="12" y2="19.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="4.5" y1="12" x2="6.2" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="17.8" y1="12" x2="19.5" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Cineaste Orbit Mark — Unwatched / Films Waiting to be Discovered
 * Circular planetary core with tilted orbital trajectory and awaiting satellite node.
 */
export function OrbitMark({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${className}`}
      {...props}
    >
      {/* Central focal aperture core */}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" fillOpacity="0.25" />
      {/* Tilted elliptical orbit */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.2"
        ry="4.2"
        transform="rotate(-28 12 12)"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2.5 2"
        opacity="0.65"
      />
      {/* Glowing amber satellite node */}
      <circle
        cx="18.8"
        cy="8.2"
        r="2"
        fill="#FBBF24"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Polar axis coordinates */}
      <line x1="12" y1="2" x2="12" y2="4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="12" y1="19.8" x2="12" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * Cineaste Completion Frame Mark — Watched / Completed Viewing Experience
 * 16:9 cinematic view-finder frame with precision corner registration brackets and prism core.
 */
export function CompletionFrameMark({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${className}`}
      {...props}
    >
      {/* Corner registration brackets */}
      <path
        d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner illuminated completion prism */}
      <polygon
        points="12,7.2 16.5,12 12,16.8 7.5,12"
        stroke="#00D878"
        strokeWidth="1.6"
        fill="#00D878"
        fillOpacity="0.2"
        strokeLinejoin="round"
      />
      {/* Horizontal aperture crosshair */}
      <line x1="9" y1="12" x2="15" y2="12" stroke="#00D878" strokeWidth="1.4" strokeLinecap="round" />
      {/* Central focal node */}
      <circle cx="12" cy="12" r="1.4" fill="#00D878" />
    </svg>
  );
}

/**
 * Cineaste Chrono Dial — Watch Time / Time Logged in Cinema
 * Chronometer dial with calibrated radial marks, sweeping elapsed arc, and horology hands.
 */
export function ChronoDial({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${className}`}
      {...props}
    >
      {/* Outer chronometer bezel */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* Sweeping elapsed watch time arc (from 12 o'clock clockwise to 9 o'clock) */}
      <path
        d="M12 3 A 9 9 0 1 1 3 12"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Radial cardinal markers */}
      <line x1="12" y1="4.2" x2="12" y2="6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19.8" y1="12" x2="17.8" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19.8" x2="12" y2="17.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.2" y1="12" x2="6.2" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center hub */}
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      {/* Chronometer hands at classic 10:10 position */}
      <line x1="12" y1="12" x2="8.5" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="12" x2="15.5" y2="9.5" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Cineaste Curated Star — Favorites
 */
export function CuratedStar({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Cineaste Archive Stack — All Films
 */
export function ArchiveStack({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
