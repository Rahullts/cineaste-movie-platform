"use client";

import * as React from "react";
import { Check, Bookmark, X } from "lucide-react";

interface WatchlistToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function WatchlistToast({ message, onDismiss }: WatchlistToastProps) {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0E0F16]/95 border border-[#00D664]/40 shadow-2xl shadow-black backdrop-blur-xl text-white text-xs font-medium">
        <span className="w-5 h-5 rounded-full bg-[#00D664]/20 text-[#00D664] grid place-items-center shrink-0">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
        <span className="max-w-[280px] sm:max-w-md truncate">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 text-[#9496A1] hover:text-white transition"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
