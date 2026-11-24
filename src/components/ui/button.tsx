import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#00D664] text-black hover:bg-[#00B855] shadow-[0_0_20px_-5px_rgba(0,214,100,0.4)] hover:shadow-[0_0_25px_0_rgba(0,214,100,0.5)] font-semibold",
      secondary:
        "bg-[#181820] text-[#F3F4F6] hover:bg-[#22232D] border border-[#1E1F2A]",
      outline:
        "bg-transparent text-[#F3F4F6] border border-[#1E1F2A] hover:bg-[#181820] hover:border-[#2D2F3E]",
      ghost:
        "bg-transparent text-[#9496A1] hover:text-[#F3F4F6] hover:bg-[#181820]",
      gold:
        "bg-[#FBBF24] text-black hover:bg-[#F59E0B] shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)] font-semibold",
      danger:
        "bg-[#E53935] text-white hover:bg-[#D32F2F] shadow-[0_0_20px_-5px_rgba(229,57,53,0.3)]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-10 px-4 text-sm rounded-[0.85rem] gap-2",
      lg: "h-12 px-6 text-base rounded-[0.85rem] gap-2.5",
      icon: "h-10 w-10 rounded-[0.85rem] p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
