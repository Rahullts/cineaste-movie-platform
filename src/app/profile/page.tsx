"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Film,
  Bookmark,
  CheckCircle2,
  Heart,
  FolderHeart,
  Clock,
  Camera,
  Star,
  Trophy,
  TrendingUp,
  Crown,
  CreditCard,
  ArrowRight,
  Save,
  Check,
  Settings as SettingsIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useUser, CINEASTE_PLANS } from "@/lib/user-context";
import { useLibrary } from "@/lib/library-store";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Original Base44 genres list (qNe)
const GENRE_OPTIONS = [
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Horror",
  "Animation",
  "Documentary",
  "Crime",
  "Fantasy",
  "Mystery",
];

export default function ProfilePage() {
  const { user, updateProfile } = useUser();
  const library = useLibrary();

  // Form states
  const [displayName, setDisplayName] = React.useState(user.display_name || "");
  const [handle, setHandle] = React.useState(user.handle || "");
  const [bio, setBio] = React.useState(user.bio || "");
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatar_url || "");
  const [favoriteGenres, setFavoriteGenres] = React.useState<string[]>(
    user.favorite_genres || []
  );
  const [isSavedNotice, setIsSavedNotice] = React.useState(false);

  React.useEffect(() => {
    setDisplayName(user.display_name || "");
    setHandle(user.handle || "");
    setBio(user.bio || "");
    setAvatarUrl(user.avatar_url || "");
    setFavoriteGenres(user.favorite_genres || []);
  }, [user]);

  // Real library statistics calculated strictly from actual stored metadata
  const totalSaved = library.movies.filter((m) => (m.status || "want") === "want").length;
  const watchedFilms = library.movies.filter((m) => m.status === "watched");
  const totalWatched = watchedFilms.length;
  const totalFavorites = library.movies.filter((m) => Boolean(m.is_favorite)).length;
  const totalCollections = library.collections.length;
  const watchedWithRuntime = watchedFilms.filter(
    (m) => typeof m.runtime === "number" && m.runtime > 0
  );
  const totalMinutes = watchedWithRuntime.reduce(
    (acc, m) => acc + (m.runtime || 0),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);

  // Original Base44 achievements calculation (zNe)
  const achievements = [
    {
      id: "first_film",
      label: "First film",
      desc: "Watched your first film",
      icon: Film,
      unlocked: totalWatched >= 1,
      metric: `${Math.min(totalWatched, 1)} / 1`,
    },
    {
      id: "getting_into_it",
      label: "Getting into it",
      desc: "10 films watched",
      icon: TrendingUp,
      unlocked: totalWatched >= 10,
      metric: `${Math.min(totalWatched, 10)} / 10`,
    },
    {
      id: "cinephile",
      label: "Cinephile",
      desc: "50 films watched",
      icon: Trophy,
      unlocked: totalWatched >= 50,
      metric: `${Math.min(totalWatched, 50)} / 50`,
    },
    {
      id: "curator",
      label: "Curator",
      desc: "Created a collection",
      icon: FolderHeart,
      unlocked: totalCollections >= 1,
      metric: `${Math.min(totalCollections, 1)} / 1`,
    },
    {
      id: "centurion",
      label: "Centurion",
      desc: "100 films watched",
      icon: Crown,
      unlocked: totalWatched >= 100,
      metric: `${Math.min(totalWatched, 100)} / 100`,
    },
  ];

  const handleToggleGenre = (genre: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // If authenticated to Supabase, persist directly to 'avatars' storage bucket
    const supabase = getBrowserClient();
    if (supabase && isSupabaseConfigured && user.id && !user.id.startsWith("guest-")) {
      try {
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (!uploadErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath);
          if (publicUrl) {
            setAvatarUrl(publicUrl);
          }
        }
      } catch (err) {
        console.warn("Storage upload failed, falling back to local:", err);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      display_name: displayName.trim(),
      handle: handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      favorite_genres: favoriteGenres,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const planInfo = CINEASTE_PLANS[user.subscription.plan] || CINEASTE_PLANS.free;
  const userInitials = (displayName || user.email || "U").slice(0, 1).toUpperCase();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <AppShell>
      {/* Fullscreen Desktop / Laptop Container (Seamless borderless layout) */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-8 select-none pb-32">
        {/* Top Header — Clean Borderless Cinematic Presentation with Direct Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <User className="w-7 h-7 text-[#00D878] shrink-0" />
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
                Profile
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00D878]/10 text-[#00D878] font-bold font-mono">
                Personal Identity
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#9496A1] max-w-2xl">
              How you appear across Cineaste, your taste profile, achievements, and personal cinema vault identity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/settings"
              className="h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white hover:text-[#00D878] transition inline-flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <SettingsIcon className="w-4 h-4 text-[#9496A1] group-hover:text-[#00D878] transition-colors" />
              <span>Settings</span>
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

        {/* 1. Profile Hero & Live Film Stats Ribbon (Seamless Borderless Surface) */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00D878]/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

          {/* Avatar with Camera upload button */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white/[0.05] grid place-items-center text-3xl font-heading font-black text-white shadow-2xl">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>

            <label
              htmlFor="avatar-upload"
              title="Upload new avatar"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00D878] text-black grid place-items-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* User Information & Live Stats */}
          <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="font-heading text-xl sm:text-2xl font-black text-white">
                  {displayName || "Film Enthusiast"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00D878]/15 text-[#00D878]">
                  {planInfo.name}
                </span>
                {user.role === "admin" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400">
                    Administrator
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#9496A1] mt-0.5">
                @{handle || "guest"}{user.email ? ` • ${user.email}` : " • Local Session"}
              </p>
              {user.member_since && (
                <p className="text-[11px] text-[#9496A1]/70 font-mono mt-0.5">
                  Member since {user.member_since}
                </p>
              )}
            </div>

            {bio && (
              <p className="text-xs sm:text-sm text-[#F3F4F6] italic max-w-2xl leading-relaxed pt-1">
                &quot;{bio}&quot;
              </p>
            )}

            {/* Live Library Metric Ribbon (Seamless pills, no borders) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-white font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D878]" />
                <span className="font-bold">{totalWatched}</span>
                <span className="text-[#9496A1]">watched</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-white font-mono">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold">{totalSaved}</span>
                <span className="text-[#9496A1]">saved</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-white font-mono">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold">{totalFavorites}</span>
                <span className="text-[#9496A1]">favorites</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-white font-mono">
                <FolderHeart className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">{totalCollections}</span>
                <span className="text-[#9496A1]">collections</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-white font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">
                  {totalMinutes > 0 ? `${totalHours}h` : watchedFilms.length > 0 ? "Pending" : "0h"}
                </span>
                <span className="text-[#9496A1]">
                  {totalMinutes > 0 && watchedWithRuntime.length < watchedFilms.length
                    ? `(${watchedWithRuntime.length}/${watchedFilms.length})`
                    : "screen time"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cohesive Two-Column Fullscreen Desktop & Laptop Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* Left Column: Edit Profile & Cinema Taste Preferences (7 or 8 columns on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <form
              onSubmit={handleSave}
              className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
                    Edit Profile Information
                  </h2>
                  <p className="text-xs text-[#9496A1]">
                    Update your public handle, personal bio, and cinema taste preferences.
                  </p>
                </div>
                {isSavedNotice && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D878] bg-[#00D878]/15 px-3 py-1 rounded-full animate-fadeIn">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Profile Saved</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9496A1]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full h-11 rounded-xl bg-white/[0.05] focus:bg-white/[0.08] px-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#00D878] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9496A1]">
                    Username / Handle
                  </label>
                  <div className="flex items-center rounded-xl bg-white/[0.05] focus-within:bg-white/[0.08] px-3.5 focus-within:ring-1 focus-within:ring-[#00D878] transition">
                    <span className="text-[#9496A1] text-sm select-none">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) =>
                        setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                      }
                      placeholder="username"
                      className="flex-1 h-11 px-1 bg-transparent text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#9496A1]">
                  Cinema Bio &amp; Taste Note
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A line about your taste, favorite eras, or cinephile obsession…"
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.05] focus:bg-white/[0.08] p-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#00D878] transition resize-y"
                />
              </div>

              {/* Favorite Genres (Interactive tag selector, borderless) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9496A1]">
                    Favorite Cinema Genres
                  </label>
                  <span className="text-[11px] font-mono text-[#00D878]">
                    {favoriteGenres.length} selected
                  </span>
                </div>
                <p className="text-xs text-[#9496A1]">
                  Select the genres that define your cinematic palate across recommendations and discovery.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = favoriteGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#00D878] text-black font-bold shadow-md shadow-[#00D878]/20"
                            : "bg-white/[0.05] text-[#9496A1] hover:text-white hover:bg-white/[0.09]"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#00D878] text-black font-bold text-xs inline-flex items-center gap-2 hover:bg-[#00B855] active:scale-95 transition shadow-lg shadow-[#00D878]/25 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Vault Membership & Achievements (4 or 5 columns on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Vault Membership Overview Surface */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
                    <CreditCard className="w-4 h-4 text-[#00D878]" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">
                      Vault Membership
                    </h3>
                    <p className="text-[11px] text-[#9496A1]">
                      Tier &amp; archive limits
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#00D878] font-bold uppercase tracking-wider">
                  {user.subscription.status}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-heading font-black text-lg text-white">
                    {planInfo.name} Plan
                  </span>
                  <span className="text-xs font-mono text-[#00D878] font-bold">
                    ₹{planInfo.price}/mo
                  </span>
                </div>
                <p className="text-xs text-[#9496A1] leading-relaxed">
                  {user.subscription.plan === "free"
                    ? "Standard personal film archive with up to 3 collections and full TMDB tracking."
                    : "Full premium cinema access with unlimited custom collections and AI discovery."}
                </p>
              </div>

              <Link
                href="/billing"
                className="w-full h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
              >
                <span>Manage Subscription &amp; Plans</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00D878]" />
              </Link>
            </div>

            {/* Achievements & Milestones List */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 grid place-items-center text-amber-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">
                      Milestones
                    </h3>
                    <p className="text-[11px] text-[#9496A1]">
                      Cinephile journey badges
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#00D878] font-bold">
                  {unlockedCount} / {achievements.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {achievements.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-2xl transition-all flex items-center gap-3 ${
                        ach.unlocked
                          ? "bg-[#00D878]/10"
                          : "bg-white/[0.02] opacity-55"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                          ach.unlocked
                            ? "bg-[#00D878]/20 text-[#00D878]"
                            : "bg-white/5 text-[#9496A1]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-heading font-bold text-xs text-white truncate">
                            {ach.label}
                          </p>
                          <span className="text-[10px] font-mono text-[#9496A1]">
                            {ach.metric}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9496A1] leading-tight line-clamp-1">
                          {ach.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
