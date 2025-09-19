import express from 'express';
import { supabase } from '../config/supabase.js';
import { apiRateLimit } from '../middleware/auth.js';

const router = express.Router();

// Apply rate limiting to all API routes
router.use(apiRateLimit);

/**
 * Dashboard API Routes
 */

// Get dashboard overview data
router.get('/dashboard', async (req, res) => {
  try {
    // Get branches with status
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .order('name');

    if (branchError) throw branchError;

    // Get recent sales summary (mock for now)
    const salesSummary = {
      monthlyRevenue: 845231,
      tilesSold: 12450,
      stockTurnover: 4.2,
      customerRetention: 89,
      installRate: 92
    };

    // Get alerts (mock for now)
    const alerts = [
      {
        id: 1,
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Marble tiles below reorder level at Cape Town branch',
        priority: 'high',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        type: 'info',
        title: 'High Demand',
        message: 'Ceramic 600x600 tiles trending up across all branches',
        priority: 'medium',
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      branches: branches || [],
      salesSummary,
      alerts,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get sales data for charts
router.get('/sales', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Mock sales data for now (replace with real data later)
    const salesData = [
      { branch: 'Johannesburg Main', jan: 65000, feb: 59000, mar: 80000, apr: 81000, may: 56000, jun: 55000 },
      { branch: 'Pretoria North', jan: 28000, feb: 48000, mar: 40000, apr: 19000, may: 86000, jun: 27000 },
      { branch: 'Cape Town South', jan: 90000, feb: 38000, mar: 90000, apr: 73000, may: 49000, jun: 38000 }
    ];

    res.json({
      data: salesData,
      timeframe,
      currency: 'ZAR',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sales API error:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// Get inventory data
router.get('/inventory', async (req, res) => {
  try {
    // Mock inventory data
    const inventoryData = [
      { category: 'Ceramic', inStock: 450, lowStock: 25, outOfStock: 5 },
      { category: 'Porcelain', inStock: 320, lowStock: 15, outOfStock: 3 },
      { category: 'Marble', inStock: 180, lowStock: 30, outOfStock: 8 },
      { category: 'Granite', inStock: 95, lowStock: 12, outOfStock: 2 }
    ];

    res.json({
      data: inventoryData,
      totalItems: 1462,
      lowStockThreshold: 50,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Inventory API error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
});

// Get customer analytics
router.get('/customers', async (req, res) => {
  try {
    // Mock customer data
    const customerData = [
      { source: 'Referral', customers: 45, percentage: 35 },
      { source: 'Online Search', customers: 32, percentage: 25 },
      { source: 'Social Media', customers: 25, percentage: 20 },
      { source: 'Direct Visit', customers: 20, percentage: 15 },
      { source: 'Other', customers: 6, percentage: 5 }
    ];

    res.json({
      data: customerData,
      totalCustomers: 128,
      newThisMonth: 23,
      retentionRate: 89,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Customer API error:', error);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// Get sync status
router.get('/sync-status', async (req, res) => {
  try {
    const { data: syncLogs, error } = await supabase
      .from('qb_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const lastSync = syncLogs && syncLogs.length > 0 ? syncLogs[0] : null;
    const syncHistory = syncLogs || [];

    res.json({
      lastSync: lastSync ? {
        timestamp: lastSync.created_at,
        status: lastSync.status,
        type: lastSync.event_type,
        records: lastSync.metadata?.records_processed || 0
      } : null,
      history: syncHistory.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        type: log.event_type,
        status: log.status,
        message: log.metadata?.message || '',
        records: log.metadata?.records_processed || 0
      })),
      isOnline: true // This would check actual QB connection status
    });

  } catch (error) {
    console.error('Sync status API error:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

// Update branch status (for testing)
router.put('/branches/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('branches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      branch: data,
      message: `Branch status updated to ${status}`
    });

  } catch (error) {
    console.error('Branch update error:', error);
    res.status(500).json({ error: 'Failed to update branch status' });
  }
});

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'QB Analytics API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;