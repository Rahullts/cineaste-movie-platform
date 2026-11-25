"use client";

import * as React from "react";
import { Clapperboard, TrendingUp, Compass, Calendar, Users } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "section-featured", label: "Featured", icon: Clapperboard },
  { id: "section-trending", label: "Trending Today", icon: TrendingUp },
  { id: "section-hidden-gems", label: "Hidden Gems", icon: Compass },
  { id: "section-coming-soon", label: "Coming Soon", icon: Calendar },
  { id: "section-people", label: "People to Watch", icon: Users },
];

/**
 * Cineaste Explore Navigation System
 * Compact, cinematic sitemap providing smooth anchor scrolling and
 * active section tracking via IntersectionObserver.
 */
export function ExploreNav() {
  const [activeId, setActiveId] = React.useState<string>("section-featured");
  const isClickScrolling = React.useRef(false);

  React.useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-15% 0px -50% 0px",
      threshold: 0.15,
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      if (isClickScrolling.current) return;

      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActiveId(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id: string) => {
    setActiveId(id);
    isClickScrolling.current = true;

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <nav
      aria-label="Explore Sections Navigation"
      className="w-full flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar py-1"
    >
      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-[#101118]/90 backdrop-blur-md border border-[#1E1F2A] shadow-lg shadow-black/40">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleScrollTo(item.id)}
              className={`relative px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 shrink-0 select-none ${
                isActive
                  ? "text-[#00D878] bg-[#00D878]/12 shadow-sm font-semibold"
                  : "text-[#9496A1] hover:text-[#F3F4F6] hover:bg-white/5"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#00D878]" : "text-[#9496A1]"}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D878] shadow-sm shadow-[#00D878]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
