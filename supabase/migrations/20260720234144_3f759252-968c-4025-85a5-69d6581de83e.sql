
-- 1) Remove Golden Hour triggers and functions
DROP TRIGGER IF EXISTS trg_deal_cards_golden_hour ON public.deal_cards;
DROP TRIGGER IF EXISTS deal_cards_golden_hour ON public.deal_cards;
DROP TRIGGER IF EXISTS trg_deal_cards_expire_prior ON public.deal_cards;
DROP TRIGGER IF EXISTS trg_start_golden_hour_on_reply ON public.deal_cards;
DROP FUNCTION IF EXISTS public.set_golden_hour() CASCADE;
DROP FUNCTION IF EXISTS public.expire_prior_golden_hours() CASCADE;
DROP FUNCTION IF EXISTS public.start_golden_hour_on_reply() CASCADE;

-- 2) Drop Golden Hour columns from deal_cards
ALTER TABLE public.deal_cards DROP COLUMN IF EXISTS golden_hour;
ALTER TABLE public.deal_cards DROP COLUMN IF EXISTS golden_hour_expires_at;

-- 3) Redesign deal_cards fields for the new MVP spec
ALTER TABLE public.deal_cards DROP COLUMN IF EXISTS budget_range;
ALTER TABLE public.deal_cards DROP COLUMN IF EXISTS timeline;

ALTER TABLE public.deal_cards
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS deal_type_other text,
  ADD COLUMN IF NOT EXISTS campaign_description text,
  ADD COLUMN IF NOT EXISTS budget_amount numeric,
  ADD COLUMN IF NOT EXISTS budget_cycle text,
  ADD COLUMN IF NOT EXISTS budget_cycle_other text,
  ADD COLUMN IF NOT EXISTS commitments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commitment_other text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS duration_date date,
  ADD COLUMN IF NOT EXISTS exclusivity text,
  ADD COLUMN IF NOT EXISTS exclusivity_category text,
  ADD COLUMN IF NOT EXISTS why_talent text,
  ADD COLUMN IF NOT EXISTS seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS shared_with_talent_at timestamptz;

-- 4) Remove per-inbox message counters (only inbox_mode remains: 'unlimited' or 'closed')
DROP FUNCTION IF EXISTS public.can_receive_message(uuid, message_category) CASCADE;
DROP FUNCTION IF EXISTS public.get_message_count(uuid, message_category) CASCADE;
ALTER TABLE public.message_limits DROP COLUMN IF EXISTS max_messages;

-- Normalize existing inbox_mode values
UPDATE public.message_limits SET inbox_mode = 'unlimited' WHERE inbox_mode IS NULL OR inbox_mode NOT IN ('closed');

-- 5) Fix complete_referral (used to reward extra messages — no longer applicable)
CREATE OR REPLACE FUNCTION public.complete_referral(_invitee_id uuid, _invite_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _inviter_id UUID;
BEGIN
  SELECT inviter_id INTO _inviter_id
  FROM public.referrals
  WHERE invite_code = _invite_code AND status = 'pending';
  IF _inviter_id IS NULL THEN RETURN false; END IF;

  UPDATE public.referrals
  SET status = 'completed', invitee_id = _invitee_id, completed_at = NOW()
  WHERE invite_code = _invite_code;

  UPDATE public.profiles SET referred_by = _inviter_id WHERE id = _invitee_id;
  RETURN true;
END;
$function$;
