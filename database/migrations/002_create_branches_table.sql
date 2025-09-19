-- Create branches table for multiple business locations
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Branch code for internal reference
    location VARCHAR(255), -- City/Province
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    ip_address INET, -- For QuickBooks server connection
    qb_server_port INTEGER DEFAULT 8019,
    qb_company_file VARCHAR(500), -- Branch-specific QB file if different
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    is_main_branch BOOLEAN DEFAULT false,
    opening_hours JSONB, -- Store operating hours as JSON
    settings JSONB DEFAULT '{}',
    qb_list_id VARCHAR(50) UNIQUE,
    qb_edit_sequence VARCHAR(50),
    qb_time_created TIMESTAMPTZ,
    qb_time_modified TIMESTAMPTZ,
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_branches_location ON branches(location);
CREATE INDEX IF NOT EXISTS idx_branches_qb_list_id ON branches(qb_list_id);
CREATE INDEX IF NOT EXISTS idx_branches_ip_address ON branches(ip_address);
CREATE INDEX IF NOT EXISTS idx_branches_main ON branches(is_main_branch);

-- Add updated_at trigger
CREATE TRIGGER update_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure only one main branch per company
CREATE UNIQUE INDEX idx_branches_one_main_per_company 
    ON branches (company_id) 
    WHERE is_main_branch = true;

-- Add RLS policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON branches
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON branches
    FOR ALL TO authenticated USING (true);

-- Add comments
COMMENT ON TABLE branches IS 'Stores branch/location information for multi-location businesses';
COMMENT ON COLUMN branches.code IS 'Short code for branch identification (e.g., JHB01, CPT02)';
COMMENT ON COLUMN branches.ip_address IS 'IP address of QuickBooks server at this branch';
COMMENT ON COLUMN branches.qb_server_port IS 'Port number for QuickBooks Web Connector connection';
COMMENT ON COLUMN branches.opening_hours IS 'JSON object with daily opening hours and special schedules';
COMMENT ON COLUMN branches.is_main_branch IS 'Indicates if this is the primary/head office branch';