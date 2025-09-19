import { supabase } from './supabase.js';

/**
 * Database initialization and schema creation
 */
export async function initializeDatabase() {
  console.log('🔄 Initializing database schema...');
  
  try {
    // Create companies table
    await createCompaniesTable();
    
    // Create branches table
    await createBranchesTable();
    
    // Create inventory table
    await createInventoryTable();
    
    // Create sales table
    await createSalesTable();
    
    // Create customers table
    await createCustomersTable();
    
    // Create qb_sync_log table
    await createSyncLogTable();
    
    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

async function createCompaniesTable() {
  const { error } = await supabase.rpc('create_companies_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createBranchesTable() {
  const { error } = await supabase.rpc('create_branches_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createInventoryTable() {
  const { error } = await supabase.rpc('create_inventory_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createSalesTable() {
  const { error } = await supabase.rpc('create_sales_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createCustomersTable() {
  const { error } = await supabase.rpc('create_customers_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createSyncLogTable() {
  const { error } = await supabase.rpc('create_sync_log_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

/**
 * Insert sample data for development
 */
export async function insertSampleData() {
  console.log('🔄 Inserting sample data...');
  
  try {
    // Insert sample company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'South African Tiles Ltd',
        qb_company_file: 'SA_Tiles_2024.qbw',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (companyError) throw companyError;
    
    // Insert sample branches
    const branches = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        company_id: company.id,
        name: 'Johannesburg Main',
        location: 'Gauteng',
        ip_address: '192.168.1.100',
        status: 'active'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        company_id: company.id,
        name: 'Pretoria North',
        location: 'Gauteng', 
        ip_address: '192.168.2.100',
        status: 'inactive'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        company_id: company.id,
        name: 'Cape Town South',
        location: 'Western Cape',
        ip_address: '192.168.3.100',
        status: 'active'
      }
    ];
    
    const { error: branchError } = await supabase
      .from('branches')
      .upsert(branches);
    
    if (branchError) throw branchError;
    
    console.log('✅ Sample data inserted successfully');
    return true;
  } catch (error) {
    console.error('❌ Sample data insertion failed:', error.message);
    return false;
  }
}