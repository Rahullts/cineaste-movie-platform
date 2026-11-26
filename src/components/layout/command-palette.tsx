"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  SlidersHorizontal,
  ArrowRight,
  Bookmark,
  Film,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_VIBES_PROMPTS,
  RECENT_SEARCHES_STORAGE_KEY,
} from "@/lib/constants";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const JUMP_LINKS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Discover", path: "/discover" },
  { label: "Watchlist", path: "/watchlist" },
  { label: "Favorites", path: "/watchlist?tab=favorites" },
  { label: "Collections", path: "/activity?tab=collections" },
  { label: "Activity Hub", path: "/activity" },
  { label: "Settings", path: "/settings" },
];

const INDIAN_CINEMA_PROMPTS = [
  { label: "Bollywood Hits", query: "Bollywood" },
  { label: "Tamil Cinema", query: "Tamil" },
  { label: "Telugu Cinema", query: "Telugu" },
  { label: "Malayalam Cinema", query: "Malayalam" },
  { label: "Kannada Cinema", query: "Kannada" },
  { label: "Punjabi Cinema", query: "Punjabi" },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  const loadRecentSearches = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [
        trimmed,
        ...recentSearches.filter(
          (s) => s.toLowerCase() !== trimmed.toLowerCase()
        ),
      ].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch {
      // ignore localStorage errors
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadRecentSearches();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen, loadRecentSearches]);

  // Global Escape listener when open (Cmd/Ctrl+K now opens the Movie Command Dock via AppShell)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVibeClick = (vibe: string) => {
    saveRecentSearch(vibe);
    onClose();
    router.push(`/discover?ai=1&q=${encodeURIComponent(vibe)}`);
  };

  const handleJumpClick = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onClose();
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-popover dark:bg-[#12141F] border-0 shadow-[0_24px_70px_rgba(0,0,0,0.85)] animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-3 px-4 border-0 bg-secondary/50 dark:bg-[#171A28]"
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies or jump to a page…"
            className="flex-1 bg-transparent border-0 focus:outline-none h-14 text-base text-foreground placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] text-muted-foreground border border-border bg-muted rounded px-1.5 py-0.5 shrink-0 font-mono">
              ESC
            </kbd>
          )}
        </form>

        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-3 space-y-4">
          {!query.trim() && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 py-1 text-xs text-[#9496A1] uppercase tracking-wide flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#9496A1]" />
                    <span>Recent searches</span>
                  </p>
                  <div className="space-y-0.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          router.push(
                            `/discover?q=${encodeURIComponent(term)}`
                          );
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#181820]/60 text-sm text-[#F3F4F6] transition group text-left"
                      >
                        <span className="font-medium truncate">{term}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#9496A1] opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Vibes */}
              <div className="space-y-1.5">
                <p className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  <span>Mood &amp; vibe presets</span>
                </p>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {AI_VIBES_PROMPTS.map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => handleVibeClick(vibe)}
                      className="text-xs rounded-full border border-border bg-card px-3 py-1 text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indian Cinema Quick Searches */}
              <div className="space-y-1.5">
                <p className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 font-semibold">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  <span>Indian Cinema</span>
                </p>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {INDIAN_CINEMA_PROMPTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        saveRecentSearch(item.query);
                        onClose();
                        router.push(`/discover?q=${encodeURIComponent(item.query)}`);
                      }}
                      className="text-xs rounded-full border border-border bg-card px-3 py-1 text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jump to Navigation */}
              <div className="space-y-1">
                <p className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Jump to
                </p>
                <div className="space-y-0.5">
                  {JUMP_LINKS.map((link) => (
                    <button
                      key={link.path}
                      type="button"
                      onClick={() => handleJumpClick(link.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition group text-left"
                    >
                      <span className="font-medium">{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {query.trim() && (
            <div className="p-3 text-center space-y-3">
              <p className="text-sm text-[#9496A1]">
                Press Enter to search for &ldquo;
                <span className="text-[#F3F4F6] font-semibold">
                  {query.trim()}
                </span>
                &rdquo;
              </p>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full py-2.5 rounded-xl bg-[#00D664] text-black font-semibold text-sm hover:bg-[#00B855] transition shadow-md"
              >
                See all results on Discover &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
