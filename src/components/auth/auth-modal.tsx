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
  Info,
} from "lucide-react";
import { getBrowserClient, getSupabaseConfig } from "@/lib/supabase/client";
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
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [mode, setMode] = React.useState<"signin" | "signup" | "reset">(defaultMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const config = React.useMemo(() => getSupabaseConfig(), [isOpen]);
  const isConfigured = config.isConfigured;

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

  // Sync native <dialog> top-layer state + light-dismiss fallback for browsers without closedby
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {}
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (isOpen) onClose();
    };
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        onClose();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isOpen, onClose]);

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
      setFormErrorMsg(
        "Cloud database is not connected yet. Add your Supabase URL and Anon Key in environment settings to enable cloud sync."
      );
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
          if (
            error.message?.includes("email_not_confirmed") ||
            (error as any).code === "email_not_confirmed"
          ) {
            setFormErrorMsg(
              "Email confirmation is pending. Confirm your email inbox or disable email confirmation in Supabase Authentication Settings."
            );
          } else {
            setFormErrorMsg(error.message);
          }
        } else {
          setSuccessMsg("Signed in successfully. Loading your personal library...");
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
          setSuccessMsg("Registration received. Check your email inbox to confirm your account.");
        }
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          setFormErrorMsg(error.message);
        } else {
          setSuccessMsg("Password recovery instructions have been sent to your email.");
        }
      }
    } catch (err: any) {
      setFormErrorMsg(err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setFormErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getBrowserClient();
    if (!supabase || !isConfigured) {
      setFormErrorMsg(
        "Social authentication requires an active Supabase connection. Please check your environment configuration."
      );
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        window.location.pathname
      )}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setFormErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        try {
          const probe = await fetch(data.url, { method: "GET", redirect: "manual" });
          if (probe.status === 400) {
            const body = await probe.json().catch(() => null);
            if (body?.msg?.includes("Unsupported provider") || body?.code === 400) {
              const name = provider === "google" ? "Google" : "GitHub";
              setFormErrorMsg(
                `${name} sign-in is not yet enabled in Supabase Authentication > Providers (requires Client ID & Secret). Use Email & Password or GitHub meanwhile.`
              );
              setLoading(false);
              return;
            }
          }
        } catch {
          // Proceed when CORS/network blocks probe
        }

        window.location.href = data.url;
      }
    } catch (err: any) {
      setFormErrorMsg(err?.message || `Failed to initiate ${provider} authentication.`);
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      {...({ closedby: "any" } as any)}
      data-testid="auth-modal"
      className="m-auto w-[calc(100%-1.5rem)] max-w-3xl rounded-3xl bg-[#0D0F16] text-[#F3F4F6] p-0 shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop:bg-black/75 backdrop:backdrop-blur-md overflow-hidden select-none border-0"
    >
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Left Editorial Film Stage */}
        <div className="hidden md:flex md:w-[44%] relative flex-col justify-between p-8 bg-gradient-to-br from-[#131826] via-[#0B0D14] to-[#07080D] overflow-hidden">
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00D878]/12 blur-3xl pointer-events-none" />
          <div className="absolute -top-20 right-0 w-48 h-48 rounded-full bg-[#00D878]/8 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <CineasteLogo size={34} showWordmark={true} forceLightWordmark={true} />
          </div>

          <div className="relative z-10 space-y-4 my-auto py-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#00D878] font-medium">
              Personal Cinema Archive
            </p>
            <h3 className="font-serif italic text-3xl leading-[1.15] text-white/95">
              Films worth keeping, organized in one quiet space.
            </h3>
            <p className="text-sm text-[#B4B9C9] leading-relaxed">
              Save watchlists, log screenings, curate personal ratings, and organize collections seamlessly across devices.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs text-[#8D93A8]">
            <span>Synced Watchlist</span>
            <span aria-hidden="true">•</span>
            <span>Private Diary</span>
            <span aria-hidden="true">•</span>
            <span>Collections</span>
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative bg-[#0D0F16]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white grid place-items-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-6">
            <div className="space-y-1.5 pr-10">
              <div className="md:hidden mb-3">
                <CineasteLogo size={30} showWordmark={true} forceLightWordmark={true} />
              </div>
              <h1
                id="auth-modal-title"
                className="font-heading text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-white"
              >
                {mode === "signin"
                  ? "Sign in to Cineaste"
                  : mode === "signup"
                  ? "Create your account"
                  : "Reset your password"}
              </h1>
              <p className="text-[13px] text-[#9FA5B8] leading-relaxed">
                {mode === "signin"
                  ? "Access your saved films, screening dates, and custom shelves."
                  : mode === "signup"
                  ? "Start your personal cinema journal in seconds."
                  : "Enter your account email to receive recovery instructions."}
              </p>
            </div>

            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-relaxed">
                  Cloud auth is not configured in this environment. Set{" "}
                  <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </span>
              </div>
            )}

            {formErrorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-500/12 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{formErrorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3 rounded-xl bg-[#00D878]/12 text-[#4ADE80] text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#00D878]" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("google")}
                    className="h-11 px-4 rounded-xl bg-[#161923] hover:bg-[#1E2230] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("github")}
                    className="h-11 px-4 rounded-xl bg-[#161923] hover:bg-[#1E2230] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="w-full h-px bg-white/10" />
                  <span className="px-3 text-xs text-[#8D93A8] bg-[#0D0F16] shrink-0">
                    or continue with email
                  </span>
                  <div className="w-full h-px bg-white/10" />
                </div>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-fullname" className="text-xs font-medium text-[#B4B9C9] block">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D93A8]" />
                    <input
                      id="auth-fullname"
                      type="text"
                      value={fullName}
                      disabled={loading}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fullNameError) setFullNameError(null);
                      }}
                      placeholder="Your name or handle"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#161923] text-sm text-white placeholder:text-[#6B7186] outline-none focus:ring-2 focus:ring-[#00D878]/60 transition disabled:opacity-50"
                    />
                  </div>
                  {fullNameError && (
                    <p role="alert" className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fullNameError}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-xs font-medium text-[#B4B9C9] block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D93A8]" />
                  <input
                    id="auth-email"
                    type="email"
                    autoFocus
                    value={email}
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#161923] text-sm text-white placeholder:text-[#6B7186] outline-none focus:ring-2 focus:ring-[#00D878]/60 transition disabled:opacity-50"
                  />
                </div>
                {emailError && (
                  <p role="alert" className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {mode !== "reset" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="text-xs font-medium text-[#B4B9C9]">
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
                        className="text-xs text-[#00D878] hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D93A8]" />
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
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#161923] text-sm text-white placeholder:text-[#6B7186] outline-none focus:ring-2 focus:ring-[#00D878]/60 transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D93A8] hover:text-white transition-colors p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p role="alert" className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-1 rounded-xl bg-[#00D878] hover:bg-[#00BF6A] text-black font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[#00D878]/15 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>
                      {mode === "signin"
                        ? "Signing in..."
                        : mode === "signup"
                        ? "Creating account..."
                        : "Sending link..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "signin"
                        ? "Log In"
                        : mode === "signup"
                        ? "Create Account"
                        : "Send Recovery Link"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#9FA5B8]">
            {mode === "signin" ? (
              <p>
                New to Cineaste?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setFormErrorMsg(null);
                    setEmailError(null);
                    setPasswordError(null);
                    setFullNameError(null);
                  }}
                  className="text-[#00D878] font-semibold hover:underline cursor-pointer"
                >
                  Create a free account
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
                  className="text-[#00D878] font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
