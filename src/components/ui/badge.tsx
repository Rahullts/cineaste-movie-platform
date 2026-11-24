import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "gold" | "outline" | "genre" | "genreActive";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none";

    const variantStyles = {
      default:
        "bg-[#181820] text-[#9496A1] border border-[#1E1F2A]",
      primary:
        "bg-[rgba(0,214,100,0.12)] text-[#00D664] border border-[rgba(0,214,100,0.3)] font-semibold",
      secondary:
        "bg-[#181820] text-[#F3F4F6] border border-[#1E1F2A]",
      gold:
        "bg-[rgba(251,191,36,0.12)] text-[#FBBF24] border border-[rgba(251,191,36,0.25)] font-semibold",
      outline:
        "border border-[#1E1F2A] text-[#F3F4F6] bg-transparent",
      genre:
        "bg-[#101118] text-[#9496A1] border border-[#1E1F2A] hover:border-[#00D664] hover:text-[#F3F4F6] cursor-pointer py-1 px-3 rounded-full text-xs transition-all",
      genreActive:
        "bg-[#00D664] text-black font-semibold border border-[#00D664] cursor-pointer py-1 px-3 rounded-full text-xs shadow-[0_0_15px_-3px_rgba(0,214,100,0.4)]",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
