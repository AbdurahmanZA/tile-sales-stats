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
    '{
        "currency": "ZAR",
        "tax_rate": 15,
        "default_payment_terms": "Net 30",
        "financial_year_end": "2024-02-28",
        "backup_schedule": "daily",
        "sync_frequency": "hourly"
    }'
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    'Premium Ceramics Co',
    'Premium Ceramics Company (Pty) Ltd',
    'Premium_Ceramics_2024.qbw',
    '4987654321',
    '456 Ceramic Boulevard',
    'Cape Town',
    'Western Cape',
    '8001',
    'South Africa',
    '+27 21 987 6543',
    'sales@premiumceramics.co.za',
    'https://www.premiumceramics.co.za',
    true,
    '{
        "currency": "ZAR",
        "tax_rate": 15,
        "default_payment_terms": "Net 15",
        "financial_year_end": "2024-02-28",
        "backup_schedule": "daily",
        "sync_frequency": "every_4_hours"
    }'
) ON CONFLICT (id) DO UPDATE SET
    updated_at = now();