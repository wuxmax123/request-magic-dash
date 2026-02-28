
-- Sub-account invitations table
CREATE TABLE public.sub_account_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  invited_email text NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  child_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, invited_email)
);

ALTER TABLE public.sub_account_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitations (as parent or child)
CREATE POLICY "Users can view own invitations"
ON public.sub_account_invitations FOR SELECT
USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

-- Users can create invitations
CREATE POLICY "Users can create invitations"
ON public.sub_account_invitations FOR INSERT
WITH CHECK (auth.uid() = parent_user_id);

-- Users can update own invitations
CREATE POLICY "Users can update own invitations"
ON public.sub_account_invitations FOR UPDATE
USING (auth.uid() = parent_user_id);

-- Users can delete own invitations
CREATE POLICY "Users can delete own invitations"
ON public.sub_account_invitations FOR DELETE
USING (auth.uid() = parent_user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all invitations"
ON public.sub_account_invitations FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sub_account_invitations_updated_at
BEFORE UPDATE ON public.sub_account_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
