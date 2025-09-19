-- QuickBooks Tile Analytics - Complete Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the complete database

-- =====================================================
-- 001: Create companies table
-- =====================================================

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

-- Add updated_at trigger function (create once)
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

-- =====================================================
-- 002: Create branches table
-- =====================================================

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

CREATE TRIGGER update_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 003: Create inventory table  
-- =====================================================

-- Create inventory table for tile products and stock management
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    
    -- QuickBooks Item Information
    qb_list_id VARCHAR(50) UNIQUE,
    qb_edit_sequence VARCHAR(50),
    qb_time_created TIMESTAMPTZ,
    qb_time_modified TIMESTAMPTZ,
    
    -- Item Details
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100), -- SKU or internal code
    item_type VARCHAR(50) DEFAULT 'Inventory',
    
    -- Tile-Specific Information
    tile_category VARCHAR(100), -- Ceramic, Porcelain, Marble, Granite, etc.
    tile_size VARCHAR(50), -- e.g., "600x600", "800x800"
    tile_color VARCHAR(100),
    tile_finish VARCHAR(100), -- Matte, Glossy, Textured, etc.
    tile_material VARCHAR(100), -- Ceramic, Porcelain, Natural Stone, etc.
    
    -- Description and Details
    description TEXT,
    manufacturer VARCHAR(255),
    
    -- Pricing Information
    unit_of_measure VARCHAR(20) DEFAULT 'sq m',
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Stock Information
    quantity_on_hand DECIMAL(12,2) DEFAULT 0,
    quantity_on_order DECIMAL(12,2) DEFAULT 0,
    reorder_level DECIMAL(12,2) DEFAULT 0,
    
    -- Status and Flags
    is_active BOOLEAN DEFAULT true,
    is_for_sale BOOLEAN DEFAULT true,
    
    -- Sync Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(tile_category);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);

CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 004: Create customers table
-- =====================================================

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
    customer_type VARCHAR(50) DEFAULT 'Individual',
    
    -- Contact Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Address Information
    billing_address_line1 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state_province VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Business Information
    tax_id VARCHAR(50), -- VAT number for SA businesses
    payment_terms VARCHAR(50), -- Net 30, COD, etc.
    credit_limit DECIMAL(12,2) DEFAULT 0,
    
    -- Customer Classification
    customer_category VARCHAR(100), -- Retail, Wholesale, Trade, etc.
    sales_rep VARCHAR(255), -- Assigned sales representative
    territory VARCHAR(100), -- Sales territory
    source VARCHAR(100), -- How they found us (Referral, Online, etc.)
    
    -- Status and Preferences
    is_active BOOLEAN DEFAULT true,
    preferred_branch_id UUID REFERENCES branches(id),
    
    -- Additional Information
    notes TEXT,
    
    -- Sync and Audit Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 005: Create sales table
-- =====================================================

-- Create sales transactions table for invoices and receipts
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- QuickBooks Transaction Information
    qb_txn_id VARCHAR(50) UNIQUE,
    qb_edit_sequence VARCHAR(50),
    qb_time_created TIMESTAMPTZ,
    qb_time_modified TIMESTAMPTZ,
    qb_txn_type VARCHAR(50) DEFAULT 'SalesReceipt',
    
    -- Transaction Details
    transaction_number VARCHAR(50), -- Invoice/Receipt number
    reference_number VARCHAR(50), -- External reference
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Customer Information (denormalized for reporting)
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Financial Information
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Status and Type
    status VARCHAR(50) DEFAULT 'Completed',
    payment_status VARCHAR(50) DEFAULT 'Paid',
    payment_method VARCHAR(50), -- Cash, Card, EFT, Cheque, etc.
    
    -- Sales Information
    sales_rep VARCHAR(255),
    sales_channel VARCHAR(50), -- In-store, Online, Phone, etc.
    
    -- Additional Information
    memo TEXT, -- Internal notes
    
    -- Sync Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales line items table
CREATE TABLE IF NOT EXISTS sales_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    
    -- Item Information
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    item_description TEXT,
    
    -- Tile-Specific Information
    tile_category VARCHAR(100),
    tile_size VARCHAR(50),
    tile_color VARCHAR(100),
    
    -- Quantity and Pricing
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(20) DEFAULT 'sq m',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Tax Information
    is_taxable BOOLEAN DEFAULT true,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for sales table
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_date ON sales(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_sales_rep ON sales(sales_rep);

-- Add indexes for sales_line_items table
CREATE INDEX IF NOT EXISTS idx_sales_line_items_sales_id ON sales_line_items(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_inventory_id ON sales_line_items(inventory_id);

-- Add updated_at triggers
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_line_items_updated_at 
    BEFORE UPDATE ON sales_line_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 006: Create sync log table
-- =====================================================

-- Create sync log table to track QuickBooks synchronization activities
CREATE TABLE IF NOT EXISTS qb_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Session Information
    session_id VARCHAR(100), -- QuickBooks Web Connector session ticket
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    
    -- Request/Response Information
    soap_action VARCHAR(50), -- SOAP action name
    
    -- Data Processing
    records_processed INTEGER DEFAULT 0,
    
    -- Error Information
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Additional Information
    message TEXT, -- Human readable message
    metadata JSONB DEFAULT '{}', -- Additional structured data
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_log_company_id ON qb_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_session_id ON qb_sync_log(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_event_type ON qb_sync_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON qb_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON qb_sync_log(created_at);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert sample companies for development and testing
INSERT INTO companies (
    id,
    name,
    legal_name,
    qb_company_file,
    tax_id,
    address_line1,
    city,
    state_province,
    postal_code,
    country,
    phone,
    email,
    website,
    is_active,
    settings
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'South African Tiles Ltd',
    'South African Tiles (Pty) Ltd',
    'SA_Tiles_2024.qbw',
    '4123456789',
    '123 Tile Street, Industrial Area',
    'Johannesburg',
    'Gauteng',
    '2001',
    'South Africa',
    '+27 11 123 4567',
    'info@satiles.co.za',
    'https://www.satiles.co.za',
    true,
    '{"currency": "ZAR", "tax_rate": 15}'
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- Insert sample branches for the companies
INSERT INTO branches (
    id,
    company_id,
    name,
    code,
    location,
    address_line1,
    city,
    state_province,
    postal_code,
    country,
    phone,
    email,
    manager_name,
    ip_address,
    qb_server_port,
    status,
    is_main_branch
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Johannesburg Main',
    'JHB01',
    'Gauteng',
    '123 Tile Street, Industrial Area',
    'Johannesburg',
    'Gauteng',
    '2001',
    'South Africa',
    '+27 11 123 4567',
    'jhb@satiles.co.za',
    'John Smith',
    '192.168.1.100',
    8019,
    'active',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Pretoria North',
    'PTA02',
    'Gauteng',
    '789 North Street, Wonderboom',
    'Pretoria',
    'Gauteng',
    '0182',
    'South Africa',
    '+27 12 345 6789',
    'pta@satiles.co.za',
    'Sarah Johnson',
    '192.168.2.100',
    8019,
    'inactive',
    false
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Cape Town South',
    'CPT03',
    'Western Cape',
    '321 Marine Drive, Muizenberg',
    'Cape Town',
    'Western Cape',
    '7945',
    'South Africa',
    '+27 21 456 7890',
    'cpt@satiles.co.za',
    'Michael Brown',
    '192.168.3.100',
    8019,
    'active',
    false
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- If you see this, the database setup is complete!
-- You can now start the QuickBooks Tile Analytics server.