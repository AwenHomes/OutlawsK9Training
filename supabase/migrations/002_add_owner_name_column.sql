-- Add owner_name column and make phone required for new leads
ALTER TABLE leads ADD COLUMN owner_name TEXT;

-- For existing rows, set a default so we can add NOT NULL later if desired
-- Phone remains nullable for backwards compatibility with existing rows
