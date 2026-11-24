"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { getBrowserClient, getSupabaseConfig } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const config = React.useMemo(() => getSupabaseConfig(), []);
  const isConfigured = config.isConfigured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase || !isConfigured) {
      setErrorMsg(config.error || "Authentication service is unconfigured.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Your password has been successfully updated!");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f4f4f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121316] border border-[#27272a] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#00D664]/10 border border-[#00D664]/30 flex items-center justify-center text-[#00D664]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif tracking-wide text-[#f4f4f5]">
              Reset Password
            </h1>
            <p className="text-xs text-[#a1a1aa]">Cineaste Account Security</p>
          </div>
        </div>

        {/* Configuration Alert (Displayed only when required environment variables are missing) */}
        {!isConfigured && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-400">
                Supabase Configuration Required
              </p>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                {config.error ||
                  "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Please configure them in .env.local to enable password reset."}
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-[#00D664]/15 border border-[#00D664]/30 flex items-center justify-center text-[#00D664] mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-medium text-white mb-2">Password Updated</h2>
            <p className="text-xs text-[#a1a1aa] mb-6">{successMsg}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00D664] text-black font-semibold text-xs hover:bg-[#00b855] transition"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18191d] border border-[#27272a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#00D664]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#18191d] border border-[#27272a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#00D664]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-2.5 mt-2 rounded-xl bg-[#00D664] text-black font-semibold text-xs hover:bg-[#00b855] transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            <div className="pt-4 border-t border-[#27272a]/60 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Cineaste
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
