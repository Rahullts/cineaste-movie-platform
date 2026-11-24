"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Check,
  ShieldCheck,
  ArrowRight,
  Info,
  UserCheck,
  Settings as SettingsIcon,
  Crown,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useUser, CINEASTE_PLANS } from "@/lib/user-context";
import type { SubscriptionPlanId } from "@/types";

export default function BillingPage() {
  const { user, updateSubscription } = useUser();
  const currentPlan = user.subscription.plan || "free";
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const planOrder: SubscriptionPlanId[] = ["free", "pro", "premium"];

  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    if (planId === currentPlan) return;

    if (planId === "free") {
      if (
        confirm(
          "Are you sure you want to downgrade to the Free plan? Premium features will expire at the end of your billing cycle."
        )
      ) {
        updateSubscription({
          plan: "free",
          status: "canceled",
          canceled_at: new Date().toISOString(),
        });
        setNotice({
          text: "Your subscription has been switched to the Free plan.",
          type: "info",
        });
      }
      return;
    }

    // Attempt Stripe checkout workflow
    setActiveAction(planId);
    setTimeout(() => {
      setActiveAction(null);
      setNotice({
        text: `Stripe checkout for ${CINEASTE_PLANS[planId].name} requires production Stripe credentials. Live payment gateway is securely protected.`,
        type: "info",
      });
    }, 600);
  };

  const handleManageStripe = () => {
    if (user.subscription.stripe_customer_id) {
      alert("Redirecting to Stripe Customer Portal...");
    } else {
      setNotice({
        text: "Stripe customer portal is available when an active Stripe payment method is registered.",
        type: "info",
      });
    }
  };

  return (
    <AppShell>
      {/* Fullscreen Desktop / Laptop Container (Seamless borderless layout) */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-8 select-none pb-32">
        {/* Top Header — Clean Borderless Cinematic Presentation with Direct Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-[#00D878] shrink-0" />
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
                Billing &amp; Subscription
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00D878]/10 text-[#00D878] font-bold font-mono">
                Vault Membership
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#9496A1] max-w-2xl">
              Manage your personal Cineaste tier, payment methods, archive limits, and billing history.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/profile"
              className="h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white hover:text-[#00D878] transition inline-flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <UserCheck className="w-4 h-4 text-[#9496A1] group-hover:text-[#00D878] transition-colors" />
              <span>View Profile</span>
            </Link>
            <Link
              href="/settings"
              className="h-10 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white hover:text-[#00D878] transition inline-flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <SettingsIcon className="w-4 h-4 text-[#9496A1] group-hover:text-[#00D878] transition-colors" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Global Notification Banner (Borderless) */}
        {notice && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
              notice.type === "success"
                ? "bg-[#00D878]/15 text-[#00D878]"
                : "bg-blue-500/15 text-blue-300"
            }`}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="font-bold hover:underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Current Active Plan Status Bar (Borderless Seamless Surface) */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#00D878]/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00D878]/15 text-[#00D878] grid place-items-center shrink-0">
              {currentPlan === "premium" ? (
                <Crown className="w-6 h-6 stroke-[2.2]" />
              ) : currentPlan === "pro" ? (
                <Zap className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider font-mono text-[#9496A1]">
                  Active Membership
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#00D878] font-bold uppercase tracking-wider">
                  {user.subscription.status}
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-white mt-0.5">
                {CINEASTE_PLANS[currentPlan].name} Plan
              </h2>
              <p className="text-xs text-[#9496A1] mt-0.5">
                {currentPlan === "free"
                  ? "Standard film vault with basic discovery and up to 3 custom collections."
                  : currentPlan === "pro"
                  ? "Unlimited collections, smart auto-curation, and AI discovery active."
                  : "Complete cinema suite with priority access, shared vaults, and export tools active."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={handleManageStripe}
              className="h-10 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white inline-flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#00D878]" />
              <span>Stripe Portal</span>
            </button>
          </div>
        </div>

        {/* Membership Tiers — Expansive Fullscreen Horizontal Rows (Borderless, NO Columns) */}
        <div className="space-y-4">
          <div className="pb-1">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
              Available Vault Tiers
            </h2>
            <p className="text-xs text-[#9496A1]">
              Select the cinema tier that matches your archiving, discovery, and curation appetite.
            </p>
          </div>

          <div className="space-y-4">
            {planOrder.map((planId) => {
              const plan = CINEASTE_PLANS[planId];
              const isCurrent = planId === currentPlan;
              const isHigher =
                planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);

              return (
                <div
                  key={planId}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-6 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-xl ${
                    isCurrent
                      ? "bg-white/[0.06]"
                      : "bg-white/[0.025] hover:bg-white/[0.045]"
                  }`}
                >
                  {/* Left Section: Tier Identity & Pricing */}
                  <div className="xl:w-72 shrink-0 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-heading text-xl sm:text-2xl font-black text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#00D878] text-black font-mono">
                          Current Plan
                        </span>
                      )}
                      {planId === "pro" && !isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono">
                          Popular
                        </span>
                      )}
                      {planId === "premium" && !isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] font-mono">
                          Ultimate
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#9496A1] leading-relaxed">
                      {plan.tagline}
                    </p>

                    <div className="pt-1 flex items-baseline gap-1.5">
                      <span className="font-heading text-2xl sm:text-3xl font-black text-white">
                        ₹{plan.price}
                      </span>
                      <span className="text-xs text-[#9496A1] font-mono">/month</span>
                    </div>
                  </div>

                  {/* Center Section: Feature Highlights (Flexible horizontal grid) */}
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2.5 text-xs text-[#F3F4F6]">
                          <span className="w-4 h-4 rounded-full bg-[#00D878]/15 text-[#00D878] grid place-items-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span className="leading-tight truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Section: Action Button */}
                  <div className="xl:w-56 shrink-0 flex items-center justify-end pt-2 xl:pt-0">
                    <button
                      type="button"
                      disabled={isCurrent || activeAction === planId}
                      onClick={() => handleSelectPlan(planId)}
                      className={`w-full sm:w-auto xl:w-full h-11 px-6 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrent
                          ? "bg-white/[0.06] text-[#00D878] cursor-default font-mono uppercase tracking-wider"
                          : isHigher
                          ? "bg-[#00D878] text-black hover:bg-[#00B855] shadow-lg shadow-[#00D878]/25 active:scale-95"
                          : "bg-white/[0.06] text-white hover:bg-white/10"
                      }`}
                    >
                      {isCurrent ? (
                        <span>Active Tier</span>
                      ) : activeAction === planId ? (
                        <span>Connecting...</span>
                      ) : planId === "free" ? (
                        <span>Downgrade to Free</span>
                      ) : isHigher ? (
                        <>
                          <span>Upgrade to {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      ) : (
                        <span>Switch Plan</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manage Subscription & Invoices Surface (Borderless) */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#00D878]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                Enterprise-Grade Payment Security
              </h3>
              <p className="text-xs text-[#9496A1]">
                Payment processing, receipts, tax invoices, and cancellation guarantees.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#9496A1] leading-relaxed max-w-4xl">
            All subscriptions are handled through Stripe&apos;s encrypted vault. You can upgrade, downgrade, or cancel at any time. When canceling a paid tier, your features remain accessible until the end of your prepaid billing period with zero penalty fees.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
