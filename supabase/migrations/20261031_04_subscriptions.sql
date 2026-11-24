-- ==============================================================================
-- CINEASTE: SUPABASE SUBSCRIPTION MIGRATION 04 - SECURE SUBSCRIPTIONS & STRIPE
-- ==============================================================================
-- Idempotent, non-destructive migration establishing subscription records.
-- Restricts subscription modifications strictly to service-role (Stripe webhooks)
-- and verified admins. Prevents client-side plan escalation.
-- Uses zero-parameter is_admin() and safe existing-table upgrades.
-- ==============================================================================

-- 1. Create Subscriptions Table if not exists
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing-table upgrade: ensures all columns exist if table predated this migration
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Safe non-destructive constraint addition (NOT VALID prevents failure on legacy records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_subscriptions_plan'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT chk_user_subscriptions_plan
      CHECK (plan IN ('free', 'pro', 'premium'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_subscriptions_status'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT chk_user_subscriptions_status
      CHECK (status IN ('active', 'canceled', 'past_due', 'trialing'))
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subs_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_customer_id ON public.user_subscriptions(provider_customer_id);

-- 2. Database Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_set_updated_at_user_subscriptions ON public.user_subscriptions;
CREATE TRIGGER trigger_set_updated_at_user_subscriptions
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Automatic New User Default Free Subscription Trigger
-- Coexists cleanly with handle_new_user() from migration 01
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Restrict execution: trigger functions should not be callable by arbitrary users
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user_subscription() TO postgres, service_role;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- 4. Backfill existing users with free subscriptions if missing
INSERT INTO public.user_subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 5. Optimized Static Subscription Plan Helper
-- Since public.user_subscriptions is now definitively present, update helper with direct query
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT plan, status, current_period_end
  INTO v_plan, v_status, v_period_end
  FROM public.user_subscriptions
  WHERE user_id = auth.uid();

  IF v_plan IS NULL THEN
    RETURN 'free';
  END IF;

  -- 1. Active or trialing: grant current plan
  IF v_status IN ('active', 'trialing') THEN
    RETURN v_plan;
  END IF;

  -- 2. Canceled but still within paid period: grant current plan until current_period_end
  IF v_status = 'canceled' AND v_period_end IS NOT NULL AND v_period_end > timezone('utc'::text, now()) THEN
    RETURN v_plan;
  END IF;

  -- 3. Any other status ('past_due', expired 'canceled', etc.): revert to 'free'
  RETURN 'free';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_plan() TO authenticated, anon;

-- 6. Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- A. Users can view their own subscription status; admins can view all
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- B. Subscriptions can ONLY be modified by service role processes (Stripe Webhook API)
--    or verified platform administrators. Clients cannot grant themselves Pro/Premium.
DROP POLICY IF EXISTS "Only service role or admin can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Only service role or admin can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
