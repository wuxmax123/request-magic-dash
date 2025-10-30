-- Add new columns to rfqs table for RFQ workflow
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS quote_id TEXT;

-- Update status to support new workflow states
COMMENT ON COLUMN rfqs.status IS 'Status: pending, draft, in_progress, quoted, closed, submitted, approved, rejected';