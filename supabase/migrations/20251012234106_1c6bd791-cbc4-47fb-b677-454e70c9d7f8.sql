-- Create RFQ table
CREATE TABLE public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  inquiry_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_links TEXT[] DEFAULT '{}',
  customer_links TEXT[] DEFAULT '{}',
  target_country TEXT NOT NULL,
  currency TEXT NOT NULL,
  target_weight_kg NUMERIC,
  target_price NUMERIC,
  category_l1 INTEGER,
  category_l2 INTEGER,
  category_l3 INTEGER,
  feature_modules TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}',
  feature_attributes JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Users can view their own RFQs
CREATE POLICY "Users can view their own RFQs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own RFQs
CREATE POLICY "Users can create their own RFQs"
ON public.rfqs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own RFQs
CREATE POLICY "Users can update their own RFQs"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own RFQs
CREATE POLICY "Users can delete their own RFQs"
ON public.rfqs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  province TEXT,
  city TEXT,
  address TEXT,
  contact TEXT,
  phone TEXT,
  wechat TEXT,
  email TEXT,
  link_1688 TEXT,
  rating_1688 NUMERIC,
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC,
  quotes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Users can view suppliers for their own RFQs
CREATE POLICY "Users can view suppliers for their own RFQs"
ON public.suppliers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rfqs
    WHERE rfqs.id = suppliers.rfq_id
    AND rfqs.user_id = auth.uid()
  )
);

-- Users can create suppliers for their own RFQs
CREATE POLICY "Users can create suppliers for their own RFQs"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rfqs
    WHERE rfqs.id = suppliers.rfq_id
    AND rfqs.user_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rfqs_updated_at
BEFORE UPDATE ON public.rfqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();