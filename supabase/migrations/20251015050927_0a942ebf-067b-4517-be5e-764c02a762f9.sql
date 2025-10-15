-- Create commercial_terms table for storing commercial term attributes
CREATE TABLE public.commercial_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attr_code TEXT NOT NULL UNIQUE,
  attr_name TEXT NOT NULL,
  input_type TEXT NOT NULL,
  required INTEGER DEFAULT 0,
  unit TEXT,
  options_json JSONB DEFAULT '[]'::jsonb,
  help_text TEXT,
  visible_on_quote INTEGER DEFAULT 1,
  attr_sort INTEGER DEFAULT 0,
  has_refundable_checkbox BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commercial_terms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read commercial_terms"
ON public.commercial_terms FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert commercial_terms"
ON public.commercial_terms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update commercial_terms"
ON public.commercial_terms FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated users to delete commercial_terms"
ON public.commercial_terms FOR DELETE
USING (true);

-- Add commercial_terms field to rfqs table
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS commercial_terms JSONB DEFAULT '{}'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_commercial_terms_updated_at
BEFORE UPDATE ON public.commercial_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();