"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Shield,
  Palette,
  Sliders,
  Bell,
  Eye,
  Globe,
  Share2,
  Database,
  Trash2,
  Download,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  X,
  HardDrive,
  UserCheck,
  CreditCard,
  Settings,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme, type Theme } from "@/lib/theme-context";
import { useUser } from "@/lib/user-context";
import { useLibrary } from "@/lib/library-store";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/types";

const ACCENT_COLORS: { id: string; name: string; hex: string }[] = [
  { id: "emerald", name: "Cineaste Emerald", hex: "#00D878" },
  { id: "crimson", name: "Crimson", hex: "#FF4D5A" },
  { id: "indigo", name: "Indigo", hex: "#6C9EFF" },
  { id: "amber", name: "Amber Gold", hex: "#FBBF24" },
  { id: "cyan", name: "Cyan", hex: "#22D3EE" },
  { id: "violet", name: "Violet", hex: "#A78BFA" },
];

const REGIONS = [
  { code: "IN", name: "India (IN)" },
  { code: "US", name: "United States (US)" },
  { code: "GB", name: "United Kingdom (GB)" },
  { code: "CA", name: "Canada (CA)" },
  { code: "AU", name: "Australia (AU)" },
  { code: "DE", name: "Germany (DE)" },
  { code: "FR", name: "France (FR)" },
  { code: "JP", name: "Japan (JP)" },
  { code: "KR", name: "South Korea (KR)" },
  { code: "BR", name: "Brazil (BR)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
];

type SettingsTabId =
  | "appearance"
  | "preferences"
  | "notifications"
  | "privacy"
  | "security"
  | "language"
  | "accounts"
  | "data"
  | "danger";

interface SettingsTabConfig {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  { id: "appearance", label: "Appearance", description: "Theme, accents & interface density", icon: Palette },
  { id: "preferences", label: "Preferences", description: "Streaming regions, autoplay & ratings", icon: Sliders },
  { id: "notifications", label: "Notifications", description: "Email & browser alert preferences", icon: Bell },
  { id: "privacy", label: "Privacy", description: "Profile visibility & public activity", icon: Eye },
  { id: "security", label: "Security & Sessions", description: "Password, credentials & device sessions", icon: Shield },
  { id: "language", label: "Language & Accessibility", description: "Languages, motion & contrast controls", icon: Globe },
  { id: "accounts", label: "Connected Accounts", description: "TMDB, Google & external cinema sync", icon: Share2 },
  { id: "data", label: "Data Management", description: "Export archive, sync & cache controls", icon: Database },
  { id: "danger", label: "Danger Zone", description: "Reset vaults & account removal", icon: AlertTriangle },
];

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { user, updateSettings, resetUserData, isAuthenticated } = useUser();
  const library = useLibrary();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = (searchParams.get("tab") || "appearance") as SettingsTabId;
  const [activeTab, setActiveTab] = React.useState<SettingsTabId>(
    SETTINGS_TABS.some((t) => t.id === tabParam) ? tabParam : "appearance"
  );

  React.useEffect(() => {
    const t = searchParams.get("tab") as SettingsTabId;
    if (t && SETTINGS_TABS.some((s) => s.id === t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabSelect = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    router.replace(`/settings?tab=${tabId}`, { scroll: false });
  };

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [clearedSearches, setClearedSearches] = React.useState(false);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [activeSessionNotice, setActiveSessionNotice] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    updateSettings({ [key]: value });
    showToast("Preferences saved");
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    handleSettingChange("theme", newTheme);
  };

  const handleClearSearches = () => {
    try {
      localStorage.removeItem("cinebrain:recent-searches");
      localStorage.removeItem("cineaste_recent_searches");
      setClearedSearches(true);
      showToast("Recent searches cache cleared");
      setTimeout(() => setClearedSearches(false), 3000);
    } catch {
      showToast("Unable to clear search cache");
    }
  };

  const handleExportData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        user: {
          display_name: user.display_name,
          handle: user.handle,
          email: user.email,
          role: user.role,
          plan: user.subscription.plan,
        },
        watchlist: library.movies,
        collections: library.collections,
        activity: library.activities,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cineaste-vault-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Vault archive exported as cineaste-vault-export.json");
    } catch {
      showToast("Export failed");
    }
  };

  const handleResetLibrary = () => {
    try {
      localStorage.removeItem("cineaste:library:watchlist");
      localStorage.removeItem("cineaste:library:watchlist:v2");
      localStorage.removeItem("cineaste:library:collections");
      localStorage.removeItem("cineaste:library:activities");
      localStorage.removeItem("cineaste:library_v2");
      setShowResetModal(false);
      showToast("Library and activity history have been reset");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      showToast("Failed to reset library data");
    }
  };

  const handleDeleteAccount = () => {
    try {
      resetUserData();
      localStorage.clear();
      setShowDeleteModal(false);
      showToast("Account data removed. Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch {
      showToast("Failed to delete account");
    }
  };

  const currentTabConfig = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <AppShell>
      {/* Fullscreen Desktop / Laptop Container (Seamless borderless layout) */}
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-10 select-none pb-32">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1A1C24] text-white text-xs font-semibold shadow-2xl shadow-black animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D878] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header — Clean Borderless Cinematic Editorial Presentation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-[#00D878] shrink-0" />
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                Settings
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00D878]/10 text-[#00D878] font-bold font-mono">
                Vault Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Customize your cinema experience, visual presentation, vault preferences, streaming regions, and account security.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/profile"
              className="h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-foreground hover:text-[#00D878] transition inline-flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <UserCheck className="w-4 h-4 text-muted-foreground group-hover:text-[#00D878] transition-colors" />
              <span>View Profile</span>
            </Link>
            <Link
              href="/billing"
              className="h-10 px-4 rounded-xl bg-[#00D878]/15 text-xs font-bold text-[#00D878] hover:bg-[#00D878] hover:text-black transition inline-flex items-center gap-2 cursor-pointer shadow-sm shadow-[#00D878]/10"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span>{user.subscription.plan.toUpperCase()} Plan</span>
            </Link>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Section Scroller (visible only on narrow screens < md) */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0",
                  isActive
                    ? "bg-[#00D878] text-black shadow-md shadow-[#00D878]/20 font-bold"
                    : "bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Fullscreen Laptop / Desktop Layout (Borderless) */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10 xl:gap-14 items-start">
          {/* Left Navigation Rail (Desktop / Laptop — Borderless) */}
          <aside className="hidden md:flex flex-col w-64 lg:w-72 xl:w-80 shrink-0 space-y-6 sticky top-24">
            <div className="space-y-1.5 p-1 rounded-2xl bg-transparent">
              <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Navigation Sections
              </div>
              <nav className="space-y-1">
                {SETTINGS_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group relative",
                        isActive
                          ? "bg-[#00D878]/12 text-[#00D878] font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] font-medium"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#00D878]" />
                      )}
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-[#00D878]" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold block leading-tight truncate">
                          {tab.label}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 hidden xl:block truncate mt-0.5">
                          {tab.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Cloud Sync Status Indicator Card (Borderless) */}
            <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAuthenticated ? "bg-[#00D878] animate-pulse" : "bg-amber-400"
                  )}
                />
                <span className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                  {isAuthenticated ? "Cloud Sync Active" : "Local Storage Mode"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isAuthenticated
                  ? "Settings synchronize with your Supabase cloud profile across all devices."
                  : "Settings are stored locally in your browser. Connect an account to sync across devices."}
              </p>
            </div>
          </aside>

          {/* Right Column: Settings Section Content (Expansive Fullscreen Laptop Workspace — Borderless) */}
          <div id="settings-workspace" className="flex-1 min-w-0 w-full space-y-8">
            {/* Section Header (No bottom divider line) */}
            <div className="pb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00D878] uppercase tracking-wider mb-1">
                <span>Settings</span>
                <span>/</span>
                <span className="text-foreground font-bold">{currentTabConfig.label}</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {currentTabConfig.label}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {currentTabConfig.description}
              </p>
            </div>

            {/* ============================================================= */}
            {/* SECTION 1: Appearance                                         */}
            {/* ============================================================= */}
            {activeTab === "appearance" && (
              <section className="space-y-8">
                {/* Theme Mode Segmented Card Grid (Borderless) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Color Theme</h3>
                    <p className="text-xs text-muted-foreground">
                      Choose dark obsidian for movie night, daylight light for daytime, or synchronize with your OS.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        id: "dark" as Theme,
                        label: "Dark Obsidian",
                        icon: Moon,
                        desc: "Deep OLED blacks for authentic cinematic viewing",
                        bgClass: "bg-[#0A0B10]",
                        previewBar: "bg-white/10",
                      },
                      {
                        id: "light" as Theme,
                        label: "Daylight Light",
                        icon: Sun,
                        desc: "High clarity daylight contrast for productivity",
                        bgClass: "bg-[#F3F4F6] text-black",
                        previewBar: "bg-black/10",
                      },
                      {
                        id: "system" as Theme,
                        label: "System Auto",
                        icon: Laptop,
                        desc: "Automatically follows your OS system preferences",
                        bgClass: "bg-gradient-to-r from-[#0A0B10] to-[#F3F4F6]",
                        previewBar: "bg-[#00D878]/30",
                      },
                    ].map((t) => {
                      const Icon = t.icon;
                      const active = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeChange(t.id)}
                          className={cn(
                            "relative p-4 sm:p-5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-4 group",
                            active
                              ? "bg-white/[0.08] shadow-lg shadow-black/40"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          {/* Miniature Theme Preview Box */}
                          <div
                            className={cn(
                              "w-full h-20 rounded-xl p-3 flex flex-col justify-between shadow-inner",
                              t.bgClass
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00D878]" />
                            </div>
                            <div className="space-y-1.5">
                              <div className={cn("h-1.5 w-3/4 rounded-full", t.previewBar)} />
                              <div className={cn("h-1 w-1/2 rounded-full", t.previewBar)} />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-foreground">{t.label}</span>
                              {active && <Check className="w-4 h-4 text-[#00D878] stroke-[3]" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                              {t.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color Selection Card (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Signature Accent Color</h3>
                      <p className="text-xs text-muted-foreground">
                        Customizes buttons, active badges, rating highlights, and focus indicators.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#00D878] bg-[#00D878]/10 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                      {ACCENT_COLORS.find((c) => c.id === user.settings.accent)?.name || "Cineaste Emerald"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                    {ACCENT_COLORS.map((col) => {
                      const isSelected = user.settings.accent === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleSettingChange("accent", col.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group",
                            isSelected
                              ? "bg-white/[0.09] shadow-sm"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <span
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                            style={{ backgroundColor: col.hex }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {col.hex}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interface Density Segmented Control (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Interface Layout Density</h3>
                    <p className="text-xs text-muted-foreground">
                      Fine-tune viewport padding, movie card spacing, and typography scale.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        id: "comfortable" as const,
                        label: "Comfortable (Recommended for Laptops)",
                        desc: "Generous breathing room, relaxed poster card margins, and high readability.",
                      },
                      {
                        id: "compact" as const,
                        label: "Compact (Information Dense)",
                        desc: "Maximized screen real estate, dense movie grids, and compact table views.",
                      },
                    ].map((d) => {
                      const active = user.settings.density === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleSettingChange("density", d.id)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-3 group",
                            active
                              ? "bg-white/[0.09] shadow-sm"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-foreground">{d.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.desc}</p>
                          </div>
                          {active && (
                            <span className="w-5 h-5 rounded-full bg-[#00D878] text-black grid place-items-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 2: Preferences                                        */}
            {/* ============================================================= */}
            {activeTab === "preferences" && (
              <section className="space-y-6">
                {/* Autoplay Trailers Toggle (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Autoplay Movie Trailers</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically stream theatrical YouTube trailers when opening movie details on desktop.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.autoplay_trailers}
                    onClick={() =>
                      handleSettingChange("autoplay_trailers", !user.settings.autoplay_trailers)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.autoplay_trailers ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.autoplay_trailers ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>

                {/* Rating Scale Selection Cards (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] space-y-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Preferred Rating Scale</p>
                    <p className="text-xs text-muted-foreground">
                      Choose how ratings are formatted across your library, reviews, and diary.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "stars5" as const, label: "5 Stars (★)", desc: "1-5 star scale with half stars (Classic)" },
                      { id: "ten" as const, label: "10 Points (8.5)", desc: "Decimal precision score (0.0 to 10.0)" },
                      { id: "thumbs" as const, label: "Thumbs Up / Down", desc: "Binary recommendation system" },
                    ].map((r) => {
                      const active = user.settings.rating_system === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSettingChange("rating_system", r.id)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                            active
                              ? "bg-white/[0.09] shadow-sm"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold text-foreground">{r.label}</span>
                            {active && <Check className="w-4 h-4 text-[#00D878] stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Streaming Region Selection (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Primary Streaming Region</p>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Retrieves localized availability badges for Netflix, Prime Video, Disney+, Apple TV, and Hotstar.
                    </p>
                  </div>

                  <select
                    value={user.settings.region}
                    onChange={(e) => handleSettingChange("region", e.target.value)}
                    className="h-10 px-4 rounded-xl bg-white/[0.08] text-xs font-semibold text-foreground outline-none transition cursor-pointer min-w-[200px]"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.code} value={r.code} className="bg-[#12131C] text-white">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 3: Notifications                                      */}
            {/* ============================================================= */}
            {activeTab === "notifications" && (
              <section className="space-y-6">
                {/* Email Digest (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Email Cinema Digest</p>
                    <p className="text-xs text-muted-foreground">
                      Weekly curated film releases, upcoming theatrical premieres, and personal milestone summaries.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.email_notifications}
                    onClick={() =>
                      handleSettingChange("email_notifications", !user.settings.email_notifications)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.email_notifications ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.email_notifications ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>

                {/* Push Notifications (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">In-App Streaming Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Live push notifications when movies saved in your Watchlist arrive on OTT platforms.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.push_notifications}
                    onClick={() =>
                      handleSettingChange("push_notifications", !user.settings.push_notifications)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.push_notifications ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.push_notifications ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 4: Privacy                                            */}
            {/* ============================================================= */}
            {activeTab === "privacy" && (
              <section className="space-y-6">
                {/* Profile Visibility (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] space-y-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Profile Visibility</p>
                    <p className="text-xs text-muted-foreground">
                      Controls who can discover your cinephile profile and public shelves.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "public" as const, label: "Public", desc: "Discoverable by all cinema lovers" },
                      { id: "friends" as const, label: "Friends Only", desc: "Visible only to mutual followers" },
                      { id: "private" as const, label: "Private", desc: "Completely private personal vault" },
                    ].map((v) => {
                      const active = user.settings.profile_visibility === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSettingChange("profile_visibility", v.id)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                            active
                              ? "bg-white/[0.09] shadow-sm"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold text-foreground">{v.label}</span>
                            {active && <Check className="w-4 h-4 text-[#00D878] stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{v.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show Activity (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Public Activity Feed</p>
                    <p className="text-xs text-muted-foreground">
                      Broadcast your screening logs and milestone badges to the community timeline.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.show_activity}
                    onClick={() =>
                      handleSettingChange("show_activity", !user.settings.show_activity)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.show_activity ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.show_activity ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>

                {/* Show Watchlist (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Shareable Watchlist</p>
                    <p className="text-xs text-muted-foreground">
                      Permit other film enthusiasts to browse your upcoming watchlist queue.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.show_watchlist}
                    onClick={() =>
                      handleSettingChange("show_watchlist", !user.settings.show_watchlist)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.show_watchlist ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.show_watchlist ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 5: Security & Sessions                                */}
            {/* ============================================================= */}
            {activeTab === "security" && (
              <section className="space-y-6">
                {/* Account Identity (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Account Identifier</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user.email || "guest@cineaste.vault (Local Session)"}
                    </p>
                  </div>
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#00D878]/10 text-[#00D878] font-semibold self-start sm:self-auto font-mono">
                    {isAuthenticated ? "Supabase Authenticated" : "Local Guest Vault"}
                  </span>
                </div>

                {/* 2FA Status (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-muted-foreground">
                      Require an authenticator app confirmation code during sign in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        isAuthenticated
                          ? "2FA is active via your primary OAuth/Supabase identity provider."
                          : "Connect an account to configure two-factor authentication."
                      )
                    }
                    className="h-10 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] hover:text-[#00D878] text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-sm"
                  >
                    <span>Configure 2FA</span>
                  </button>
                </div>

                {/* Active Browser Sessions (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Active Browser Sessions</p>
                    <p className="text-xs text-muted-foreground">
                      1 active session on this device (Chrome / Windows • IP: 127.0.0.1)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSessionNotice(
                        "Verified: Only 1 active session exists on this browser. All other historical tokens have been revoked."
                      );
                      showToast("Device sessions verified");
                    }}
                    className="h-10 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] hover:text-[#00D878] text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-sm"
                  >
                    <span>Audit Sessions</span>
                  </button>
                </div>

                {activeSessionNotice && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] text-xs text-foreground flex items-center justify-between gap-3 animate-fadeIn">
                    <span className="leading-relaxed">{activeSessionNotice}</span>
                    <button
                      type="button"
                      onClick={() => setActiveSessionNotice(null)}
                      className="text-muted-foreground hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 6: Language & Accessibility                           */}
            {/* ============================================================= */}
            {activeTab === "language" && (
              <section className="space-y-6">
                {/* Language Selector (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Interface Language</p>
                    <p className="text-xs text-muted-foreground">
                      Primary localization for labels, navigation controls, and descriptions.
                    </p>
                  </div>

                  <select
                    value={user.settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="h-10 px-4 rounded-xl bg-white/[0.08] text-xs font-semibold text-foreground outline-none transition cursor-pointer min-w-[200px]"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-[#12131C] text-white">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reduce Motion Toggle (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Reduce Motion</p>
                    <p className="text-xs text-muted-foreground">
                      Minimize hero parallax transitions, kinetic card animations, and carousel auto-scroll.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.reduce_motion}
                    onClick={() =>
                      handleSettingChange("reduce_motion", !user.settings.reduce_motion)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.reduce_motion ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.reduce_motion ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>

                {/* High Contrast Toggle (Borderless) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">High Contrast Text</p>
                    <p className="text-xs text-muted-foreground">
                      Enhance typography contrast for optimal readability in bright environments.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={user.settings.high_contrast}
                    onClick={() =>
                      handleSettingChange("high_contrast", !user.settings.high_contrast)
                    }
                    className={cn(
                      "w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0",
                      user.settings.high_contrast ? "bg-[#00D878]" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-sm",
                        user.settings.high_contrast ? "translate-x-5.5" : ""
                      )}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 7: Connected Accounts                                 */}
            {/* ============================================================= */}
            {activeTab === "accounts" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Google Card (Borderless) */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">Google OAuth</p>
                        <span
                          className={cn(
                            "text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold",
                            isAuthenticated
                              ? "bg-[#00D878]/15 text-[#00D878]"
                              : "bg-white/[0.06] text-muted-foreground"
                          )}
                        >
                          {isAuthenticated ? "Linked" : "Available"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Instant single sign-on and automatic cloud profile synchronization across mobile and laptop devices.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast("Google Single Sign-On is managed at login")}
                      className="h-9 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-foreground hover:text-[#00D878] transition self-start cursor-pointer"
                    >
                      {isAuthenticated ? "Manage Link" : "Connect via Login"}
                    </button>
                  </div>

                  {/* TMDB Card (Borderless) */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">The Movie Database (TMDB)</p>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#00D878]/15 text-[#00D878]">
                          Active Gateway
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Powers poster artwork, high-resolution backdrops, cast credits, and live algorithmic recommendations.
                      </p>
                    </div>
                    <span className="text-xs text-[#00D878] font-medium inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Live Metadata Connected</span>
                    </span>
                  </div>

                  {/* Letterboxd / IMDb Card (Borderless) */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">Letterboxd &amp; IMDb</p>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-white/[0.06] text-muted-foreground">
                          Ready
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Import CSV watchlist archives and export Cineaste diary logs compatible with major cinema platforms.
                      </p>
                    </div>
                    <Link
                      href="/import"
                      className="h-9 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-foreground hover:text-[#00D878] transition self-start cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Open Import Tool</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 8: Data Management                                    */}
            {/* ============================================================= */}
            {activeTab === "data" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Export Card (Borderless) */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Download className="w-5 h-5 text-[#00D878]" />
                        <p className="text-sm font-bold text-foreground">Export Complete Vault Archive</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Download a comprehensive JSON archive containing all your saved films, watched history, custom collections, and personal ratings.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="h-10 px-5 rounded-xl bg-[#00D878] hover:bg-[#00B855] text-black text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-md shadow-[#00D878]/20 cursor-pointer self-start"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Export cineaste-vault-export.json</span>
                    </button>
                  </div>

                  {/* Clear Cache Card (Borderless) */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Trash2 className="w-5 h-5 text-amber-400" />
                        <p className="text-sm font-bold text-foreground">Search History &amp; Cache</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Purge recent movie, director, and actor search query recommendations cached in your local browser storage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSearches}
                      className="h-10 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] hover:text-destructive text-foreground text-xs font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{clearedSearches ? "Searches Purged!" : "Clear Search History"}</span>
                    </button>
                  </div>
                </div>

                {/* Storage Diagnostics Bar (Borderless) */}
                <div className="p-5 rounded-2xl bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-[#00D878]" />
                    <span className="font-medium text-foreground">
                      Vault Total: {library.movies.length} Films • {library.collections.length} Collections
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#00D878] bg-[#00D878]/10 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    Storage Engine: Synchronized
                  </span>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* SECTION 9: Danger Zone                                        */}
            {/* ============================================================= */}
            {activeTab === "danger" && (
              <section className="space-y-6">
                <div className="p-5 sm:p-6 rounded-2xl bg-rose-500/[0.04] space-y-6">
                  {/* Reset Vault Data (Borderless) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Reset Vault Data</p>
                      <p className="text-xs text-muted-foreground max-w-xl">
                        Purges all movies, watched logs, custom shelves, and activity milestones while retaining account credentials.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="h-10 px-4 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <span>Reset Vault</span>
                    </button>
                  </div>

                  {/* Delete Account (Borderless) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Delete Account &amp; Vault</p>
                      <p className="text-xs text-muted-foreground max-w-xl">
                        Permanently eradicate your user identity, custom collections, watch records, and sign-in credentials from Cineaste.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-900/20 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* MODAL: Reset Library Confirmation */}
        {showResetModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-fadeIn"
          >
            <div className="w-full max-w-md rounded-3xl bg-[#12131C] p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 id="reset-modal-title" className="font-heading text-base font-bold text-white">
                  Reset Cinema Vault Data?
                </h3>
              </div>
              <p className="text-xs text-[#9496A1] leading-relaxed">
                This action will delete all saved movies, watched history, custom collections, and activity logs. Your account credentials will be preserved.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="h-9 px-4 rounded-xl bg-white/10 text-foreground hover:bg-white/15 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetLibrary}
                  className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Delete Account Confirmation */}
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-fadeIn"
          >
            <div className="w-full max-w-md rounded-3xl bg-[#12131C] p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 id="delete-modal-title" className="font-heading text-base font-bold text-white">
                  Permanently Delete Account?
                </h3>
              </div>
              <p className="text-xs text-[#9496A1] leading-relaxed">
                This action cannot be undone. All personal screening logs, reviews, ratings, vault lists, and authentication tokens will be permanently erased.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="h-9 px-4 rounded-xl bg-white/10 text-foreground hover:bg-white/15 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <AppShell>
          <div className="w-full max-w-[1920px] mx-auto py-16 text-center text-xs text-muted-foreground">
            Loading cinema settings...
          </div>
        </AppShell>
      }
    >
      <SettingsContent />
    </React.Suspense>
  );
}
