"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterCarouselProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable Horizontal Poster Carousel
 * Provides smooth touch scrolling and subtle desktop navigation arrows.
 */
export function PosterCarousel({ children, className }: PosterCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const handleScroll = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (el) {
      el.scrollBy({
        left: direction * el.clientWidth * 0.75,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("relative group/carousel w-full", className)}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll(-1)}
          aria-label="Scroll left"
          className="hidden md:grid absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 place-items-center rounded-full bg-background/90 backdrop-blur-md border border-border shadow-xl hover:scale-105 active:scale-95 text-foreground hover:border-[#00D878]/60 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {children}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll(1)}
          aria-label="Scroll right"
          className="hidden md:grid absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 place-items-center rounded-full bg-background/90 backdrop-blur-md border border-border shadow-xl hover:scale-105 active:scale-95 text-foreground hover:border-[#00D878]/60 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
