
ALTER TABLE public.user_pricing_tiers
  ADD COLUMN shipping_markup_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN first_item_fee_adjustment numeric NOT NULL DEFAULT 0,
  ADD COLUMN additional_item_fee_adjustment numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_pricing_tiers.shipping_markup_percentage IS '运费加价比例 %';
COMMENT ON COLUMN public.user_pricing_tiers.first_item_fee_adjustment IS '首件费用调整（固定金额）';
COMMENT ON COLUMN public.user_pricing_tiers.additional_item_fee_adjustment IS '续件费用调整（固定金额）';
