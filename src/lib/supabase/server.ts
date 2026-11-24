import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Standard server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 * Strictly uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with session cookie management.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey =
    (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )?.trim();

  const isConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("your-project") &&
      !supabaseUrl.includes("placeholder") &&
      supabaseAnonKey.length > 20 &&
      !supabaseAnonKey.includes("YOUR_ACTUAL") &&
      !supabaseAnonKey.includes("your-anon-key") &&
      !supabaseAnonKey.includes("placeholder")
  );

  if (!isConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored if called from Server Component
        }
      },
    },
  });
}

/**
 * Service Role client for privileged server-side operations (admin verification, audit logging).
 * NEVER expose this to client code or browser bundles. Kept strictly server-side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const isConfigured = Boolean(
    supabaseUrl &&
      serviceRoleKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("your-project") &&
      !supabaseUrl.includes("placeholder") &&
      serviceRoleKey.length > 20 &&
      !serviceRoleKey.includes("YOUR_") &&
      !serviceRoleKey.includes("placeholder")
  );

  if (!isConfigured) {
    return null;
  }

  return createServerClient<Database>(supabaseUrl!, serviceRoleKey!, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
