-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RFQ messages table for communication
CREATE TABLE public.rfq_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  attachments text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfq_messages ENABLE ROW LEVEL SECURITY;

-- Messages policies - users can view messages for their RFQs
CREATE POLICY "Users can view messages for their RFQs"
  ON public.rfq_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_messages.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- Users can create messages for their RFQs
CREATE POLICY "Users can create messages for their RFQs"
  ON public.rfq_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_messages.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_messages;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('rfq-attachments', 'rfq-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments
CREATE POLICY "Users can upload attachments for their RFQs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rfq-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments for their RFQs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rfq-attachments');

-- Add trigger for updated_at
CREATE TRIGGER update_rfq_messages_updated_at
  BEFORE UPDATE ON public.rfq_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();