-- Create companies table to store QuickBooks company information
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    qb_company_file VARCHAR(500),
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    qb_list_id VARCHAR(50) UNIQUE,
    qb_edit_sequence VARCHAR(50),
    qb_time_created TIMESTAMPTZ,
    qb_time_modified TIMESTAMPTZ,
    last_sync_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_qb_list_id ON companies(qb_list_id);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_last_sync ON companies(last_sync_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all companies
CREATE POLICY "Allow authenticated read access" ON companies
    FOR SELECT TO authenticated USING (true);

-- Policy to allow authenticated users to insert/update companies
CREATE POLICY "Allow authenticated write access" ON companies
    FOR ALL TO authenticated USING (true);

-- Add comments
COMMENT ON TABLE companies IS 'Stores QuickBooks company information and settings';
COMMENT ON COLUMN companies.qb_company_file IS 'Path to QuickBooks company file (.qbw)';
COMMENT ON COLUMN companies.qb_list_id IS 'QuickBooks internal ListID for the company';
COMMENT ON COLUMN companies.qb_edit_sequence IS 'QuickBooks EditSequence for optimistic locking';
COMMENT ON COLUMN companies.last_sync_date IS 'Last successful synchronization with QuickBooks';
COMMENT ON COLUMN companies.settings IS 'JSON object storing company-specific settings and preferences';