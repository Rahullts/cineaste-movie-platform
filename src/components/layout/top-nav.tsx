"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Sun,
  Moon,
  Laptop,
  User,
  CreditCard,
  ShieldCheck,
  Settings,
  LogOut,
  Mic,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/lib/theme-context";
import { useUser, CINEASTE_PLANS } from "@/lib/user-context";
import { CineasteLogo } from "@/components/ui/cineaste-logo";

export interface TopNavProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenQuickAdd?: () => void;
}

/**
 * Cineaste Global Header
 * Consistent on EVERY page (Dashboard, Discover, Watchlist/Library, Settings).
 * 
 * Contains ONLY:
 * 1. Cineaste logo and brand name (sharp, fully visible, vertically aligned).
 * 2. Compact search icon/control (with tab popover: text, voice, AI mode).
 * 3. Quick Add control (green pill with white plus icon).
 * 4. Light/Dark/System theme control (working 3-way toggle/selector).
 * 5. User profile/avatar circle (avatar circle ONLY, no username text beside it).
 * 
 * NO filter button, NO extra plus icon, NO username text beside avatar, NO bell icon.
 */
export function TopNav({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenQuickAdd,
}: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/" || pathname === "/dashboard";
  const isFullBleed = isDashboard || pathname.startsWith("/movie/");
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isAdmin, isAuthenticated, signOut, openAuthModal } = useUser();

  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLightMode = resolvedTheme === "light";
  const useLightHeaderChrome = isLightMode && !(isFullBleed && !scrolled);

  // Floating tab search states
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isAiMode, setIsAiMode] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isListeningVoice, setIsListeningVoice] = React.useState(false);
  const [voiceStatus, setVoiceStatus] = React.useState<string | null>(null);
  const voiceRecognitionRef = React.useRef<any>(null);

  // Theme dropdown state
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const themeMenuRef = React.useRef<HTMLDivElement>(null);

  // Account dropdown state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsThemeMenuOpen(false);
        setIsSearchOpen(false);
      }
      // Ctrl+K / Cmd+K toggle search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle Quick Add click
  const handleQuickAddClick = () => {
    if (onOpenQuickAdd) {
      onOpenQuickAdd();
    } else {
      window.dispatchEvent(new Event("open-quick-add"));
    }
  };

  // Voice Search Handler
  const handleVoiceToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus("Voice search not supported in this browser.");
      setTimeout(() => setVoiceStatus(null), 3000);
      return;
    }

    if (isListeningVoice) {
      try {
        voiceRecognitionRef.current?.stop();
      } catch {}
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      voiceRecognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceStatus("Listening... speak movie or mood");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          const trimmed = transcript.trim();
          setSearchQuery(trimmed);
          setVoiceStatus(`Recognized: "${trimmed}"`);
          setTimeout(() => {
            setVoiceStatus(null);
            executeSearch(trimmed, isAiMode);
          }, 600);
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        setVoiceStatus("Could not hear voice. Please try again.");
        setTimeout(() => setVoiceStatus(null), 3000);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceStatus("Failed to access microphone.");
      setTimeout(() => setVoiceStatus(null), 3000);
    }
  };

  const executeSearch = (query: string, ai: boolean) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (isDashboard) {
      window.dispatchEvent(
        new CustomEvent("dashboard-search", {
          detail: { query: trimmed, aiMode: ai },
        })
      );
    } else {
      router.push(`/discover?q=${encodeURIComponent(trimmed)}${ai ? "&ai=1" : ""}`);
    }
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, isAiMode);
  };

  // Cycle theme: dark -> light -> system -> dark
  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const planInfo = CINEASTE_PLANS[user.subscription.plan] || CINEASTE_PLANS.free;
  const userInitials = (user.display_name || user.email || "U")
    .slice(0, 1)
    .toUpperCase();

  const actionButtonIdleClass = useLightHeaderChrome
    ? "bg-black/[0.06] hover:bg-black/[0.12] text-slate-800 hover:text-slate-950 border border-black/10"
    : "bg-black/45 hover:bg-white/15 text-white/90 hover:text-white border border-white/10";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 select-none pointer-events-none transition-all duration-200",
        scrolled
          ? isLightMode
            ? "bg-[#F8F9FA]/90 backdrop-blur-xl border-b border-black/10 shadow-[0_6px_24px_rgba(0,0,0,0.06)]"
            : "bg-[#0A0B0F]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
          : isFullBleed
            ? "bg-gradient-to-b from-black/70 via-black/35 to-transparent"
            : "bg-background/80 backdrop-blur-md"
      )}
    >
      {/* 1. Brand Logo Link — floats cleanly over scrim */}
      <Link
        href="/dashboard"
        aria-label="Cineaste Home"
        className="shrink-0 flex items-center group cursor-pointer pointer-events-auto"
      >
        <CineasteLogo
          size={32}
          showWordmark={true}
          forceLightWordmark={isFullBleed && !scrolled}
        />
      </Link>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right Controls Container — 4 independent floating circular icons, no shared background */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative pointer-events-auto">
        {/* ================================================================= */}
        {/* 1. Compact Search Icon Control (Floating circular, no box borders) */}
        {/* ================================================================= */}
        <div className="relative" ref={searchContainerRef}>
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="Search movies"
            title="Search films, voice mode, AI mode (Ctrl+K)"
            className={cn(
              "h-9 w-9 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md",
              isSearchOpen
                ? "bg-[#00D878]/20 text-[#00D878] shadow-[0_0_12px_rgba(0,216,120,0.25)] border border-[#00D878]/35"
                : actionButtonIdleClass
            )}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Compact Tab-like Search Popover */}
          {isSearchOpen && (
            <div className="absolute top-12 right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-[300px] sm:w-[400px] p-2.5 rounded-2xl bg-popover/95 text-popover-foreground border border-border shadow-2xl backdrop-blur-2xl">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/90 border border-border focus-within:border-[#00D878]/60 transition"
                >
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAiMode
                        ? "AI Vibe Search (e.g. cozy rainy day noir)..."
                        : "Search films, directors, keywords..."
                    }
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />

                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Voice Mode Button */}
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    title={
                      isListeningVoice
                        ? "Stop listening"
                        : "Voice search mode (Speak query)"
                    }
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      isListeningVoice
                        ? "bg-rose-500 text-white animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Close Tab Button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>

                {voiceStatus && (
                  <div className="mt-2 px-3 py-1 text-[11px] text-[#00D878] bg-[#00D878]/10 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D878] animate-ping" />
                    <span>{voiceStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. Quick Add Control (Floating circular, dedicated sleek plus icon) */}
        {/* ================================================================= */}
        <button
          type="button"
          onClick={handleQuickAddClick}
          aria-label="Quick Add Movie"
          title="Quick Add Movie to Vault (Live TMDB)"
          className={cn(
            "h-9 w-9 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md group",
            actionButtonIdleClass,
            "hover:text-[#00D878]"
          )}
        >
          <Plus className="w-4 h-4 transition-colors stroke-[2.5]" />
        </button>

        {/* ================================================================= */}
        {/* 3. Light/Dark/System Theme Control (Floating circular 3-way toggle) */}
        {/* ================================================================= */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            aria-label={`Theme: ${theme}. Click to switch theme.`}
            title={`Current theme: ${theme}. Click to change.`}
            className={cn(
              "h-9 w-9 rounded-full grid place-items-center transition active:scale-95 cursor-pointer backdrop-blur-md",
              isThemeMenuOpen
                ? "bg-[#00D878]/20 text-[#00D878] shadow-[0_0_12px_rgba(0,216,120,0.25)] border border-[#00D878]/35"
                : actionButtonIdleClass
            )}
          >
            {theme === "light" ? (
              <Sun className="w-4 h-4 text-[#FBBF24] transition-transform hover:rotate-45" />
            ) : theme === "dark" ? (
              <Moon className="w-4 h-4 text-[#00D878] transition-transform hover:-rotate-12" />
            ) : (
              <Laptop className="w-4 h-4 text-[#60A5FA] transition-transform" />
            )}
          </button>

          {/* Theme 3-way dropdown menu */}
          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  setIsThemeMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition cursor-pointer",
                  theme === "light"
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Light</span>
                </div>
                {theme === "light" && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  setIsThemeMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition cursor-pointer",
                  theme === "dark"
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-[#00D878]" />
                  <span>Dark</span>
                </div>
                {theme === "dark" && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("system");
                  setIsThemeMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition cursor-pointer",
                  theme === "system"
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>System</span>
                </div>
                {theme === "system" && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. User Profile Control (Floating circular, icon-only)             */}
        {/* ================================================================= */}
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal("signin");
              } else {
                setIsAccountMenuOpen((prev) => !prev);
              }
            }}
            aria-label="User Account"
            title={isAuthenticated ? user.display_name : "Sign In / Guest"}
            className={cn(
              "h-9 w-9 rounded-full grid place-items-center overflow-hidden transition active:scale-95 cursor-pointer backdrop-blur-md group",
              isAccountMenuOpen
                ? "bg-[#00D878]/20 text-[#00D878] shadow-[0_0_12px_rgba(0,216,120,0.25)] border border-[#00D878]/35"
                : actionButtonIdleClass
            )}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : isAuthenticated ? (
              <span className="text-xs font-bold text-[#00D878]">
                {userInitials}
              </span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          {/* Account Popover Menu */}
          {isAuthenticated && isAccountMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-heading font-bold text-sm text-foreground truncate">
                    {user.display_name}
                  </p>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30">
                    {planInfo.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  @{user.handle} • {user.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-xl font-medium"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-xl font-medium"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/billing"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-xl font-medium"
                >
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>Billing & Subscription</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#00D878] hover:bg-[#00D878]/10 transition-colors rounded-xl font-medium"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Console</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-border pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors text-left font-medium rounded-xl cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
