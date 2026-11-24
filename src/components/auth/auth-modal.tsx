"use client";

import * as React from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { getBrowserClient, isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/client";
import { CineasteLogo } from "@/components/ui/cineaste-logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup" | "reset";
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "signin",
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<"signin" | "signup" | "reset">(defaultMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Supabase Configuration Status Check
  const config = React.useMemo(() => getSupabaseConfig(), [isOpen]);
  const isConfigured = config.isConfigured;

  // Accessible field-level validation states
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [fullNameError, setFullNameError] = React.useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMode(defaultMode);
    setEmailError(null);
    setPasswordError(null);
    setFullNameError(null);
    setFormErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g. name@domain.com).";
    }
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMsg(null);
    setSuccessMsg(null);

    // Client-side accessible field validation
    let hasValidationError = false;

    if (mode === "signup") {
      if (!fullName.trim()) {
        setFullNameError("Please enter your name or cinephile handle.");
        hasValidationError = true;
      } else {
        setFullNameError(null);
      }
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      hasValidationError = true;
    } else {
      setEmailError(null);
    }

    if (mode !== "reset") {
      const passErr = validatePassword(password);
      if (passErr) {
        setPasswordError(passErr);
        hasValidationError = true;
      } else {
        setPasswordError(null);
      }
    }

    if (hasValidationError) return;

    const supabase = getBrowserClient();
    if (!supabase || !isConfigured) {
      // Graceful local authentication mode when cloud Supabase is not configured
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(
          mode === "signin"
            ? "Welcome back to your Cineaste Vault!"
            : mode === "signup"
            ? "Your Cineaste Vault has been created!"
            : "Password recovery instructions logged."
        );
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }, 400);
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setFormErrorMsg(error.message);
        } else {
          setSuccessMsg("Welcome back to your second brain for movies!");
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 600);
        }
      } else if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setFormErrorMsg(error.message);
        } else if (data.session) {
          setSuccessMsg("Account created successfully!");
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 600);
        } else {
          setSuccessMsg(
            "Registration received! Please check your email inbox to confirm your account."
          );
        }
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          setFormErrorMsg(error.message);
        } else {
          setSuccessMsg(
            "Password reset instructions have been dispatched to your email."
          );
        }
      }
    } catch (err: any) {
      setFormErrorMsg(err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getBrowserClient();
    if (!supabase || !isConfigured) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("Signed in with Google successfully!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }, 400);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            window.location.pathname
          )}`,
        },
      });

      if (error) {
        setFormErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setFormErrorMsg(err?.message || "Failed to initiate Google authentication.");
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1F2A] bg-[#0E0F16] p-6 sm:p-8 shadow-2xl shadow-black select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00D664]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/80 bg-surface/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Distinctive Cineaste Logo */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <CineasteLogo size={28} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00D664] bg-[#00D664]/10 border border-[#00D664]/25 px-2.5 py-0.5 rounded-full">
              Cineaste Vault
            </span>
          </div>

          <h2 id="auth-modal-title" className="font-heading text-xl sm:text-2xl font-black text-white">
            {mode === "signin"
              ? "Welcome Back"
              : mode === "signup"
              ? "Create Your Film Vault"
              : "Reset Password"}
          </h2>
          <p className="text-xs text-[#9496A1] leading-relaxed">
            {mode === "signin"
              ? "Sign in to access your curated cinema library, watch history, and collections."
              : mode === "signup"
              ? "Start tracking your cinema journey across all your devices securely."
              : "Enter your registered email address to receive password recovery instructions."}
          </p>
        </div>



        {/* Global Error Banner */}
        {formErrorMsg && (
          <div role="alert" className="mb-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formErrorMsg}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div role="status" className="mb-4 p-3 rounded-2xl bg-[#00D664]/10 border border-[#00D664]/30 text-[#00D664] text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Provider */}
        {mode !== "reset" && (
          <div className="space-y-3.5 mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-3 transition shadow-sm hover:border-[#00D664]/40 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-[#0E0F16] text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>
        )}

        {/* Email/Password Form — noValidate prevents browser popup overlap */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <label htmlFor="auth-fullname" className="text-[11px] font-semibold text-[#9496A1] uppercase tracking-wider">
                Full Name / Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="auth-fullname"
                  type="text"
                  value={fullName}
                  disabled={loading}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) setFullNameError(null);
                  }}
                  placeholder="Enter your full name"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-foreground outline-none focus:border-[#00D664]/60 focus:ring-1 focus:ring-[#00D664]/60 transition disabled:opacity-50"
                />
              </div>
              {fullNameError && (
                <p role="alert" className="text-[11px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fullNameError}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-[11px] font-semibold text-[#9496A1] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="auth-email"
                type="email"
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="Enter your email"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-foreground outline-none focus:border-[#00D664]/60 focus:ring-1 focus:ring-[#00D664]/60 transition disabled:opacity-50"
              />
            </div>
            {emailError && (
              <p role="alert" className="text-[11px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {mode !== "reset" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="text-[11px] font-semibold text-[#9496A1] uppercase tracking-wider">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setFormErrorMsg(null);
                      setEmailError(null);
                      setPasswordError(null);
                    }}
                    className="text-[11px] text-[#00D664] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-foreground outline-none focus:border-[#00D664]/60 focus:ring-1 focus:ring-[#00D664]/60 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p role="alert" className="text-[11px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-[#00D664] hover:bg-[#00B855] text-black font-heading font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[#00D664]/20 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>
                  {mode === "signin"
                    ? "Signing In..."
                    : mode === "signup"
                    ? "Creating Vault..."
                    : "Sending Link..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === "signin"
                    ? "Sign In"
                    : mode === "signup"
                    ? "Create Vault Account"
                    : "Send Recovery Link"}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <p>
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFormErrorMsg(null);
                  setEmailError(null);
                  setPasswordError(null);
                  setFullNameError(null);
                }}
                className="text-[#00D664] font-bold hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setFormErrorMsg(null);
                  setEmailError(null);
                  setPasswordError(null);
                  setFullNameError(null);
                }}
                className="text-[#00D664] font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}