import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  anonKey: string | null;
  missing: ("NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY")[];
  error: string | null;
}

/**
 * Validates whether Supabase environment variables are present and well-formed.
 * Detects placeholder values (e.g. 'YOUR_ACTUAL_PUBLISHABLE_OR_ANON_KEY', 'your-anon-key').
 */
export function getSupabaseConfig(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey =
    (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )?.trim() || "";

  const missing: ("NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY")[] = [];

  const isValidUrl =
    url.length > 0 &&
    url.startsWith("http") &&
    !url.includes("your-project") &&
    !url.includes("placeholder");

  if (!isValidUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  const isValidAnonKey =
    anonKey.length > 20 &&
    !anonKey.includes("YOUR_ACTUAL") &&
    !anonKey.includes("your-anon-key") &&
    !anonKey.includes("placeholder");

  if (!isValidAnonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    return {
      isConfigured: false,
      url: isValidUrl ? url : null,
      anonKey: isValidAnonKey ? anonKey : null,
      missing,
      error: `Supabase authentication is unconfigured. Missing or invalid environment variable(s): ${missing.join(", ")}. Please set a valid anon/publishable key in .env.local.`,
    };
  }

  return {
    isConfigured: true,
    url,
    anonKey,
    missing: [],
    error: null,
  };
}

/**
 * Global flag indicating whether Supabase is configured with valid environment variables.
 */
export const isSupabaseConfigured = Boolean(getSupabaseConfig().isConfigured);

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or retrieves the singleton browser client using @supabase/ssr.
 * Returns null if Supabase is unconfigured, preventing runtime crashes.
 */
export function createClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (browserClient) return browserClient;

  browserClient = createBrowserClient<Database>(config.url, config.anonKey);
  return browserClient;
}

export function getBrowserClient() {
  return createClient();
}
