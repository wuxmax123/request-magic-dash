
-- Create stores table
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_name text NOT NULL,
  platform text NOT NULL DEFAULT '',
  store_url text,
  country text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Admins can manage all stores
CREATE POLICY "Admins can manage all stores"
  ON public.stores FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Users can view their own stores
CREATE POLICY "Users can view own stores"
  ON public.stores FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create own stores
CREATE POLICY "Users can create own stores"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own stores
CREATE POLICY "Users can update own stores"
  ON public.stores FOR UPDATE
  USING (auth.uid() = user_id);

-- Supervisors can view all stores
CREATE POLICY "Supervisors can view all stores"
  ON public.stores FOR SELECT
  USING (has_role(auth.uid(), 'supervisor'));

-- Trigger for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
