-- Add reference_number column to rfqs table
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS reference_number text;