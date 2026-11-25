"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CinematicDashboardIcon,
  CinematicDiscoverIcon,
  CinematicLibraryIcon,
  CinematicSettingsIcon,
} from "@/components/icons/cinematic-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

interface NavButtonItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  matcher: (pathname: string) => boolean;
}

/**
 * Cineaste Floating Navigation — Dark Borderless Circular Cinema Dock
 * Uses cohesive custom cinema line-icons matching the header aesthetic.
 */
const NAV_BUTTONS: NavButtonItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: CinematicDashboardIcon,
    matcher: (p) => p === "/dashboard" || p === "/",
  },
  {
    to: "/discover",
    label: "Discover",
    icon: CinematicDiscoverIcon,
    matcher: (p) => p.startsWith("/discover"),
  },
  {
    to: "/library",
    label: "My Library",
    icon: CinematicLibraryIcon,
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
    icon: CinematicSettingsIcon,
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
              "group relative h-10 w-10 rounded-full grid place-items-center transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-xl",
              isLight
                ? isActive
                  ? "bg-white text-[#00B855] shadow-lg shadow-black/15"
                  : "bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 shadow-md shadow-black/10"
                : isActive
                  ? "bg-[#151824] text-[#00D664] shadow-xl shadow-black/70"
                  : "bg-[#131520]/90 hover:bg-[#1E2233] text-white/85 hover:text-white shadow-lg shadow-black/60"
            )}
          >
            <Icon size={18} className="shrink-0 transition-colors" />

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
                "hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md backdrop-blur-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
                isLight
                  ? "bg-white/95 text-slate-900 shadow-sm"
                  : "bg-[#131520]/95 text-white shadow-md"
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
