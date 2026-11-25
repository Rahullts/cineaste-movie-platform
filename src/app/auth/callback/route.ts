import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import {
  ensureUserProfileAndPreferences,
  resolvePublicOrigin,
} from "@/lib/supabase/profile-bootstrap";

function sanitizeInternalPath(nextParam: string | null): string {
  if (!nextParam) return "/dashboard";
  const trimmed = nextParam.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  return trimmed;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const publicOrigin = resolvePublicOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const safeNext = sanitizeInternalPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");

  const pendingCookies: {
    name: string;
    value: string;
    options?: Record<string, any>;
  }[] = [];

  const redirectWithCookies = (targetUrl: URL) => {
    const response = NextResponse.redirect(targetUrl.toString());
    response.headers.set("Cache-Control", "no-store, max-age=0");
    for (const c of pendingCookies) {
      response.cookies.set(c.name, c.value, c.options as any);
    }
    return response;
  };

  if (oauthError || oauthErrorDescription) {
    const errTarget = new URL(safeNext, publicOrigin);
    errTarget.searchParams.set("auth_error", oauthError || "oauth_provider_error");
    if (oauthErrorDescription) {
      errTarget.searchParams.set("auth_error_description", oauthErrorDescription);
    }
    return redirectWithCookies(errTarget);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    const errTarget = new URL("/dashboard", publicOrigin);
    errTarget.searchParams.set("auth_error", "supabase_unconfigured");
    return redirectWithCookies(errTarget);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Cookies are still written directly onto NextResponse in redirectWithCookies
        }
      },
    },
  });

  let activeUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  } | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      activeUser = data.user;
    } else {
      // Guard against duplicate callbacks hitting a single-use authorization code:
      // if session cookies were already set on this browser, reuse the existing session.
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        activeUser = userData.user;
      } else {
        console.error("OAuth code exchange failed:", error?.message || "Unknown error");
        const errTarget = new URL("/dashboard", publicOrigin);
        errTarget.searchParams.set("auth_error", "oauth_exchange_failed");
        if (error?.message) {
          errTarget.searchParams.set("auth_error_description", error.message);
        }
        return redirectWithCookies(errTarget);
      }
    }
  } else {
    // Handle direct hits or accidental reloads on /auth/callback without code
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      activeUser = userData.user;
    } else {
      const errTarget = new URL("/dashboard", publicOrigin);
      errTarget.searchParams.set("auth_error", "missing_auth_code");
      return redirectWithCookies(errTarget);
    }
  }

  // Wait for idempotent first-time profile and preferences initialization
  // before redirecting to the dashboard.
  const bootstrap = await ensureUserProfileAndPreferences(supabase, activeUser);
  if (!bootstrap.ok) {
    console.error("User profile initialization failed:", bootstrap.error);
    const errTarget = new URL("/dashboard", publicOrigin);
    errTarget.searchParams.set("auth_error", "profile_init_failed");
    if (bootstrap.error) {
      errTarget.searchParams.set("auth_error_description", bootstrap.error);
    }
    return redirectWithCookies(errTarget);
  }

  return redirectWithCookies(new URL(safeNext, publicOrigin));
}
