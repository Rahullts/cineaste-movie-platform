import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface AuthUserIdentity {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}

const INTERNAL_BIND_HOSTS = new Set([
  "0.0.0.0",
  "0.0.0.0:10000",
  "localhost:10000",
  "127.0.0.1:10000",
]);

export function isInternalBindHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    INTERNAL_BIND_HOSTS.has(normalized) ||
    normalized.startsWith("0.0.0.0:") ||
    normalized.endsWith(":10000")
  );
}

/**
 * Resolves the browser-facing application origin safely behind reverse proxies
 * (e.g. Render binding internally to localhost:10000) while preserving localhost:3000 locally.
 */
export function resolvePublicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const candidateHost = forwardedHost || hostHeader;

  if (candidateHost && !isInternalBindHost(candidateHost)) {
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const isLocalHost =
      candidateHost.startsWith("localhost") ||
      candidateHost.startsWith("127.0.0.1");
    const proto = forwardedProto || (isLocalHost ? "http" : "https");
    return `${proto}://${candidateHost}`;
  }

  if (
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_EXTERNAL_URL)
  ) {
    const configured =
      process.env.RENDER_EXTERNAL_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://cineaste-cinema.onrender.com";
    try {
      return new URL(configured).origin;
    } catch {
      return "https://cineaste-cinema.onrender.com";
    }
  }

  if (!isInternalBindHost(url.host)) {
    return url.origin;
  }

  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port === "10000" ? "3000" : port}`;
}

export interface ProfileBootstrapResult {
  ok: boolean;
  createdProfile: boolean;
  error?: string;
}

function buildUsernameCandidates(authUser: AuthUserIdentity): string[] {
  const meta = (authUser.user_metadata || {}) as Record<string, any>;
  const shortId = authUser.id.replace(/-/g, "").slice(0, 8) || "member";
  const rawBase =
    (typeof authUser.email === "string" && authUser.email.includes("@")
      ? authUser.email.split("@")[0]
      : "") ||
    (typeof meta.preferred_username === "string" ? meta.preferred_username : "") ||
    (typeof meta.user_name === "string" ? meta.user_name : "") ||
    `cinephile_${shortId.slice(0, 6)}`;

  const cleaned = rawBase.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const base = cleaned || `user_${shortId.slice(0, 6)}`;

  return [
    base,
    `${base}_${shortId.slice(0, 4)}`,
    `${base}_${shortId}`,
    `cinephile_${shortId}_${Date.now().toString(36).slice(-4)}`,
  ];
}

/**
 * Idempotently ensures the authenticated user has both a public.profiles row
 * and a public.user_preferences row before entering the dashboard.
 * Safe against concurrent callbacks, triggers, and repeated sign-ins.
 */
export async function ensureUserProfileAndPreferences(
  supabase: SupabaseClient<Database>,
  authUser: AuthUserIdentity | Pick<User, "id" | "email" | "user_metadata">
): Promise<ProfileBootstrapResult> {
  if (!authUser?.id) {
    return {
      ok: false,
      createdProfile: false,
      error: "Authenticated user ID is missing.",
    };
  }

  const { data: existingProfile, error: profileReadErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileReadErr) {
    return {
      ok: false,
      createdProfile: false,
      error: profileReadErr.message,
    };
  }

  let createdProfile = false;

  if (!existingProfile) {
    const meta = (authUser.user_metadata || {}) as Record<string, any>;
    const candidates = buildUsernameCandidates(authUser);
    const displayName =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta.name === "string" && meta.name.trim()) ||
      (typeof meta.preferred_username === "string" &&
        meta.preferred_username.trim()) ||
      candidates[0] ||
      "Cinephile";
    const avatarUrl =
      (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) ||
      (typeof meta.picture === "string" && meta.picture.trim()) ||
      null;

    let inserted = false;
    let lastError: string | undefined;

    for (const candidateUsername of candidates) {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: authUser.id,
        username: candidateUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      if (!insertErr) {
        inserted = true;
        createdProfile = true;
        break;
      }

      // Unique violation: either another request created this user's profile first
      // or the candidate username belongs to another account.
      if (insertErr.code === "23505") {
        const { data: raceRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authUser.id)
          .maybeSingle();

        if (raceRow) {
          inserted = true;
          break;
        }
        lastError = insertErr.message;
        continue;
      }

      return {
        ok: false,
        createdProfile: false,
        error: insertErr.message,
      };
    }

    if (!inserted) {
      return {
        ok: false,
        createdProfile: false,
        error: lastError || "Unable to create user profile record.",
      };
    }
  }

  const { data: existingPrefs, error: prefsReadErr } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (prefsReadErr) {
    return {
      ok: false,
      createdProfile,
      error: prefsReadErr.message,
    };
  }

  if (!existingPrefs) {
    const { error: prefsUpsertErr } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: authUser.id },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    if (prefsUpsertErr) {
      return {
        ok: false,
        createdProfile,
        error: prefsUpsertErr.message,
      };
    }
  }

  return { ok: true, createdProfile };
}
