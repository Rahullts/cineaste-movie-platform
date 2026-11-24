import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const errorParam = searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    console.error("OAuth provider callback error:", errorParam);
    const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`;
    return NextResponse.redirect(`${redirectUrl}?auth_error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Successful OAuth exchange - redirect to original destination
        const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`;
        return NextResponse.redirect(redirectUrl);
      }
      console.error("OAuth code exchange failed:", error.message);
    }
  }

  // Fallback redirect with error query parameter
  return NextResponse.redirect(`${origin}/dashboard?auth_error=oauth_exchange_failed`);
}
