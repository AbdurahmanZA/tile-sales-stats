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
    qb_txn_type VARCHAR(50) DEFAULT 'SalesReceipt' CHECK (qb_txn_type IN ('SalesReceipt', 'Invoice', 'CreditMemo', 'Estimate')),
    
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
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Tax Information
    tax_rate DECIMAL(5,2), -- VAT rate (15% in SA)
    tax_code VARCHAR(20) DEFAULT 'VAT', -- Tax classification
    is_tax_inclusive BOOLEAN DEFAULT true, -- SA typically uses tax-inclusive pricing
    
    -- Status and Type
    status VARCHAR(50) DEFAULT 'Completed' CHECK (status IN ('Draft', 'Pending', 'Completed', 'Cancelled', 'Refunded', 'Overdue')),
    payment_status VARCHAR(50) DEFAULT 'Paid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid', 'Overdue', 'Refunded')),
    payment_method VARCHAR(50), -- Cash, Card, EFT, Cheque, etc.
    
    -- Installation Information (specific to tile business)
    requires_installation BOOLEAN DEFAULT false,
    installation_date DATE,
    installation_status VARCHAR(50) CHECK (installation_status IN ('Not Required', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    installer_name VARCHAR(255),
    installation_notes TEXT,
    
    -- Project Information
    project_name VARCHAR(255),
    project_type VARCHAR(100), -- Renovation, New Build, Commercial, etc.
    project_area_sqm DECIMAL(10,2), -- Total area in square meters
    
    -- Sales Information
    sales_rep VARCHAR(255),
    sales_channel VARCHAR(50), -- In-store, Online, Phone, etc.
    order_source VARCHAR(100), -- Walk-in, Website, Referral, etc.
    
    -- Shipping Information
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    shipping_date DATE,
    delivery_date DATE,
    delivery_status VARCHAR(50) CHECK (delivery_status IN ('Pending', 'Shipped', 'Delivered', 'Returned')),
    
    -- Address Information
    billing_address JSONB,
    shipping_address JSONB,
    
    -- Additional Information
    memo TEXT, -- Internal notes
    customer_message TEXT, -- Message to customer
    terms TEXT, -- Payment/delivery terms
    special_instructions TEXT,
    
    -- Metadata
    tags TEXT[], -- Array of tags for categorization
    custom_fields JSONB DEFAULT '{}',
    
    -- Sync Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales line items table
CREATE TABLE IF NOT EXISTS sales_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    
    -- QuickBooks Line Information
    qb_line_id VARCHAR(50),
    
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
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Tax Information
    is_taxable BOOLEAN DEFAULT true,
    tax_code VARCHAR(20) DEFAULT 'VAT',
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Installation specific
    area_to_install DECIMAL(10,2), -- Square meters for this line item
    wastage_percentage DECIMAL(5,2) DEFAULT 10, -- Typical 10% wastage for tiles
    
    -- Line item notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for sales table
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_qb_txn_id ON sales(qb_txn_id);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_number ON sales(transaction_number);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_date ON sales(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_due_date ON sales(due_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_sales_rep ON sales(sales_rep);
CREATE INDEX IF NOT EXISTS idx_sales_installation_date ON sales(installation_date);
CREATE INDEX IF NOT EXISTS idx_sales_total_amount ON sales(total_amount);

-- Add indexes for sales_line_items table
CREATE INDEX IF NOT EXISTS idx_sales_line_items_sales_id ON sales_line_items(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_inventory_id ON sales_line_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_item_name ON sales_line_items(item_name);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_category ON sales_line_items(tile_category);

-- Add updated_at triggers
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_line_items_updated_at 
    BEFORE UPDATE ON sales_line_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON sales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON sales
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON sales_line_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON sales_line_items
    FOR ALL TO authenticated USING (true);

-- Create useful views
CREATE VIEW sales_summary AS
SELECT 
    s.*,
    c.customer_name as full_customer_name,
    c.customer_type,
    c.customer_category,
    b.name as branch_name,
    b.location as branch_location,
    COUNT(sli.id) as line_item_count,
    SUM(sli.quantity) as total_quantity,
    SUM(sli.area_to_install) as total_area
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN sales_line_items sli ON s.id = sli.sales_id
GROUP BY s.id, c.customer_name, c.customer_type, c.customer_category, b.name, b.location;

-- View for overdue invoices
CREATE VIEW overdue_invoices AS
SELECT s.*
FROM sales s
WHERE s.qb_txn_type = 'Invoice'
    AND s.status = 'Completed'
    AND s.payment_status IN ('Unpaid', 'Partial')
    AND s.due_date < CURRENT_DATE;

-- View for installation schedule
CREATE VIEW installation_schedule AS
SELECT 
    s.id,
    s.transaction_number,
    s.customer_name,
    s.installation_date,
    s.installation_status,
    s.installer_name,
    s.project_name,
    s.project_area_sqm,
    b.name as branch_name,
    SUM(sli.area_to_install) as total_install_area
FROM sales s
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN sales_line_items sli ON s.id = sli.sales_id
WHERE s.requires_installation = true
    AND s.installation_status IN ('Scheduled', 'In Progress')
GROUP BY s.id, b.name
ORDER BY s.installation_date;

-- Add comments
COMMENT ON TABLE sales IS 'Stores sales transactions (invoices, receipts) with tile business specific fields';
COMMENT ON TABLE sales_line_items IS 'Individual line items for each sale with tile-specific details';
COMMENT ON COLUMN sales.installation_status IS 'Tracks tile installation progress for sales requiring installation';
COMMENT ON COLUMN sales.project_area_sqm IS 'Total project area in square meters';
COMMENT ON COLUMN sales_line_items.wastage_percentage IS 'Percentage of extra tiles ordered to account for cutting waste';
COMMENT ON VIEW overdue_invoices IS 'Invoices that are past their due date and still unpaid';
COMMENT ON VIEW installation_schedule IS 'Upcoming and in-progress tile installations';