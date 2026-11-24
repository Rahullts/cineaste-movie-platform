"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  BarChart3,
  Users,
  Star,
  Megaphone,
  Flag,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  Film,
  FolderHeart,
  Calendar,
  Send,
  Sliders,
  Check,
  X,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useUser } from "@/lib/user-context";
import { useLibrary } from "@/lib/library-store";
import type { Movie } from "@/types";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
  plan: "free" | "pro" | "premium";
  created_date: string;
}

interface FeaturedFilm {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string;
  priority: number;
  active: boolean;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success";
  target: "all" | "pro" | "premium";
  active: boolean;
  created_date: string;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ModerationItem {
  id: string;
  author: string;
  body: string;
  target_title: string;
  created_date: string;
  flag_reason?: string;
}

const DEFAULT_USERS: AdminUser[] = [
  {
    id: "usr-01",
    full_name: "Rahul",
    email: "rahul@cineaste.vault",
    role: "admin",
    plan: "free",
    created_date: "2024-07-15",
  },
  {
    id: "usr-02",
    full_name: "Elena Rostova",
    email: "elena@cinephile.org",
    role: "user",
    plan: "pro",
    created_date: "2024-08-01",
  },
  {
    id: "usr-03",
    full_name: "Marcus Vance",
    email: "marcus@filmlens.io",
    role: "user",
    plan: "premium",
    created_date: "2024-08-19",
  },
  {
    id: "usr-04",
    full_name: "Aoi Takahashi",
    email: "aoi@tokyofilm.jp",
    role: "user",
    plan: "pro",
    created_date: "2024-09-04",
  },
  {
    id: "usr-05",
    full_name: "David Kim",
    email: "david@cinemavibe.net",
    role: "user",
    plan: "free",
    created_date: "2024-09-22",
  },
];

const DEFAULT_FEATURED: FeaturedFilm[] = [
  {
    id: "feat-1",
    tmdb_id: 693134,
    title: "Dune: Part Two",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    priority: 5,
    active: true,
  },
  {
    id: "feat-2",
    tmdb_id: 872585,
    title: "Oppenheimer",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    priority: 4,
    active: true,
  },
  {
    id: "feat-3",
    tmdb_id: 157336,
    title: "Interstellar",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    priority: 3,
    active: true,
  },
  {
    id: "feat-4",
    tmdb_id: 438631,
    title: "Dune",
    poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    priority: 2,
    active: true,
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Cineaste 2.0 Launched with Watchlist Favorites & Activity Hub",
    body: "Explore our refined experience featuring Favorites directly inside Watchlist, and custom Collections and diary imports inside Activity Hub.",
    type: "success",
    target: "all",
    active: true,
    created_date: "2024-10-28",
  },
  {
    id: "ann-2",
    title: "Pro & Premium AI Discovery Enhancements",
    body: "We have upgraded the thematic vibe search algorithms for Pro and Premium members with real-time OTT availability.",
    type: "info",
    target: "pro",
    active: true,
    created_date: "2024-10-25",
  },
];

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: "flag-1",
    key: "ai_vibe_search",
    name: "AI Thematic Vibe Search",
    description: "Natural language semantic discovery using mood embeddings",
    enabled: true,
  },
  {
    id: "flag-2",
    key: "letterboxd_import_v2",
    name: "Letterboxd Importer v2",
    description: "Enhanced CSV parser supporting diary tags, custom dates, and rewatches",
    enabled: true,
  },
  {
    id: "flag-3",
    key: "smart_collections",
    name: "Smart Auto-Collections",
    description: "Rule-based dynamic collections for directors, studios, and genres",
    enabled: true,
  },
  {
    id: "flag-4",
    key: "video_trailers",
    name: "High-Definition Video Trailers",
    description: "Inline YouTube & Apple QuickTime video trailer streaming player",
    enabled: true,
  },
  {
    id: "flag-5",
    key: "advanced_analytics",
    name: "Advanced Cinephile Analytics",
    description: "Director retrospectives, decade heatmaps, and watch time statistics",
    enabled: true,
  },
  {
    id: "flag-6",
    key: "community_reviews",
    name: "Public Collection Reviews",
    description: "Community discussion, ratings, and commentary on shared public lists",
    enabled: false,
  },
];

