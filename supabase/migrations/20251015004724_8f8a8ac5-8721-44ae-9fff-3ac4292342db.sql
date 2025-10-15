
-- ============================================
-- SHIPPING COST & QUOTATION INTEGRATION MODULE
-- Phase 1: Database Schema & Migration
-- ============================================

-- 1. Create app_role enum for role-based access control
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table for role assignments
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = check_role::app_role
  );
END;
$$;

-- 4. Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_code TEXT NOT NULL UNIQUE,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  country TEXT NOT NULL,
  province TEXT,
  city TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create shipping_carriers table
CREATE TABLE public.shipping_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_code TEXT NOT NULL UNIQUE,
  carrier_name_cn TEXT NOT NULL,
  carrier_name_en TEXT NOT NULL,
  carrier_type TEXT NOT NULL DEFAULT 'express',
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create shipping_channels table
CREATE TABLE public.shipping_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES public.shipping_carriers(id) ON DELETE CASCADE,
  channel_code TEXT NOT NULL UNIQUE,
  channel_name_cn TEXT NOT NULL,
  channel_name_en TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create rate_matrix table
CREATE TABLE public.rate_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.shipping_channels(id) ON DELETE CASCADE,
  destination_country TEXT NOT NULL,
  weight_min_kg NUMERIC(10,2) NOT NULL,
  weight_max_kg NUMERIC(10,2) NOT NULL,
  first_weight_kg NUMERIC(10,2) NOT NULL,
  first_weight_fee NUMERIC(10,2) NOT NULL,
  additional_weight_step_kg NUMERIC(10,2) NOT NULL,
  additional_fee_per_step NUMERIC(10,2) NOT NULL,
  fuel_surcharge_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  estimated_delivery_days_min INTEGER NOT NULL,
  estimated_delivery_days_max INTEGER NOT NULL,
  remote_area_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (weight_min_kg < weight_max_kg),
  CHECK (first_weight_kg > 0),
  CHECK (additional_weight_step_kg > 0),
  CHECK (estimated_delivery_days_min <= estimated_delivery_days_max),
  UNIQUE(warehouse_id, channel_id, destination_country, weight_min_kg, weight_max_kg, effective_from, is_active)
);

-- 8. Create rfq_shipping_quotes table
CREATE TABLE public.rfq_shipping_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  channel_id UUID NOT NULL REFERENCES public.shipping_channels(id),
  destination_country TEXT NOT NULL,
  product_weight_kg NUMERIC(10,2) NOT NULL,
  base_freight NUMERIC(10,2) NOT NULL,
  fuel_surcharge NUMERIC(10,2) NOT NULL,
  remote_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_freight NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  estimated_delivery_days_min INTEGER NOT NULL,
  estimated_delivery_days_max INTEGER NOT NULL,
  calculation_details JSONB,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Update rfqs table with shipping fields
ALTER TABLE public.rfqs 
ADD COLUMN default_warehouse_id UUID REFERENCES public.warehouses(id),
ADD COLUMN include_shipping BOOLEAN NOT NULL DEFAULT false;

-- 10. Create indexes for performance
CREATE INDEX idx_shipping_channels_carrier ON public.shipping_channels(carrier_id);
CREATE INDEX idx_rate_matrix_lookup ON public.rate_matrix(warehouse_id, channel_id, destination_country, weight_min_kg, weight_max_kg) WHERE is_active = true;
CREATE INDEX idx_rate_matrix_active ON public.rate_matrix(is_active);
CREATE INDEX idx_rfq_shipping_quotes_rfq ON public.rfq_shipping_quotes(rfq_id);
CREATE INDEX idx_rfq_shipping_quotes_selected ON public.rfq_shipping_quotes(rfq_id, is_selected) WHERE is_selected = true;

