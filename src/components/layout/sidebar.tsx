"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Heart,
  FolderHeart,
  Upload,
  Calendar,
  CreditCard,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_SECTIONS } from "@/lib/constants";

const ICON_MAP = {
  LayoutDashboard,
  Compass,
  Bookmark,
  Heart,
  FolderHeart,
  Upload,
  Calendar,
  CreditCard,
  User,
  Settings,
  Shield,
};

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = React.useCallback(
    (to: string) => {
      const [base, query] = to.split("?");
      if (query) {
        return pathname === base && searchParams.toString().includes(query);
      }
      return (
        pathname === to ||
        (to !== "/" && pathname.startsWith(to) && !to.includes("?"))
      );
    },
    [pathname, searchParams]
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 lg:hidden animate-fadeIn backdrop-blur-sm"
          onClick={onMobileClose}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-[#0D0E14] border-r border-[#1E1F2A] flex flex-col p-0 shadow-2xl animate-slideDown"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E1F2A]/60">
              <Link
                href="/dashboard"
                onClick={onMobileClose}
                className="flex items-center gap-2.5"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#00D664] text-black font-heading font-black text-sm shrink-0 shadow-sm">
                  C
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-sm font-black tracking-widest text-[#F3F4F6]">
                    CINEASTE
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-[#9496A1] font-medium -mt-0.5">
                    YOUR SECOND BRAIN FOR MOVIES
                  </span>
                </div>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9496A1]/70">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = ICON_MAP[item.iconName];
                    const isActive = isItemActive(item.to);

                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        onClick={onMobileClose}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl h-9 px-3 text-[13px] font-medium transition-all duration-200 select-none",
                          isActive
                            ? "bg-[rgba(0,214,100,0.1)] text-[#00D664] ring-1 ring-[rgba(0,214,100,0.25)] shadow-[0_8px_30px_-12px_rgba(0,214,100,0.4)]"
                            : "text-[#9496A1] hover:text-[#F3F4F6] hover:bg-[#181820]/60"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[#00D664]" />
                        )}
                        <Icon className="relative w-[17px] h-[17px] shrink-0" />
                        <span className="relative truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Mobile User Footer */}
            <div className="border-t border-[#1E1F2A]/60 p-3 bg-[#0A0B0F]">
              <Link
                href="/profile"
                onClick={onMobileClose}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#181820]/60 transition"
              >
                <span className="w-9 h-9 rounded-full bg-[rgba(0,214,100,0.15)] grid place-items-center text-sm font-semibold text-[#00D664] ring-1 ring-[#1E1F2A] shrink-0 font-heading">
                  CR
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#F3F4F6] truncate">
                    Cineaste Member
                  </p>
                  <p className="text-xs text-[#9496A1] truncate">
                    member@cineaste.vault
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-[width] duration-300 ease-out select-none",
          collapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-heading font-black text-sm shrink-0 shadow-sm">
              C
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-black tracking-widest text-foreground truncate">
                  CINEASTE
                </span>
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium -mt-0.5 truncate">
                  YOUR SECOND BRAIN FOR MOVIES
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-thin">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {collapsed ? (
                <div className="h-px bg-border my-2 mx-1.5" />
              ) : (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = ICON_MAP[item.iconName];
                const isActive = isItemActive(item.to);

                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-2xl h-10 text-[13px] font-medium transition-all duration-200 group",
                      collapsed ? "justify-center w-10 mx-auto" : "px-3.5",
                      isActive
                        ? "bg-primary/12 text-foreground border border-primary/40 shadow-[0_0_20px_-5px_rgba(0,214,100,0.3)] font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                    )}
                  >
                    <Icon className={cn("relative w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    {!collapsed && (
                      <span className="relative truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Desktop User Footer */}
        <div className="border-t border-border p-3 bg-sidebar">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-2xl p-2 hover:bg-muted/60 transition",
              collapsed && "justify-center p-1"
            )}
            title="User Profile"
          >
            <span className="w-8 h-8 rounded-full bg-primary grid place-items-center text-xs font-black text-primary-foreground shrink-0 font-heading shadow-sm">
              R
            </span>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    Rahul
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Free Plan
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
