-- Add assignment fields to rfqs table
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_assignable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('P1', 'P2', 'P3')),
ADD COLUMN IF NOT EXISTS activity_log jsonb DEFAULT '[]'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_to ON public.rfqs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rfqs_auto_assignable ON public.rfqs(auto_assignable) WHERE auto_assignable = true;

-- Update RLS policies to allow assigned users to view their RFQs
DROP POLICY IF EXISTS "Users can view their own RFQs" ON public.rfqs;

CREATE POLICY "Users can view their own RFQs" ON public.rfqs
FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'supervisor')
);

-- Allow supervisors and admins to update assignment fields
CREATE POLICY "Supervisors can assign RFQs" ON public.rfqs
FOR UPDATE USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'supervisor')
);