-- 11. Add triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_carriers_updated_at BEFORE UPDATE ON public.shipping_carriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_channels_updated_at BEFORE UPDATE ON public.shipping_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_matrix_updated_at BEFORE UPDATE ON public.rate_matrix
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfq_shipping_quotes_updated_at BEFORE UPDATE ON public.rfq_shipping_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_shipping_quotes ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for warehouses (public read, admin write)
CREATE POLICY "Anyone can read warehouses"
  ON public.warehouses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage warehouses"
  ON public.warehouses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for shipping_carriers (public read, admin write)
CREATE POLICY "Anyone can read carriers"
  ON public.shipping_carriers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage carriers"
  ON public.shipping_carriers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 16. RLS Policies for shipping_channels (public read, admin write)
CREATE POLICY "Anyone can read channels"
  ON public.shipping_channels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON public.shipping_channels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 17. RLS Policies for rate_matrix (public read, admin write)
CREATE POLICY "Anyone can read rate matrix"
  ON public.rate_matrix FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage rate matrix"
  ON public.rate_matrix FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 18. RLS Policies for rfq_shipping_quotes (user-specific)
CREATE POLICY "Users can view shipping quotes for their RFQs"
  ON public.rfq_shipping_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_shipping_quotes.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shipping quotes for their RFQs"
  ON public.rfq_shipping_quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_shipping_quotes.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shipping quotes for their RFQs"
  ON public.rfq_shipping_quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_shipping_quotes.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shipping quotes for their RFQs"
  ON public.rfq_shipping_quotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_shipping_quotes.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- 19. Insert shipping feature module
INSERT INTO public.feature_modules (feature_code, feature_name, feature_name_en, description)
VALUES (
  'shipping',
  '运费计算',
  'Shipping Cost',
  'Automatic shipping cost calculation based on weight and destination'
);

-- 20. Insert feature attributes for shipping
INSERT INTO public.feature_attributes (feature_code, attr_code, attr_name, input_type, required, unit, options_json, help_text, visible_on_quote, attr_sort)
VALUES
  ('shipping', 'origin_warehouse', '发货仓库 Origin Warehouse', 'select', 0, '', '[]', 'Select the warehouse where the product will be shipped from', 1, 1),
  ('shipping', 'shipping_channel', '运输渠道 Shipping Channel', 'select', 0, '', '[]', 'Select the shipping channel and carrier', 1, 2),
  ('shipping', 'shipping_cost', '运费 Shipping Cost', 'number', 0, 'USD', '[]', 'Calculated shipping cost based on weight and destination', 1, 3),
  ('shipping', 'delivery_time', '预计交期 Delivery Time', 'text', 0, 'days', '[]', 'Estimated delivery time range', 1, 4);

-- 21. Insert sample warehouses
INSERT INTO public.warehouses (warehouse_code, name_cn, name_en, country, province, city, address, is_active, sort)
VALUES
  ('SZ001', '深圳仓', 'Shenzhen Warehouse', 'CN', '广东省', '深圳市', '龙岗区坂田街道', true, 1),
  ('GZ001', '广州仓', 'Guangzhou Warehouse', 'CN', '广东省', '广州市', '白云区太和镇', true, 2);

-- 22. Insert sample carriers
INSERT INTO public.shipping_carriers (carrier_code, carrier_name_cn, carrier_name_en, carrier_type, website, is_active, sort)
VALUES
  ('YUNEXPRESS', '云途物流', 'YunExpress', 'express', 'https://www.yunexpress.com', true, 1),
  ('4PX', '递四方', '4PX Express', 'express', 'https://www.4px.com', true, 2),
  ('DHL', 'DHL快递', 'DHL Express', 'express', 'https://www.dhl.com', true, 3);

-- 23. Insert sample channels
INSERT INTO public.shipping_channels (carrier_id, channel_code, channel_name_cn, channel_name_en, description, is_active, sort)
SELECT 
  c.id,
  'YUNEXPRESS_US_STANDARD',
  '云途美国标准',
  'YunExpress US Standard',
  'Standard shipping to United States, 8-12 days',
  true,
  1
