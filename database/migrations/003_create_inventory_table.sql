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
    item_type VARCHAR(50) DEFAULT 'Inventory' CHECK (item_type IN ('Inventory', 'Non-Inventory', 'Service', 'Other Charge')),
    
    -- Tile-Specific Information
    tile_category VARCHAR(100), -- Ceramic, Porcelain, Marble, Granite, etc.
    tile_size VARCHAR(50), -- e.g., "600x600", "800x800"
    tile_color VARCHAR(100),
    tile_finish VARCHAR(100), -- Matte, Glossy, Textured, etc.
    tile_material VARCHAR(100), -- Ceramic, Porcelain, Natural Stone, etc.
    tile_grade VARCHAR(20), -- First, Second, Commercial, etc.
    thickness_mm DECIMAL(5,2), -- Thickness in millimeters
    
    -- Description and Details
    description TEXT,
    manufacturer VARCHAR(255),
    brand VARCHAR(100),
    model_number VARCHAR(100),
    barcode VARCHAR(50),
    
    -- Pricing Information
    unit_of_measure VARCHAR(20) DEFAULT 'sq m', -- Square meters, pieces, boxes, etc.
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    wholesale_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Stock Information
    quantity_on_hand DECIMAL(12,2) DEFAULT 0,
    quantity_on_order DECIMAL(12,2) DEFAULT 0,
    quantity_allocated DECIMAL(12,2) DEFAULT 0, -- Reserved for orders
    reorder_level DECIMAL(12,2) DEFAULT 0,
    max_stock_level DECIMAL(12,2),
    
    -- Location and Storage
    warehouse_location VARCHAR(100), -- Specific location in warehouse
    bin_location VARCHAR(50), -- Bin/rack location
    
    -- Status and Flags
    is_active BOOLEAN DEFAULT true,
    is_for_sale BOOLEAN DEFAULT true,
    is_for_purchase BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    
    -- Additional Information
    weight_kg DECIMAL(8,3), -- Weight per unit in kg
    dimensions JSONB, -- Length, width, height
    coverage_per_unit DECIMAL(8,3), -- Coverage in square meters per unit
    pieces_per_box INTEGER, -- For boxed tiles
    
    -- Supplier Information (simplified - could be separate table)
    primary_supplier VARCHAR(255),
    supplier_item_code VARCHAR(100),
    
    -- Metadata
    tags TEXT[], -- Array of tags for categorization
    images JSONB, -- Array of image URLs
    specifications JSONB, -- Technical specifications as JSON
    
    -- Sync Information
    last_sync_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_qb_list_id ON inventory(qb_list_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_item_code ON inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(tile_category);
CREATE INDEX IF NOT EXISTS idx_inventory_size ON inventory(tile_size);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_for_sale ON inventory(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON inventory(reorder_level, quantity_on_hand);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_inventory_search ON inventory 
    USING gin(to_tsvector('english', item_name || ' ' || COALESCE(description, '') || ' ' || COALESCE(tile_category, '')));

-- Add updated_at trigger
CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON inventory
    FOR ALL TO authenticated USING (true);

-- Create view for low stock items
CREATE VIEW low_stock_items AS
SELECT 
    i.*,
    b.name as branch_name,
    c.name as company_name,
    (i.quantity_on_hand - i.quantity_allocated) as available_stock,
    CASE 
        WHEN (i.quantity_on_hand - i.quantity_allocated) <= 0 THEN 'Out of Stock'
        WHEN (i.quantity_on_hand - i.quantity_allocated) <= i.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM inventory i
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN companies c ON i.company_id = c.id
WHERE i.is_active = true 
    AND (i.quantity_on_hand - i.quantity_allocated) <= i.reorder_level;

-- Add comments
COMMENT ON TABLE inventory IS 'Stores inventory items with tile-specific attributes and stock levels';
COMMENT ON COLUMN inventory.tile_category IS 'Type of tile material (Ceramic, Porcelain, Marble, etc.)';
COMMENT ON COLUMN inventory.tile_size IS 'Tile dimensions in format like "600x600mm"';
COMMENT ON COLUMN inventory.coverage_per_unit IS 'Square meters covered per unit (for area calculations)';
COMMENT ON COLUMN inventory.quantity_allocated IS 'Stock reserved for pending orders';
COMMENT ON VIEW low_stock_items IS 'Items that need reordering based on reorder levels';