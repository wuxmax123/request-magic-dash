
CREATE TABLE public.shipping_markup_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code text NOT NULL UNIQUE,
  country_name_cn text NOT NULL,
  country_name_en text NOT NULL,
  markup_percentage numeric NOT NULL DEFAULT 0,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_markup_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shipping markup rules" ON public.shipping_markup_rules FOR ALL USING (has_role(auth.uid(), 'admin'::text));
CREATE POLICY "Anyone can read shipping markup rules" ON public.shipping_markup_rules FOR SELECT USING (true);

-- Insert top 10 countries + others
INSERT INTO public.shipping_markup_rules (country_code, country_name_cn, country_name_en, markup_percentage, sort) VALUES
('US', '美国', 'United States', 15, 1),
('GB', '英国', 'United Kingdom', 15, 2),
('DE', '德国', 'Germany', 15, 3),
('FR', '法国', 'France', 15, 4),
('AU', '澳大利亚', 'Australia', 15, 5),
('CA', '加拿大', 'Canada', 15, 6),
('JP', '日本', 'Japan', 15, 7),
('KR', '韩国', 'South Korea', 15, 8),
('SG', '新加坡', 'Singapore', 15, 9),
('AE', '阿联酋', 'UAE', 15, 10),
('OTHERS', '其他国家', 'Others', 20, 99);
