import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase authentication is not configured." },
        { status: 503 }
      );
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Authentication session expired or missing." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const tmdbId = Number(body?.tmdb_id || body?.id);
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!tmdbId || Number.isNaN(tmdbId) || tmdbId <= 0 || !title) {
      return NextResponse.json(
        { error: "Valid tmdb_id and title are required." },
        { status: 400 }
      );
    }

    // 1. Check if film is already cached in public.movies
    const { data: existing } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_id", tmdbId)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ id: existing.id });
    }

    const payload = {
      tmdb_id: tmdbId,
      title,
      original_title:
        typeof body?.original_title === "string" && body.original_title.trim()
          ? body.original_title.trim()
          : title,
      overview: typeof body?.overview === "string" ? body.overview : null,
      poster_path: typeof body?.poster_path === "string" ? body.poster_path : null,
      backdrop_path:
        typeof body?.backdrop_path === "string" ? body.backdrop_path : null,
      release_date:
        typeof body?.release_date === "string" ? body.release_date : null,
      runtime: typeof body?.runtime === "number" ? body.runtime : null,
      vote_average:
        typeof body?.vote_average === "number" ? body.vote_average : null,
      vote_count: typeof body?.vote_count === "number" ? body.vote_count : null,
      genres: body?.genres ?? null,
      metadata_updated_at: new Date().toISOString(),
    };

    // 2. Try SECURITY DEFINER RPC via caller's verified JWT
    const { data: rpcId, error: rpcErr } = await supabase.rpc(
      "ensure_movie_catalog_entry",
      {
        p_tmdb_id: payload.tmdb_id,
        p_title: payload.title,
        p_original_title: payload.original_title,
        p_overview: payload.overview,
        p_poster_path: payload.poster_path,
        p_backdrop_path: payload.backdrop_path,
        p_release_date: payload.release_date,
        p_runtime: payload.runtime,
        p_vote_average: payload.vote_average,
        p_vote_count: payload.vote_count,
        p_genres: payload.genres,
      }
    );

    if (!rpcErr && rpcId) {
      return NextResponse.json({ id: rpcId });
    }

    // 3. Fallback via privileged server-only service role client if configured on server
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data: inserted, error: adminErr } = await adminClient
        .from("movies")
        .upsert(payload, { onConflict: "tmdb_id" })
        .select("id")
        .single();

      if (!adminErr && inserted?.id) {
        return NextResponse.json({ id: inserted.id });
      }
    }

    // 4. Fallback direct insert (works for admin users)
    const { data: directIns, error: directErr } = await supabase
      .from("movies")
      .insert(payload)
      .select("id")
      .single();

    if (!directErr && directIns?.id) {
      return NextResponse.json({ id: directIns.id });
    }

    const message =
      directErr?.message ||
      rpcErr?.message ||
      "Movie catalog insertion is blocked by RLS policy.";
    return NextResponse.json(
      { error: message, code: directErr?.code || rpcErr?.code || "42501" },
      { status: 403 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected catalog error." },
      { status: 500 }
    );
  }
}
