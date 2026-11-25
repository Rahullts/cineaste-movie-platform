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
 * Provides smooth touch scrolling, responsive track observation,
 * and unobtrusive desktop navigation controls centered on poster artwork.
 */
export function PosterCarousel({ children, className }: PosterCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => checkScroll());
      observer.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      observer?.disconnect();
    };
  }, [checkScroll, children]);

  const handleScroll = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (el) {
      el.scrollBy({
        left: direction * el.clientWidth * 0.78,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("relative group/carousel w-full", className)}>
      {/* Scroll Left Button — centered cleanly at poster vertical midpoint */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll(-1)}
          aria-label="Scroll left"
          className="hidden md:grid absolute -left-3 lg:-left-4 top-[40%] -translate-y-1/2 z-30 w-9 h-9 place-items-center rounded-full bg-[#0E0F15]/90 backdrop-blur-md border border-white/10 shadow-xl hover:scale-105 active:scale-95 text-white hover:border-[#00D664]/60 hover:text-[#00D664] transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2]" />
        </button>
      )}

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3 sm:gap-4 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {children}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll(1)}
          aria-label="Scroll right"
          className="hidden md:grid absolute -right-3 lg:-right-4 top-[40%] -translate-y-1/2 z-30 w-9 h-9 place-items-center rounded-full bg-[#0E0F15]/90 backdrop-blur-md border border-white/10 shadow-xl hover:scale-105 active:scale-95 text-white hover:border-[#00D664]/60 hover:text-[#00D664] transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronRight className="w-4 h-4 stroke-[2]" />
        </button>
      )}
    </div>
  );
}
