"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reconstructed 1:1 replica of original Cineaste Empty State (wi)
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${
        className || ""
      }`}
    >
      {Icon && (
        <div className="mb-4 w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/40">
          <Icon className="w-8 h-8 text-muted-foreground/60" strokeWidth={1.2} />
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
