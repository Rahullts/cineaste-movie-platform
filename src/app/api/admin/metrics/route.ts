import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase server is not configured in this environment." },
        { status: 503 }
      );
    }

    // 1. Verify user session
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify admin role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleRow?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // 3. Query actual database counts
    const [
      { count: usersCount },
      { count: moviesCatalogCount },
      { count: userMoviesCount },
      { count: collectionsCount },
      { count: activitiesCount },
      { data: recentAuditLogs },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("movies").select("*", { count: "exact", head: true }),
      supabase.from("user_movies").select("*", { count: "exact", head: true }),
      supabase.from("collections").select("*", { count: "exact", head: true }),
      supabase.from("movie_activities").select("*", { count: "exact", head: true }),
      supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalRegisteredUsers: usersCount || 0,
        totalCatalogMovies: moviesCatalogCount || 0,
        totalSavedFilms: userMoviesCount || 0,
        totalCollections: collectionsCount || 0,
        totalActivities: activitiesCount || 0,
        recentAuditLogs: recentAuditLogs || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch admin metrics." },
      { status: 500 }
    );
  }
}
