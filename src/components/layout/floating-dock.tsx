"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Compass, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavButtonItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (pathname: string) => boolean;
}

/**
 * Cineaste Floating Navigation — Header-Identical Circular Icon System
 * 
 * DESIGN SPECIFICATIONS:
 * 1. ZERO visible borders, outlines, rings or circular strokes around buttons.
 * 2. Subtle dark filled circular background matching existing Search / Profile buttons:
 *    `bg-black/30 hover:bg-white/15 backdrop-blur-md`
 * 3. Exact matching circular dimensions (`h-9 w-9`), icon size (`w-4 h-4`), and visual weight.
 * 4. Clean, minimal off-white Lucide icons (`text-white/80 hover:text-white`).
 * 5. Active icon uses Cineaste green (`text-[#00D878]`).
 * 6. Tiny green active indicator dot below the active icon (`w-1.5 h-1.5 bg-[#00D878]`).
 * 7. NO green outer rings, NO glowing circles, and NO unnecessary shadows.
 * 8. NO bordered circles or outlined button containers.
 * 9. Four independent circular buttons, NOT a combined navigation pill or dock bar.
 * 10. Horizontally aligned with clean spacing (`gap-2.5 sm:gap-3`).
 */
const NAV_BUTTONS: NavButtonItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    matcher: (p) => p === "/dashboard" || p === "/",
  },
  {
    to: "/discover",
    label: "Discover",
    icon: Compass,
    matcher: (p) => p.startsWith("/discover"),
  },
  {
    to: "/library",
    label: "My Library",
    icon: Library,
    matcher: (p) =>
      p.startsWith("/library") ||
      p.startsWith("/watchlist") ||
      p === "/watched" ||
      p === "/favorites" ||
      p === "/collections" ||
      p === "/timeline" ||
      p === "/import" ||
      p.startsWith("/activity"),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    matcher: (p) =>
      p.startsWith("/settings") ||
      p.startsWith("/profile") ||
      p.startsWith("/billing") ||
      p.startsWith("/admin"),
  },
];

export function FloatingDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-6 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 select-none animate-fadeIn pointer-events-auto flex items-center gap-2.5 sm:gap-3"
    >
      {NAV_BUTTONS.map((item) => {
        const Icon = item.icon;
        const isActive = item.matcher(pathname);

        return (
          <Link
            key={item.label}
            href={item.to}
            aria-label={item.label}
            data-active={isActive ? "true" : "false"}
            className={cn(
              "group relative h-9 w-9 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md bg-black/30 hover:bg-white/15",
              isActive ? "text-[#00D878]" : "text-white/80 hover:text-white"
            )}
          >
            {/* Clean, minimal Lucide Icon (w-4 h-4, matching top-nav exactly) */}
            <Icon className="w-4 h-4 shrink-0 transition-colors" />

            {/* Cineaste Green Active Indicator Dot Underneath (clean, no glowing ring/shadow) */}
            {isActive && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00D878]" />
            )}

            {/* Individual Floating Tooltip (Hover Only) */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#0E0F15]/95 backdrop-blur-md text-[10px] font-mono tracking-wider text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
