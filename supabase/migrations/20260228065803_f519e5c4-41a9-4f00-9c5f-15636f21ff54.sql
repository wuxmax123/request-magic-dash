
-- Create user pricing tiers table
CREATE TABLE public.user_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code text NOT NULL UNIQUE,
  tier_name text NOT NULL,
  tier_name_en text,
  markup_percentage numeric NOT NULL DEFAULT 0,
  description text,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Anyone can read pricing tiers"
  ON public.user_pricing_tiers FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage pricing tiers"
  ON public.user_pricing_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add pricing_tier_id to profiles table
ALTER TABLE public.profiles
  ADD COLUMN pricing_tier_id uuid REFERENCES public.user_pricing_tiers(id);

-- Insert default tiers
INSERT INTO public.user_pricing_tiers (tier_code, tier_name, tier_name_en, markup_percentage, sort, description) VALUES
  ('standard', '标准客户', 'Standard', 15, 1, '默认加价比例'),
  ('vip', 'VIP客户', 'VIP', 10, 2, 'VIP客户享受较低加价'),
  ('svip', 'SVIP客户', 'SVIP', 5, 3, '超级VIP客户，最低加价'),
  ('wholesale', '批发客户', 'Wholesale', 8, 4, '批发客户特殊比例');
