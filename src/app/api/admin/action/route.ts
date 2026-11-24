import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase server is not configured in this environment." },
        { status: 503 }
      );
    }

    // 1. Authenticate user from session cookies
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Authentication required to access admin operations." },
        { status: 401 }
      );
    }

    // 2. Independently verify administrator role in database
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleErr || roleRow?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required." },
        { status: 403 }
      );
    }

    // 3. User is verified administrator; process requested action using admin client
    const adminClient = createAdminClient() || supabase;
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing required action" }, { status: 400 });
    }

    let result: any = null;

    switch (action) {
      case "update_role": {
        const { targetUserId, newRole } = payload;
        if (!targetUserId || !newRole || !["admin", "user"].includes(newRole)) {
          return NextResponse.json({ error: "Invalid role payload" }, { status: 400 });
        }

        const { error } = await adminClient
          .from("user_roles")
          .upsert({ user_id: targetUserId, role: newRole }, { onConflict: "user_id" });

        if (error) throw error;

        // Write to immutable audit log
        await adminClient.from("admin_audit_logs").insert({
          admin_user_id: user.id,
          action: "update_role",
          target_type: "user",
          target_id: targetUserId,
          details: { newRole },
        });

        result = { success: true, targetUserId, newRole };
        break;
      }

      case "publish_announcement": {
        const { title, body: annBody, type, target } = payload;
        const { data, error } = await adminClient
          .from("admin_announcements")
          .insert({
            title: title.trim(),
            body: annBody.trim(),
            type: type || "info",
            target: target || "all",
            is_active: true,
          })
          .select("id")
          .single();

        if (error) throw error;

        await adminClient.from("admin_audit_logs").insert({
          admin_user_id: user.id,
          action: "publish_announcement",
          target_type: "announcement",
          target_id: data.id,
          details: { title },
        });

        result = { success: true, id: data.id };
        break;
      }

      case "toggle_flag": {
        const { flagId, enabled } = payload;
        const { error } = await adminClient
          .from("admin_feature_flags")
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq("id", flagId);

        if (error) throw error;

        await adminClient.from("admin_audit_logs").insert({
          admin_user_id: user.id,
          action: "toggle_flag",
          target_type: "feature_flag",
          target_id: flagId,
          details: { enabled },
        });

        result = { success: true };
        break;
      }

      case "feature_movie": {
        const { tmdb_id, title, poster_path, backdrop_path, priority } = payload;
        const { data, error } = await adminClient
          .from("admin_featured_spotlight")
          .upsert(
            {
              tmdb_id,
              title,
              poster_path: poster_path || null,
              backdrop_path: backdrop_path || null,
              priority: priority || 0,
              is_active: true,
            },
            { onConflict: "tmdb_id" }
          )
          .select("id")
          .single();

        if (error) throw error;

        await adminClient.from("admin_audit_logs").insert({
          admin_user_id: user.id,
          action: "feature_movie",
          target_type: "spotlight",
          target_id: data.id,
          details: { title, tmdb_id },
        });

        result = { success: true, id: data.id };
        break;
      }

      case "moderate_comment": {
        const { commentId, status, reason } = payload;
        const { error } = await adminClient
          .from("admin_moderation_records")
          .update({ status })
          .eq("id", commentId);

        if (error) throw error;

        await adminClient.from("admin_audit_logs").insert({
          admin_user_id: user.id,
          action: `moderate_comment_${status}`,
          target_type: "comment",
          target_id: commentId,
          details: { reason },
        });

        result = { success: true };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Admin API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error executing admin action." },
      { status: 500 }
    );
  }
}
