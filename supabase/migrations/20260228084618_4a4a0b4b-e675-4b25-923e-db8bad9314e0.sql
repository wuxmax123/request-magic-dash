
-- Replace single store_id with store_ids array
ALTER TABLE public.sub_account_invitations
  ADD COLUMN store_ids uuid[] NOT NULL DEFAULT '{}';

-- Migrate existing data
UPDATE public.sub_account_invitations
  SET store_ids = ARRAY[store_id]
  WHERE store_id IS NOT NULL;

-- Drop old column and its FK
ALTER TABLE public.sub_account_invitations
  DROP COLUMN store_id;
