"use client";

import * as React from "react";
import type {
  UserProfile,
  UserSettings,
  UserSubscription,
  SubscriptionPlanId,
} from "@/types";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureUserProfileAndPreferences } from "@/lib/supabase/profile-bootstrap";
import { migrateLocalDataToSupabase } from "@/lib/supabase/migration-service";
import { getUserProfileStorageKey } from "@/lib/library-storage";
import { AuthModal } from "@/components/auth/auth-modal";

const processedOAuthCodes = new Set<string>();

function formatAuthErrorMessage(code: string | null, description: string | null): string {
  const normalized = (code || "").toLowerCase();
  if (normalized === "access_denied") {
    return "Google sign-in was cancelled. You can continue browsing or try again.";
  }
  if (normalized === "profile_init_failed") {
    return description
      ? `Signed in, but profile setup failed (${description}).`
      : "Signed in, but profile setup could not complete. Please retry.";
  }
  if (normalized === "oauth_exchange_failed") {
    return "Could not complete Google authentication. Please try signing in again.";
  }
  if (normalized === "missing_auth_code") {
    return "Authentication callback did not receive a valid authorization code.";
  }
  return description || "Authentication could not be completed. Please try again.";
}

const LEGACY_USER_STORAGE_KEY = "cineaste:user_profile:v1";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  accent: "emerald",
  density: "comfortable",
  autoplay_trailers: true,
  rating_system: "stars5",
  region: "IN",
  email_notifications: true,
  push_notifications: true,
  profile_visibility: "friends",
  show_activity: true,
  show_watchlist: true,
  language: "en",
  reduce_motion: false,
  high_contrast: false,
};

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: "free",
  status: "active",
};

const GUEST_USER: UserProfile = {
  id: "guest-cinephile",
  email: "",
  display_name: "Guest Cinephile",
  handle: "guest",
  role: "user",
  avatar_url: "",
  bio: "Curating cinematic moments and discovering timeless cinema.",
  favorite_genres: ["Drama", "Sci-Fi", "Thriller"],
  favorite_languages: ["English"],
  member_since: "Guest Vault",
  subscription: DEFAULT_SUBSCRIPTION,
  settings: DEFAULT_SETTINGS,
};

const ACCENT_MAP: Record<string, { primary: string; hover: string; glow: string }> = {
  emerald: { primary: "#00D664", hover: "#00B855", glow: "rgba(0, 214, 100, 0.25)" },
  crimson: { primary: "#FF4D5A", hover: "#E03644", glow: "rgba(255, 77, 90, 0.25)" },
  indigo: { primary: "#6C9EFF", hover: "#4F85ED", glow: "rgba(108, 158, 255, 0.25)" },
  amber: { primary: "#FBBF24", hover: "#D97706", glow: "rgba(251, 191, 36, 0.25)" },
  cyan: { primary: "#22D3EE", hover: "#06B6D4", glow: "rgba(34, 211, 238, 0.25)" },
  violet: { primary: "#A78BFA", hover: "#8B5CF6", glow: "rgba(167, 139, 250, 0.25)" },
};

export const CINEASTE_PLANS: Record<
  SubscriptionPlanId,
  {
    id: SubscriptionPlanId;
    name: string;
    price: number;
    tagline: string;
    features: string[];
    limits: { collections: number };
  }
> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Everything you need to start tracking films",
    features: [
      "Up to 3 collections",
      "Unlimited watchlist & favorites",
      "Basic search & discovery",
      "Statistics & timeline",
      "Community profile",
    ],
    limits: { collections: 3 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 299,
    tagline: "For serious film lovers",
    features: [
      "Unlimited collections",
      "Smart auto-collections",
      "AI-powered discovery",
      "Advanced filters & streaming search",
      "Weekly movie digest",
      "Full activity history",
    ],
    limits: { collections: Infinity },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 599,
    tagline: "The complete cinema experience",
    features: [
      "Everything in Pro",
      "Priority support",
      "Early access to new features",
      "Shared family collections",
      "Export & API access",
    ],
    limits: { collections: Infinity },
  },
};