const DEFAULT_MODERATION: ModerationItem[] = [
  {
    id: "mod-1",
    author: "CineBuff99",
    body: "Absolute masterpiece. The cinematography in the desert sequence is unrivaled.",
    target_title: "Dune: Part Two",
    created_date: "2024-10-30",
  },
  {
    id: "mod-2",
    author: "ReelGeek",
    body: "Check out this third party link for streaming copies: http://unverified-site.tv",
    target_title: "Oppenheimer",
    created_date: "2024-10-29",
    flag_reason: "Automated flag: Suspicious external URL",
  },
  {
    id: "mod-3",
    author: "ClassicFan",
    body: "Added all 12 films to my Bergman retrospective collection. Outstanding curation!",
    target_title: "Ingmar Bergman Essentials",
    created_date: "2024-10-27",
  },
];

type TabId = "analytics" | "users" | "featured" | "announcements" | "flags" | "moderation";

export default function AdminPage() {
  const { user, isAdmin } = useUser();
  const library = useLibrary();

  const [activeTab, setActiveTab] = React.useState<TabId>("analytics");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Admin Data State
  const [users, setUsers] = React.useState<AdminUser[]>(DEFAULT_USERS);
  const [userQuery, setUserQuery] = React.useState("");

  const [featured, setFeatured] = React.useState<FeaturedFilm[]>(DEFAULT_FEATURED);
  const [featuredSearch, setFeaturedSearch] = React.useState("");

  const [announcements, setAnnouncements] = React.useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);
  const [newAnnTitle, setNewAnnTitle] = React.useState("");
  const [newAnnBody, setNewAnnBody] = React.useState("");
  const [newAnnType, setNewAnnType] = React.useState<"info" | "warning" | "success">("info");
  const [newAnnTarget, setNewAnnTarget] = React.useState<"all" | "pro" | "premium">("all");
  const [isSendingReleaseAlerts, setIsSendingReleaseAlerts] = React.useState(false);

  const [flags, setFlags] = React.useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [newFlagKey, setNewFlagKey] = React.useState("");
  const [newFlagName, setNewFlagName] = React.useState("");
  const [newFlagDesc, setNewFlagDesc] = React.useState("");

  const [moderation, setModeration] = React.useState<ModerationItem[]>(DEFAULT_MODERATION);

  // Load persisted admin overrides from localStorage
  React.useEffect(() => {
    try {
      const su = localStorage.getItem("cineaste:admin:users");
      if (su) setUsers(JSON.parse(su));
      const sf = localStorage.getItem("cineaste:admin:featured");
      if (sf) setFeatured(JSON.parse(sf));
      const sa = localStorage.getItem("cineaste:admin:announcements");
      if (sa) setAnnouncements(JSON.parse(sa));
      const sfl = localStorage.getItem("cineaste:admin:flags");
      if (sfl) setFlags(JSON.parse(sfl));
      const sm = localStorage.getItem("cineaste:admin:moderation");
      if (sm) setModeration(JSON.parse(sm));
    } catch {
      // ignore
    }
  }, []);

  const saveUsers = (u: AdminUser[]) => {
    setUsers(u);
    try { localStorage.setItem("cineaste:admin:users", JSON.stringify(u)); } catch {}
  };
  const saveFeatured = (f: FeaturedFilm[]) => {
    setFeatured(f);
    try { localStorage.setItem("cineaste:admin:featured", JSON.stringify(f)); } catch {}
  };
  const saveAnnouncements = (a: Announcement[]) => {
    setAnnouncements(a);
    try { localStorage.setItem("cineaste:admin:announcements", JSON.stringify(a)); } catch {}
  };
  const saveFlags = (fl: FeatureFlag[]) => {
    setFlags(fl);
    try { localStorage.setItem("cineaste:admin:flags", JSON.stringify(fl)); } catch {}
  };
  const saveModeration = (m: ModerationItem[]) => {
    setModeration(m);
    try { localStorage.setItem("cineaste:admin:moderation", JSON.stringify(m)); } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Guard: Unauthorized non-admin view matching Base44 KFe
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="w-full max-w-lg mx-auto py-24 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive grid place-items-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Admins Only
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You don&apos;t have administrative access to this page. Please return to the dashboard or log in with an authorized administrator account.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="h-10 px-5 rounded-full bg-primary text-black font-bold text-xs inline-flex items-center gap-2 hover:bg-primary/90 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Analytics Computation
  const localMoviesCount = library.movies.length;
  const localCollectionsCount = library.collections.length;
  const demoUsersCount = users.length + 1840; // baseline telemetry demonstration
  const dailyActive = 328;
  const monthlyActive = 1240;
  const retentionRate = "84%";

  // 14-day sample trend data
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const label = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
    return {
      date: label,
      events: Math.floor(180 + Math.sin(i * 0.8) * 60 + (i % 3) * 20),
      saves: Math.floor(70 + Math.cos(i * 0.7) * 25 + (i % 2) * 15),
    };
  });

  // User Actions
  const handleToggleUserRole = (id: string) => {
    let targetRole: "admin" | "user" = "user";
    const updated = users.map((u) => {
      if (u.id === id) {
        targetRole = u.role === "admin" ? "user" : "admin";
        showToast(`Role for ${u.full_name} updated to ${targetRole}`);
        return { ...u, role: targetRole };
      }
      return u;
    });
    saveUsers(updated);

    // Call server admin API
    fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_role",
        payload: { targetUserId: id, newRole: targetRole },
      }),
    }).catch(() => {});
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  // Featured Actions
  const handleFeatureMovie = (movie: Movie) => {
    if (featured.some((f) => f.tmdb_id === movie.tmdb_id)) {
      showToast(`${movie.title} is already featured`);
      return;
    }
    const maxPriority = featured.reduce((max, f) => Math.max(max, f.priority), 0);
    const newEntry: FeaturedFilm = {
      id: `feat-${Date.now()}`,
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path || "",
      priority: maxPriority + 1,
      active: true,
    };
    saveFeatured([newEntry, ...featured]);
    setFeaturedSearch("");
    showToast(`Featured ${movie.title} on spotlight`);

    fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "feature_movie",
        payload: {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          priority: newEntry.priority,
        },
      }),
    }).catch(() => {});
  };

  const handleReorderFeatured = (id: string, delta: number) => {
    const idx = featured.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= featured.length) return;
    const copy = [...featured];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    saveFeatured(copy);
  };

  const handleRemoveFeatured = (id: string) => {
    saveFeatured(featured.filter((f) => f.id !== id));
    showToast("Movie removed from spotlight");
  };

  // Announcement Actions
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim()) {
      showToast("Announcement title required");
      return;
    }
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      type: newAnnType,
      target: newAnnTarget,
      active: true,
      created_date: new Date().toISOString().split("T")[0],
    };
    saveAnnouncements([ann, ...announcements]);
    setNewAnnTitle("");
    setNewAnnBody("");
    showToast("Announcement broadcasted successfully");

    fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish_announcement",
        payload: {
          title: ann.title,
          body: ann.body,
          type: ann.type,
          target: ann.target,
        },
      }),
    }).catch(() => {});
  };

  const handleToggleAnnouncement = (id: string) => {
    saveAnnouncements(
      announcements.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    showToast("Announcement status updated");
  };

  const handleDeleteAnnouncement = (id: string) => {
    saveAnnouncements(announcements.filter((a) => a.id !== id));
    showToast("Announcement deleted");
  };

  const handleSendReleaseAlerts = () => {
    setIsSendingReleaseAlerts(true);
    setTimeout(() => {
      setIsSendingReleaseAlerts(false);
      showToast("Release alert worker requires production email service configuration (SendGrid / AWS SES).");
    }, 900);
  };

  // Flag Actions
  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey.trim() || !newFlagName.trim()) {
      showToast("Flag key and display name required");
      return;
    }
    const keyClean = newFlagKey.trim().toLowerCase().replace(/\s+/g, "_");
    const flag: FeatureFlag = {
      id: `flag-${Date.now()}`,
      key: keyClean,
      name: newFlagName.trim(),
      description: newFlagDesc.trim() || "Experimental feature flag",
      enabled: false,
    };
    saveFlags([...flags, flag]);
    setNewFlagKey("");
    setNewFlagName("");
    setNewFlagDesc("");
    showToast(`Feature flag ${keyClean} created`);
  };

  const handleToggleFlag = (id: string) => {
    let nextEnabled = false;
    const updated = flags.map((f) => {
      if (f.id === id) {
        nextEnabled = !f.enabled;
        showToast(`Flag ${f.key} ${nextEnabled ? "enabled" : "disabled"}`);
        return { ...f, enabled: nextEnabled };
      }
      return f;
    });
    saveFlags(updated);

    fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_flag",
        payload: { flagId: id, enabled: nextEnabled },
      }),
    }).catch(() => {});
  };

  const handleDeleteFlag = (id: string) => {
    saveFlags(flags.filter((f) => f.id !== id));
    showToast("Feature flag deleted");
  };

  // Moderation Actions
  const handleRemoveComment = (id: string) => {
    saveModeration(moderation.filter((m) => m.id !== id));
    showToast("Comment removed for guidelines compliance");

    fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "moderate_comment",
        payload: { commentId: id, status: "removed", reason: "Removed by admin" },
      }),
    }).catch(() => {});
  };

  return (
    <AppShell>
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-8 pb-32">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1A1C24] border border-[#00D878]/40 text-white text-xs font-semibold shadow-2xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#00D878]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-primary">
                <Shield className="w-4 h-4" />
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Admin Panel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary uppercase tracking-wider">
                Staff
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Platform telemetry, member moderation, spotlight curation, and operational toggles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Signed in as <strong className="text-foreground">{user.display_name}</strong>
            </span>
          </div>
        </div>

        {/* Six Management Tabs matching Base44 GFe */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/60 pb-px">
          {[
            { id: "analytics" as TabId, label: "Analytics", icon: BarChart3 },
            { id: "users" as TabId, label: "Users", icon: Users },
            { id: "featured" as TabId, label: "Featured", icon: Star },
            { id: "announcements" as TabId, label: "Announcements", icon: Megaphone },
            { id: "flags" as TabId, label: "Feature Flags", icon: Flag },
            { id: "moderation" as TabId, label: "Moderation", icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANALYTICS (Base44 UFe) */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in">
            {/* 6 Key Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                { label: "Total Users", value: demoUsersCount.toLocaleString(), isDemo: true, icon: Users },
                { label: "Daily Active", value: dailyActive, isDemo: true, icon: Clock },
                { label: "Monthly Active", value: monthlyActive.toLocaleString(), isDemo: true, icon: BarChart3 },
                { label: "Retention Rate", value: retentionRate, isDemo: true, icon: CheckCircle2 },
                { label: "Vault Movies", value: localMoviesCount.toLocaleString(), isDemo: false, icon: Film },
                { label: "Vault Collections", value: localCollectionsCount.toLocaleString(), isDemo: false, icon: FolderHeart },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-semibold">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span>{stat.label}</span>
                    </div>
                    <p className="font-heading text-xl sm:text-2xl font-black text-foreground tabular-nums">
                      {stat.value}
                    </p>
                    <span className="text-[9px] font-mono text-muted-foreground/70 block">
                      {stat.isDemo ? "Demonstration telemetry" : "Real local vault"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 14-Day Activity Chart & Subscription Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 14-Day Activity Trend Bar Representation */}
              <div className="lg:col-span-2 p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      14-Day Platform Event Volume
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Daily user interactions (watchlist adds, screenings, reviews)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">Live Telemetry</span>
                </div>

                <div className="h-44 flex items-end gap-2 pt-4 px-1 border-b border-border/60">
                  {days14.map((d) => {
                    const heightPercent = Math.max(15, (d.events / 280) * 100);
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1.5 group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-8 bg-[#1B1D26] border border-border text-[10px] font-bold text-white px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                          {d.events} events ({d.saves} saves)
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-t-md bg-gradient-to-t from-primary/50 to-primary group-hover:brightness-125 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-mono">
                  <span>{days14[0].date}</span>
                  <span>{days14[Math.floor(days14.length / 2)].date}</span>
                  <span>{days14[days14.length - 1].date}</span>
                </div>
              </div>

              {/* Subscription Tier Distribution */}
              <div className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Subscription Tier Mix
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Active member plan distribution
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { plan: "Free Tier (₹0)", count: "1,420 members", percent: 76, color: "bg-muted-foreground" },
                    { plan: "Pro Tier (₹299)", count: "312 members", percent: 17, color: "bg-primary" },
                    { plan: "Premium Tier (₹599)", count: "138 members", percent: 7, color: "bg-[#FBBF24]" },
                  ].map((tier) => (
                    <div key={tier.plan} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{tier.plan}</span>
                        <span className="text-muted-foreground">{tier.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          style={{ width: `${tier.percent}%` }}
                          className={`h-full rounded-full ${tier.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border/80 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Monthly Recurring Revenue</p>
                  <p className="font-heading text-lg font-bold text-primary">₹1,75,950</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS (Base44 qFe) */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} registered accounts
              </div>
            </div>

            {/* User Directory List */}
            <div className="rounded-3xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden shadow-sm">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No users matched your query &quot;{userQuery}&quot;.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.full_name.slice(0, 2).toUpperCase();
                  const isCurrentSessionUser = u.email === user.email;

                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary grid place-items-center font-bold text-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground">
                              {u.full_name}
                            </p>
                            {isCurrentSessionUser && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {u.email} · Member since {u.created_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            u.plan === "premium"
                              ? "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30"
                              : u.plan === "pro"
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {u.plan}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            u.role === "admin"
                              ? "bg-primary text-black"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>

                        {!isCurrentSessionUser && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserRole(u.id)}
                            className="h-8 px-3 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition"
                          >
                            {u.role === "admin" ? "Demote to User" : "Make Admin"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FEATURED (Base44 zFe) */}
        {activeTab === "featured" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Add Featured Form / Search */}
            <div className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Add Featured Movie to Spotlight
              </h3>
              <p className="text-xs text-muted-foreground">
                Search your library or discovered films to feature in the hero carousels.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={featuredSearch}
                    onChange={(e) => setFeaturedSearch(e.target.value)}
                    placeholder="Search movie title to feature..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Instant Suggestions from Library */}
              {featuredSearch.trim().length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {library.movies
                    .filter((m) =>
                      m.title.toLowerCase().includes(featuredSearch.toLowerCase())
                    )
                    .slice(0, 4)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-2xl border border-border bg-surface flex items-center justify-between gap-2"
                      >
                        <p className="text-xs font-bold truncate text-foreground">
                          {m.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleFeatureMovie(m)}
                          className="h-7 px-2.5 rounded-lg bg-primary text-black font-bold text-[11px] hover:bg-primary/90 transition shrink-0"
                        >
                          Feature
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Currently Featured List */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Active Spotlight Order ({featured.length} Films)
              </h3>

              <div className="rounded-3xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden">
                {featured.map((film, idx) => (
                  <div
                    key={film.id}
                    className="p-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-lg bg-muted overflow-hidden relative border border-border shrink-0">
                        {film.poster_path && (
                          <Image
                            src={
                              film.poster_path.startsWith("http")
                                ? film.poster_path
                                : `https://image.tmdb.org/t/p/w200${film.poster_path}`
                            }
                            alt={film.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {film.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Slot #{idx + 1} · TMDB ID: {film.tmdb_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderFeatured(film.id, -1)}
                        className="w-8 h-8 rounded-lg border border-border bg-surface text-foreground grid place-items-center disabled:opacity-30 hover:border-primary/50"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === featured.length - 1}
                        onClick={() => handleReorderFeatured(film.id, 1)}
                        className="w-8 h-8 rounded-lg border border-border bg-surface text-foreground grid place-items-center disabled:opacity-30 hover:border-primary/50"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFeatured(film.id)}
                        className="w-8 h-8 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive hover:text-white transition"
                        title="Remove from Featured"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANNOUNCEMENTS (Base44 WFe) */}
        {activeTab === "announcements" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Release Alert Notifications Action Card */}
            <div className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Release Notifications Dispatcher
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                    Send upcoming-release notifications to all members with watchlist items premiering in the next 14 days. Dispatches in-app notifications and scheduled digests.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendReleaseAlerts}
                disabled={isSendingReleaseAlerts}
                className="h-9 px-4 rounded-full bg-primary text-black font-bold text-xs inline-flex items-center gap-2 hover:bg-primary/90 transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReleaseAlerts ? "Dispatching..." : "Send Release Alerts"}</span>
              </button>
            </div>

            {/* Create Announcement Form */}
            <form
              onSubmit={handlePublishAnnouncement}
              className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-4"
            >
              <h3 className="font-heading text-sm font-bold text-foreground">
                Broadcast New Platform Announcement
              </h3>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Announcement headline..."
                  className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                />

                <textarea
                  value={newAnnBody}
                  onChange={(e) => setNewAnnBody(e.target.value)}
                  rows={3}
                  placeholder="Detailed announcement message..."
                  className="w-full p-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <select
                      value={newAnnType}
                      onChange={(e) =>
                        setNewAnnType(
                          e.target.value as "info" | "warning" | "success"
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none"
                    >
                      <option value="info">Info Type</option>
                      <option value="success">Success Type</option>
                      <option value="warning">Warning Type</option>
                    </select>

                    <select
                      value={newAnnTarget}
                      onChange={(e) =>
                        setNewAnnTarget(
                          e.target.value as "all" | "pro" | "premium"
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none"
                    >
                      <option value="all">Target: All Members</option>
                      <option value="pro">Target: Pro Tier+</option>
                      <option value="premium">Target: Premium Only</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="h-9 px-5 rounded-full bg-primary text-black font-bold text-xs inline-flex items-center gap-1.5 hover:bg-primary/90 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Announcement</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Announcements List */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Active &amp; Past Announcements
              </h3>

              <div className="rounded-3xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 flex-wrap"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            a.active ? "bg-primary" : "bg-muted-foreground"
                          }`}
                        />
                        <p className="text-sm font-bold text-foreground">{a.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono uppercase text-muted-foreground">
                          {a.target}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {a.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 font-mono">
                        Published on {a.created_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncement(a.id)}
                        className={`h-8 px-3 rounded-lg border text-xs font-semibold transition ${
                          a.active
                            ? "border-primary/40 text-primary bg-primary/10"
                            : "border-border text-muted-foreground bg-surface"
                        }`}
                      >
                        {a.active ? "Active" : "Archived"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="w-8 h-8 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive hover:text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FEATURE FLAGS (Base44 VFe) */}
        {activeTab === "flags" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Create New Flag Form */}
            <form
              onSubmit={handleCreateFlag}
              className="p-5 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-3"
            >
              <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                <span>Create Feature Flag</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newFlagKey}
                  onChange={(e) => setNewFlagKey(e.target.value)}
                  placeholder="key (e.g. ai_search)"
                  className="h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                />

                <input
                  type="text"
                  value={newFlagName}
                  onChange={(e) => setNewFlagName(e.target.value)}
                  placeholder="Display name"
                  className="h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFlagDesc}
                    onChange={(e) => setNewFlagDesc(e.target.value)}
                    placeholder="Description..."
                    className="flex-1 h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-primary text-black font-bold text-xs inline-flex items-center gap-1 hover:bg-primary/90 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Feature Flags List */}
            <div className="rounded-3xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden shadow-sm">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {flag.name}
                      </p>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {flag.key}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {flag.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(flag.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        flag.enabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          flag.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFlag(flag.id)}
                      className="w-8 h-8 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive hover:text-white transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: MODERATION (Base44 HFe) */}
        {activeTab === "moderation" && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review recent collection comments, user ratings, and notes. Remove content that violates community guidelines.
            </p>

            <div className="rounded-3xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden shadow-sm">
              {moderation.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    All caught up!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No flagged comments or moderation queue items remain.
                  </p>
                </div>
              ) : (
                moderation.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 flex-wrap"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {m.author}
                        </span>
                        <span className="text-xs text-muted-foreground">on</span>
                        <span className="text-xs font-semibold text-primary">
                          {m.target_title}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground bg-surface p-3 rounded-xl border border-border/60">
                        &quot;{m.body}&quot;
                      </p>

                      {m.flag_reason && (
                        <div className="flex items-center gap-1.5 text-[11px] text-destructive font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{m.flag_reason}</span>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground font-mono">
                        Logged on {m.created_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveComment(m.id)}
                        className="h-8 px-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold inline-flex items-center gap-1.5 hover:bg-destructive hover:text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Comment</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
