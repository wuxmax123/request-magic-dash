-- Add product_name column to rfqs table
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS product_name text;