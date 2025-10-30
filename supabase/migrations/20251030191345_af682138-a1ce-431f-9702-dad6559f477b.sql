-- Drop the old status check constraint if it exists
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;

-- Add new check constraint with all supported statuses including the new workflow states
ALTER TABLE rfqs ADD CONSTRAINT rfqs_status_check 
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'pending', 'in_progress', 'quoted', 'closed'));