interface UserContextValue {
  user: UserProfile;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoaded: boolean;
  authError: string | null;
  clearAuthError: () => void;
  retryProfileSetup: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void> | void;
  updateSubscription: (updates: Partial<UserSubscription>) => Promise<void> | void;
  resetUserData: () => void;
  signOut: () => Promise<void>;
  openAuthModal: (mode?: "signin" | "signup" | "reset") => void;
}

const UserContext = React.createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const syncSeqRef = React.useRef(0);
  const lastSessionKeyRef = React.useRef<string | null>(null);

  // Auth modal management
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"signin" | "signup" | "reset">("signin");

  const openAuthModal = (mode: "signin" | "signup" | "reset" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const clearAuthError = React.useCallback(() => {
    setAuthError(null);
  }, []);

  const syncSessionUser = React.useCallback(
    async (session: any, force: boolean = false) => {
      const supabase = getBrowserClient();

      const loadLocalFallback = () => {
        try {
          const guestKey = getUserProfileStorageKey(null);
          const stored =
            localStorage.getItem(guestKey) ||
            localStorage.getItem(LEGACY_USER_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!parsed?.id || parsed.id === "guest-cinephile") {
              setUser({
                ...GUEST_USER,
                ...parsed,
                subscription: {
                  ...DEFAULT_SUBSCRIPTION,
                  ...(parsed.subscription || {}),
                },
                settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
              });
            } else {
              setUser(GUEST_USER);
            }
          } else {
            setUser(GUEST_USER);
          }
        } catch {
          setUser(GUEST_USER);
        }
        setIsLoaded(true);
      };

      if (!supabase || !isSupabaseConfigured) {
        loadLocalFallback();
        return;
      }

      const sessionKey = session?.user
        ? `${session.user.id}:${session.access_token?.slice(-12) || ""}`
        : "guest";

      if (!force && lastSessionKeyRef.current === sessionKey) {
        return;
      }
      lastSessionKeyRef.current = sessionKey;
      const seq = ++syncSeqRef.current;

      if (!session?.user) {
        setIsAuthenticated(false);
        loadLocalFallback();
        return;
      }

      const uid = session.user.id;
      setIsAuthenticated(true);

      try {
        // Ensure first-time profile and preferences exist idempotently before dashboard renders user data
        const bootstrap = await ensureUserProfileAndPreferences(
          supabase,
          session.user
        );
        if (seq !== syncSeqRef.current) return;

        if (!bootstrap.ok) {
          setAuthError(
            formatAuthErrorMessage("profile_init_failed", bootstrap.error || null)
          );
          setIsLoaded(true);
          return;
        }

        const [{ data: profile }, { data: prefs }, { data: roleRow }, { data: subRow }] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
            supabase
              .from("user_preferences")
              .select("*")
              .eq("user_id", uid)
              .maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
            supabase
              .from("user_subscriptions")
              .select("plan, status")
              .eq("user_id", uid)
              .maybeSingle(),
          ]);

        if (seq !== syncSeqRef.current) return;

        const role: "admin" | "user" = roleRow?.role === "admin" ? "admin" : "user";
        const subscription: UserSubscription = subRow
          ? { plan: subRow.plan as any, status: subRow.status as any }
          : DEFAULT_SUBSCRIPTION;

        const syncedUser: UserProfile = {
          id: uid,
          email: session.user.email || "",
          display_name:
            profile?.display_name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "Cinephile",
          handle: profile?.username || (session.user.email || "user").split("@")[0],
          role,
          avatar_url:
            profile?.avatar_url ||
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            "",
          bio: profile?.bio || "Curating personal cinema memories.",
          favorite_genres: profile?.preferred_genres || [
            "Drama",
            "Sci-Fi",
            "Thriller",
          ],
          favorite_languages: profile?.language ? [profile.language] : ["English"],
          member_since: profile?.member_since || "Member",
          subscription,
          settings: {
            theme: (prefs?.theme as any) || "dark",
            accent: prefs?.accent_color || "emerald",
            density: (prefs?.interface_density as any) || "comfortable",
            autoplay_trailers: prefs?.autoplay_trailers ?? true,
            rating_system: (prefs?.rating_system as any) || "stars5",
            region: prefs?.streaming_region || "IN",
            email_notifications: prefs?.email_notifications ?? true,
            push_notifications: prefs?.push_notifications ?? true,
            profile_visibility: (prefs?.profile_visibility as any) || "friends",
            show_activity: prefs?.show_activity ?? true,
            show_watchlist: prefs?.show_watchlist ?? true,
            language: profile?.language || "en",
            reduce_motion: prefs?.reduce_motion ?? false,
            high_contrast: prefs?.high_contrast ?? false,
          },
        };

        setUser(syncedUser);
        setAuthError(null);

        // Run idempotent local data migration
        migrateLocalDataToSupabase(supabase, uid)
          .then((res) => {
            if (
              res.success &&
              !res.skipped &&
              (res.moviesCount > 0 ||
                res.collectionsCount > 0 ||
                res.activitiesCount > 0)
            ) {
              window.dispatchEvent(new Event("cineaste:library-refresh"));
            }
          })
          .catch((err) => console.error("Migration error:", err));
      } catch (err: any) {
        console.error("Error fetching Supabase user state:", err);
        if (seq === syncSeqRef.current) {
          setAuthError(
            formatAuthErrorMessage(
              "profile_init_failed",
              err?.message || "Unexpected session sync error"
            )
          );
        }
      } finally {
        if (seq === syncSeqRef.current) {
          setIsLoaded(true);
        }
      }
    },
    []
  );

  const retryProfileSetup = React.useCallback(async () => {
    const supabase = getBrowserClient();
    if (!supabase || !isSupabaseConfigured) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await syncSessionUser(session, true);
  }, [syncSessionUser]);

  // Sync Supabase Auth, handle callback query errors cleanly, and initialize profile once
  React.useEffect(() => {
    const supabase = getBrowserClient();

    if (typeof window !== "undefined") {
      try {
        const currentUrl = new URL(window.location.href);
        const qAuthErr =
          currentUrl.searchParams.get("auth_error") ||
          currentUrl.searchParams.get("error");
        const qAuthDesc =
          currentUrl.searchParams.get("auth_error_description") ||
          currentUrl.searchParams.get("error_description");
        const qCode = currentUrl.searchParams.get("code");

        if (qAuthErr || qAuthDesc) {
          setAuthError(formatAuthErrorMessage(qAuthErr, qAuthDesc));
          currentUrl.searchParams.delete("auth_error");
          currentUrl.searchParams.delete("auth_error_description");
          currentUrl.searchParams.delete("error");
          currentUrl.searchParams.delete("error_description");
          window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search + currentUrl.hash);
        }

        // Prevent duplicate code processing if Supabase lands directly on a client route with ?code=
        if (qCode && supabase && isSupabaseConfigured && !processedOAuthCodes.has(qCode)) {
          processedOAuthCodes.add(qCode);
          currentUrl.searchParams.delete("code");
          window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search + currentUrl.hash);
          supabase.auth
            .getSession()
            .then(async ({ data: { session } }) => {
              if (!session) {
                const { error } = await supabase.auth.exchangeCodeForSession(qCode);
                if (error) {
                  const { data: recheck } = await supabase.auth.getSession();
                  if (!recheck.session) {
                    setAuthError(formatAuthErrorMessage("oauth_exchange_failed", error.message));
                  }
                }
              }
            })
            .catch(() => {});
        }
      } catch {}
    }

    if (!supabase || !isSupabaseConfigured) {
      syncSessionUser(null, true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSessionUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const shouldForce =
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED";
      syncSessionUser(session, shouldForce);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSessionUser]);

  // Synchronize CSS custom properties and accessibility attributes with active user settings
  React.useEffect(() => {
    if (typeof window === "undefined" || !user?.settings) return;
    const accentName = user.settings?.accent || "emerald";
    const accent = ACCENT_MAP[accentName] || ACCENT_MAP.emerald;
    document.documentElement.style.setProperty("--primary", accent.primary);
    document.documentElement.style.setProperty("--ring", accent.primary);
    document.documentElement.style.setProperty("--primary-hover", accent.hover);
    document.documentElement.style.setProperty("--primary-glow", accent.glow);

    if (user.settings?.high_contrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (user.settings?.reduce_motion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    if (user.settings?.density === "compact") {
      document.documentElement.setAttribute("data-density", "compact");
    } else {
      document.documentElement.removeAttribute("data-density");
    }
  }, [user?.settings]);

  const saveUserLocal = (updated: UserProfile) => {
    setUser(updated);
    try {
      const uid = isAuthenticated && updated.id && !updated.id.startsWith("guest-") ? updated.id : null;
      localStorage.setItem(getUserProfileStorageKey(uid), JSON.stringify(updated));
      window.dispatchEvent(new Event("cineaste:user-change"));
    } catch {}
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...user, ...updates };
    saveUserLocal(updated);

    const supabase = getBrowserClient();
    if (supabase && isAuthenticated && user.id && !user.id.startsWith("guest-")) {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.display_name !== undefined) payload.display_name = updates.display_name;
      if (updates.handle !== undefined) payload.username = updates.handle;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
      if (updates.favorite_genres !== undefined) payload.preferred_genres = updates.favorite_genres;

      await supabase.from("profiles").update(payload).eq("id", user.id);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const updatedSettings = { ...user.settings, ...updates };
    const updatedUser = { ...user, settings: updatedSettings };
    saveUserLocal(updatedUser);

    const supabase = getBrowserClient();
    if (supabase && isAuthenticated && user.id && !user.id.startsWith("guest-")) {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.theme !== undefined) payload.theme = updates.theme;
      if (updates.accent !== undefined) payload.accent_color = updates.accent;
      if (updates.density !== undefined) payload.interface_density = updates.density;
      if (updates.autoplay_trailers !== undefined) payload.autoplay_trailers = updates.autoplay_trailers;
      if (updates.rating_system !== undefined) payload.rating_system = updates.rating_system;
      if (updates.region !== undefined) payload.streaming_region = updates.region;
      if (updates.email_notifications !== undefined) payload.email_notifications = updates.email_notifications;
      if (updates.push_notifications !== undefined) payload.push_notifications = updates.push_notifications;
      if (updates.profile_visibility !== undefined) payload.profile_visibility = updates.profile_visibility;
      if (updates.show_activity !== undefined) payload.show_activity = updates.show_activity;
      if (updates.show_watchlist !== undefined) payload.show_watchlist = updates.show_watchlist;
      if (updates.reduce_motion !== undefined) payload.reduce_motion = updates.reduce_motion;
      if (updates.high_contrast !== undefined) payload.high_contrast = updates.high_contrast;

      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        ...payload,
      });
    }
  };

  const updateSubscription = (updates: Partial<UserSubscription>) => {
    const updatedSub = { ...user.subscription, ...updates };
    saveUserLocal({ ...user, subscription: updatedSub });
  };

  const resetUserData = () => {
    saveUserLocal(GUEST_USER);
  };

  const signOut = async () => {
    const supabase = getBrowserClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    lastSessionKeyRef.current = "guest";
    setAuthError(null);
    setIsAuthenticated(false);
    setUser(GUEST_USER);
    try {
      localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    } catch {}
    window.location.href = "/dashboard";
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAdmin: user.role === "admin",
        isAuthenticated,
        isLoaded,
        authError,
        clearAuthError,
        retryProfileSetup,
        updateProfile,
        updateSettings,
        updateSubscription,
        resetUserData,
        signOut,
        openAuthModal,
      }}
    >
      {children}
      {authError && (
        <div
          role="alert"
          data-testid="auth-error-banner"
          className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm rounded-2xl bg-popover dark:bg-[#141722] text-foreground shadow-[0_20px_48px_-12px_rgba(0,0,0,0.8)] p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs leading-relaxed text-foreground">{authError}</p>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => retryProfileSetup()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D878] text-[#050608] text-[11px] font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearAuthError}
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAuthError}
            aria-label="Dismiss authentication alert"
            className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
