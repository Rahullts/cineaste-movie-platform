"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Compass, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavButtonItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  matcher: (pathname: string) => boolean;
}

/**
 * Cineaste Floating Navigation — Header-Matched Circular Icon Dock
 * Preserves the exact four navigation destinations without text labels,
 * unified circular proportions (h-9 w-9), uniform stroke weight (1.8),
 * crisp dark translucent surfaces, and Cineaste green (#00D664) indicator.
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
      className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 select-none animate-fadeIn pointer-events-auto flex items-center gap-3 sm:gap-3.5"
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
              "group relative h-9 w-9 rounded-full grid place-items-center transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-xl shadow-lg shadow-black/50",
              isActive
                ? "bg-[#0E0F15]/90 text-[#00D664]"
                : "bg-[#0E0F15]/75 hover:bg-[#1A1C28]/90 text-white/80 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 shrink-0 transition-colors" strokeWidth={1.8} />

            {/* Cineaste Green Active Indicator Dot */}
            {isActive && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00D664]" />
            )}

            {/* Hover Tooltip */}
            <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#0E0F15]/95 backdrop-blur-md text-[10px] font-medium tracking-wide text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