FROM public.shipping_carriers c WHERE c.carrier_code = 'YUNEXPRESS'
UNION ALL
SELECT 
  c.id,
  'YUNEXPRESS_UK_STANDARD',
  '云途英国标准',
  'YunExpress UK Standard',
  'Standard shipping to United Kingdom, 7-10 days',
  true,
  2
FROM public.shipping_carriers c WHERE c.carrier_code = 'YUNEXPRESS'
UNION ALL
SELECT 
  c.id,
  '4PX_US_EPACKET',
  '递四方美国ePacket',
  '4PX US ePacket',
  'Economy shipping to United States, 10-15 days',
  true,
  3
FROM public.shipping_carriers c WHERE c.carrier_code = '4PX'
UNION ALL
SELECT 
  c.id,
  'DHL_EXPRESS_WORLDWIDE',
  'DHL全球特快',
  'DHL Express Worldwide',
  'Express shipping worldwide, 2-5 days',
  true,
  4
FROM public.shipping_carriers c WHERE c.carrier_code = 'DHL';

-- 24. Insert sample rate matrix entries
INSERT INTO public.rate_matrix (
  warehouse_id, channel_id, destination_country,
  weight_min_kg, weight_max_kg,
  first_weight_kg, first_weight_fee,
  additional_weight_step_kg, additional_fee_per_step,
  fuel_surcharge_percent, min_charge,
  currency, estimated_delivery_days_min, estimated_delivery_days_max,
  remote_area_surcharge, is_active, effective_from
)
SELECT 
  w.id,
  ch.id,
  'US',
  0.01, 0.5,
  0.1, 8.50,
  0.1, 2.00,
  15.0, 8.50,
  'USD', 8, 12,
  0.00, true, CURRENT_DATE
FROM public.warehouses w
CROSS JOIN public.shipping_channels ch
WHERE w.warehouse_code = 'SZ001' AND ch.channel_code = 'YUNEXPRESS_US_STANDARD'
UNION ALL
SELECT 
  w.id, ch.id, 'US',
  0.51, 2.0,
  0.1, 8.50,
  0.1, 1.80,
  15.0, 12.00,
  'USD', 8, 12,
  0.00, true, CURRENT_DATE
FROM public.warehouses w
CROSS JOIN public.shipping_channels ch
WHERE w.warehouse_code = 'SZ001' AND ch.channel_code = 'YUNEXPRESS_US_STANDARD'
UNION ALL
SELECT 
  w.id, ch.id, 'GB',
  0.01, 0.5,
  0.1, 7.80,
  0.1, 1.90,
  12.0, 7.80,
  'USD', 7, 10,
  0.00, true, CURRENT_DATE
FROM public.warehouses w
CROSS JOIN public.shipping_channels ch
WHERE w.warehouse_code = 'SZ001' AND ch.channel_code = 'YUNEXPRESS_UK_STANDARD'
UNION ALL
SELECT 
  w.id, ch.id, 'US',
  0.01, 1.0,
  0.1, 6.50,
  0.1, 1.50,
  10.0, 6.50,
  'USD', 10, 15,
  0.00, true, CURRENT_DATE
FROM public.warehouses w
CROSS JOIN public.shipping_channels ch
WHERE w.warehouse_code = 'SZ001' AND ch.channel_code = '4PX_US_EPACKET'
UNION ALL
SELECT 
  w.id, ch.id, 'US',
  0.01, 0.5,
  0.5, 35.00,
  0.5, 12.00,
  8.0, 35.00,
  'USD', 2, 5,
  0.00, true, CURRENT_DATE
FROM public.warehouses w
CROSS JOIN public.shipping_channels ch
WHERE w.warehouse_code = 'SZ001' AND ch.channel_code = 'DHL_EXPRESS_WORLDWIDE';
