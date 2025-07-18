-- Add soft delete columns to leads table
ALTER TABLE leads ADD COLUMN deletedAt DATETIME;
ALTER TABLE leads ADD COLUMN deletedBy TEXT;

-- Add soft delete columns to proposals table  
ALTER TABLE proposals ADD COLUMN deletedAt DATETIME;
ALTER TABLE proposals ADD COLUMN deletedBy TEXT;

-- Create indexes for better performance
CREATE INDEX idx_leads_deleted_at ON leads(deletedAt);
CREATE INDEX idx_proposals_deleted_at ON proposals(deletedAt);
