"use client";

import * as React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value?: number;
  max?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (val: number) => void;
}

/**
 * Reconstructed 1:1 replica of Cineaste 5-Star Fractional Rating (mb + kbe)
 */
export function StarRating({
  value = 0,
  max = 5,
  size = 14,
  readOnly = true,
  onChange,
}: StarRatingProps) {
  const [hoverVal, setHoverVal] = React.useState<number | null>(null);

  // Normalize if value is on a 10-point scale (e.g. 8.5 -> 4.25)
  const normalizedValue = value > max ? value / 2 : value;
  const displayVal = readOnly ? normalizedValue : hoverVal ?? normalizedValue;

  return (
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Rating ${value} of ${max}`}
      onMouseLeave={() => setHoverVal(null)}
    >
      {Array.from({ length: max }, (_, idx) => {
        const starIdx = idx + 1;
        const fraction = Math.max(0, Math.min(1, displayVal - (starIdx - 1)));

        return (
          <button
            key={starIdx}
            type="button"
            disabled={readOnly}
            tabIndex={readOnly ? -1 : 0}
            onClick={() => {
              if (readOnly || !onChange) return;
              onChange(value === starIdx ? 0 : starIdx);
            }}
            onMouseMove={(e) => {
              if (readOnly || !onChange) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = (e.clientX - rect.left) / rect.width < 0.5;
              setHoverVal(starIdx - 1 + (isHalf ? 0.5 : 1));
            }}
            aria-hidden={readOnly}
            className={`relative inline-flex p-0.5 transition-transform ${
              !readOnly ? "cursor-pointer hover:scale-110" : "cursor-default"
            }`}
          >
            {/* Background empty star */}
            <Star
              size={size}
              strokeWidth={1.5}
              className="text-[#9496A1]/30 fill-transparent shrink-0"
            />
            {/* Foreground filled fraction star */}
            <span
              className="absolute inset-0.5 overflow-hidden transition-[width] duration-200 ease-out"
              style={{ width: `${fraction * 100}%` }}
            >
              <Star
                size={size}
                strokeWidth={1.5}
                className="text-[#FBBF24] fill-[#FBBF24] shrink-0"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
