"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Compass, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <nav
      aria-label="Primary Navigation"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      className="fixed left-1/2 -translate-x-1/2 z-40 select-none animate-fadeIn pointer-events-auto flex items-center gap-3 sm:gap-3.5"
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
              "group relative h-9 w-9 rounded-full grid place-items-center transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-xl",
              isLight
                ? isActive
                  ? "bg-white/95 text-[#00B855] ring-1 ring-[#00B855]/35 shadow-lg shadow-black/15"
                  : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 ring-1 ring-black/10 shadow-md shadow-black/10"
                : isActive
                  ? "bg-[#0E0F15]/95 text-[#00D664] ring-1 ring-[#00D664]/35 shadow-lg shadow-black/60"
                  : "bg-[#0E0F15]/85 hover:bg-[#1A1C28]/95 text-white/80 hover:text-white ring-1 ring-white/10 shadow-lg shadow-black/50"
            )}
          >
            <Icon className="w-4 h-4 shrink-0 transition-colors" strokeWidth={1.8} />

            {/* Cineaste Green Active Indicator Dot */}
            {isActive && (
              <span
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                  isLight ? "bg-[#00B855]" : "bg-[#00D664]"
                )}
              />
            )}

            {/* Hover Tooltip */}
            <span
              className={cn(
                "hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
                isLight
                  ? "bg-white/95 text-slate-900 border border-black/10 shadow-sm"
                  : "bg-[#0E0F15]/95 text-white border border-white/10"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
