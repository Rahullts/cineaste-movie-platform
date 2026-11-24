"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  index?: string;
}

/**
 * Reconstructed 1:1 replica of original Cineaste Section Header (Zo)
 * Enhanced with Reference 1 editorial bracket numbering (e.g. [01])
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  index,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3 sm:mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 grid place-items-center shrink-0">
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary" />
          </span>
        )}
        <div>
          <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-tight text-foreground flex items-baseline gap-2">
            {index && (
              <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground/80 tracking-wider">
                [{index}]
              </span>
            )}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}