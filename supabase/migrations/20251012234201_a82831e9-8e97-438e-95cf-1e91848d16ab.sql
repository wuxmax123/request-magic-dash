-- Fix search_path for update_updated_at_column function
DROP TRIGGER IF EXISTS update_rfqs_updated_at ON public.rfqs;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER update_rfqs_updated_at
BEFORE UPDATE ON public.rfqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();