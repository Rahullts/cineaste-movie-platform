"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TopNav } from "./top-nav";
import { FloatingDock } from "./floating-dock";
import { CommandPalette } from "./command-palette";
import { QuickAddDialog } from "./quick-add-dialog";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/" || pathname === "/dashboard";
  const isMovieDetail = pathname.startsWith("/movie/");
  const isFullBleed = isDashboard || isMovieDetail;
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] =
    React.useState(false);

  // Listen for custom window events dispatched anywhere in the app
  React.useEffect(() => {
    const handleOpenPalette = () => setIsCommandPaletteOpen(true);
    const handleOpenQuickAdd = () => setIsQuickAddOpen(true);
    const handleToggleShortcuts = () =>
      setIsKeyboardShortcutsOpen((prev) => !prev);

    window.addEventListener("open-command-palette", handleOpenPalette);
    window.addEventListener("open-quick-add", handleOpenQuickAdd);
    window.addEventListener("toggle-keyboard-shortcuts", handleToggleShortcuts);

    return () => {
      window.removeEventListener("open-command-palette", handleOpenPalette);
      window.removeEventListener("open-quick-add", handleOpenQuickAdd);
      window.removeEventListener(
        "toggle-keyboard-shortcuts",
        handleToggleShortcuts
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col transition-colors duration-200 overflow-x-clip">
      {/* Top Header with Cineaste brand, global search, quick add, notifications, and profile */}
      <TopNav
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Dynamic Route Content - Full Viewport Width with generous bottom padding for Floating Dock + safe areas */}
      <main
        className={cn(
          "flex-1 w-full max-w-full min-w-0 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))]",
          isFullBleed
            ? "px-0 pt-0 -mt-16"
            : "px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4"
        )}
      >
        {children}
      </main>

      {/* Footer — clean borderless layout with balanced side margins */}
      <footer className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] text-xs text-muted-foreground/80">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Cineaste</span>
            <span className="opacity-40" aria-hidden="true">•</span>
            <span className="text-[#00D878] font-medium">Film Vault</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Link
              href="/legal/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/legal/cookies"
              className="hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/legal/data"
              className="hover:text-foreground transition-colors"
            >
              Data Policy
            </Link>
            <Link
              href="/legal/licensing"
              className="hover:text-foreground transition-colors"
            >
              Licensing
            </Link>
            <Link
              href="/legal/opensource"
              className="hover:text-foreground transition-colors"
            >
              Open Source
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Center Horizontal Navigation Dock (Hidden on Movie Detail views to prevent text overlap) */}
      {!isMovieDetail && (
        <React.Suspense fallback={null}>
          <FloatingDock />
        </React.Suspense>
      )}

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Quick Add Movie Dialog */}
      <QuickAddDialog
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onOpenCommandPalette={() => {
          setIsQuickAddOpen(false);
          setIsCommandPaletteOpen(true);
        }}
      />

      {/* Keyboard Shortcuts Dialog ('?') */}
      <KeyboardShortcutsDialog
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
    </div>
  );
}
