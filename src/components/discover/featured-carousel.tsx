"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight } from "lucide-react";
import { formatScore, formatYear } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/image-util";
import type { Movie } from "@/types";

interface FeaturedCarouselProps {
  movies?: Movie[];
}

/**
 * Reconstructed 1:1 replica of Cineaste Featured Banner Carousel (Ybe)
 */
export function FeaturedCarousel({ movies = [] }: FeaturedCarouselProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const featured = React.useMemo(
    () => movies.filter((m) => !!m.backdrop_path).slice(0, 5),
    [movies]
  );

  React.useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const current = featured[activeIdx];
  const backdropUrl = getTmdbImageUrl(current.backdrop_path, "w1280");

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-[#F3F4F6]">
          Featured
        </h2>
        <p className="text-xs text-[#9496A1] mt-0.5">
          A cinematic selection worth your attention
        </p>
      </div>

      <Link
        href={`/movie/${current.tmdb_id}`}
        className="block relative h-[280px] sm:h-[340px] md:h-[400px] rounded-2xl overflow-hidden ring-1 ring-[#1E1F2A]/60 group bg-[#101118]"
      >
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={current.title}
              fill
              sizes="100vw"
              priority
              className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[#151622]" />
          )}
        </div>

        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

        {/* Content Details */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 md:p-8 z-10">
          <div className="flex items-center gap-2 mb-2 text-xs">
            {current.vote_average !== undefined && current.vote_average > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md text-[#FBBF24] font-medium tabular-nums px-1.5 py-0.5 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-white">
                  {formatScore(current.vote_average)}
                </span>
              </span>
            )}
            {current.release_date && (
              <span className="text-white/60">
                {formatYear(current.release_date)}
              </span>
            )}
          </div>

          <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl leading-tight">
            {current.title}
          </h3>

          {current.overview && (
            <p className="text-sm text-white/70 mt-2 max-w-xl line-clamp-2 hidden sm:block leading-relaxed">
              {current.overview}
            </p>
          )}

          <div className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#00D878] font-medium group-hover:underline">
            <span>Explore</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Bottom-right pagination dots */}
        {featured.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
            {featured.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIdx
                    ? "w-6 bg-[#00D878]"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Featured slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </Link>
    </section>
  );
}
