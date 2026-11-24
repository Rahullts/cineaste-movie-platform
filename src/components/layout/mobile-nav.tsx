"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  FolderHeart,
  Upload,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";

const ICON_MAP = {
  LayoutDashboard,
  Compass,
  Bookmark,
  FolderHeart,
  Upload,
  Calendar,
  Settings,
};

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0B0F]/85 backdrop-blur-xl border-t border-[#1E1F2A] select-none pb-safe">
      <div className="flex items-stretch justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          const isActive =
            pathname === item.to || pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium transition-colors",
                isActive ? "text-[#00D664]" : "text-[#9496A1] hover:text-[#F3F4F6]"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110 stroke-[2.5]"
                )}
              />
              <span className={cn(isActive && "font-bold text-[#F3F4F6]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
