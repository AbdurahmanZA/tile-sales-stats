-- Create customers table for client information and sales tracking
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- QuickBooks Customer Information
    qb_list_id VARCHAR(50) UNIQUE,
    qb_edit_sequence VARCHAR(50),
    qb_time_created TIMESTAMPTZ,
    qb_time_modified TIMESTAMPTZ,
    
    -- Basic Information
    customer_name VARCHAR(255) NOT NULL,
    customer_code VARCHAR(50), -- Internal customer code
    company_name VARCHAR(255), -- If business customer
    customer_type VARCHAR(50) DEFAULT 'Individual' CHECK (customer_type IN ('Individual', 'Business', 'Contractor', 'Architect', 'Designer')),
    
    -- Contact Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    title VARCHAR(20), -- Mr., Mrs., Dr., etc.
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(255),
    
    -- Address Information
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state_province VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'South Africa',
    
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state_province VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Business Information
    tax_id VARCHAR(50), -- VAT number for SA businesses
    tax_exempt BOOLEAN DEFAULT false,
    payment_terms VARCHAR(50), -- Net 30, COD, etc.
    credit_limit DECIMAL(12,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0, -- Percentage discount
    
    -- Customer Classification
    customer_category VARCHAR(100), -- Retail, Wholesale, Trade, etc.
    sales_rep VARCHAR(255), -- Assigned sales representative
    territory VARCHAR(100), -- Sales territory
    industry VARCHAR(100), -- Construction, Renovation, etc.
    source VARCHAR(100), -- How they found us (Referral, Online, etc.)
    
    -- Status and Preferences
    is_active BOOLEAN DEFAULT true,
    preferred_branch_id UUID REFERENCES branches(id),
    preferred_payment_method VARCHAR(50), -- Cash, Card, EFT, etc.
    communication_preference VARCHAR(50) DEFAULT 'Email', -- Email, Phone, SMS, etc.
    
    -- Financial Summary (calculated fields that may be updated from QB)
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    last_purchase_date DATE,
    first_purchase_date DATE,
    
    -- Additional Information
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    custom_fields JSONB DEFAULT '{}', -- Flexible custom field storage
    
    -- Marketing and Communication
    marketing_consent BOOLEAN DEFAULT false,
    newsletter_subscription BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Sync and Audit Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_qb_list_id ON customers(qb_list_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(customer_category);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(preferred_branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep ON customers(sales_rep);
CREATE INDEX IF NOT EXISTS idx_customers_territory ON customers(territory);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);

-- Full text search index for customer search
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers 
    USING gin(to_tsvector('english', 
        customer_name || ' ' || 
        COALESCE(company_name, '') || ' ' || 
        COALESCE(email, '') || ' ' || 
        COALESCE(phone, '')
    ));

-- Add updated_at trigger
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON customers
    FOR ALL TO authenticated USING (true);

-- Create useful views
CREATE VIEW customer_summary AS
SELECT 
    c.*,
    b.name as preferred_branch_name,
    CASE 
        WHEN c.last_purchase_date IS NULL THEN 'New Customer'
        WHEN c.last_purchase_date < CURRENT_DATE - INTERVAL '90 days' THEN 'Inactive'
        WHEN c.last_purchase_date < CURRENT_DATE - INTERVAL '30 days' THEN 'At Risk'
        ELSE 'Active'
    END as customer_status,
    CASE 
        WHEN c.total_sales >= 100000 THEN 'VIP'
        WHEN c.total_sales >= 50000 THEN 'High Value'
        WHEN c.total_sales >= 10000 THEN 'Regular'
        ELSE 'New'
    END as value_segment
FROM customers c
LEFT JOIN branches b ON c.preferred_branch_id = b.id;

-- Create view for marketing-eligible customers
CREATE VIEW marketing_eligible_customers AS
SELECT *
FROM customers
WHERE is_active = true 
    AND marketing_consent = true 
    AND email IS NOT NULL 
    AND email != '';

-- Add comments
COMMENT ON TABLE customers IS 'Stores customer information with South African business context';
COMMENT ON COLUMN customers.tax_id IS 'VAT registration number for South African businesses';
COMMENT ON COLUMN customers.customer_type IS 'Classification of customer (Individual, Business, Contractor, etc.)';
COMMENT ON COLUMN customers.territory IS 'Sales territory assignment for performance tracking';
COMMENT ON COLUMN customers.source IS 'Lead source for marketing attribution';
COMMENT ON VIEW customer_summary IS 'Enhanced customer view with calculated status and value segments';
COMMENT ON VIEW marketing_eligible_customers IS 'Customers who have opted in for marketing communications';