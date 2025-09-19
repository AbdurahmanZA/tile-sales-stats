import express from 'express';
import { handleSOAPRequest } from '../controllers/qbwcController.js';
import { qbwcRateLimit, qbwcAuth, validateQBRequest, requestLogger } from '../middleware/auth.js';

const router = express.Router();

/**
 * QuickBooks Web Connector Routes
 */

// Middleware for all QBWC routes
router.use(requestLogger);
router.use(qbwcRateLimit);

// Main SOAP endpoint for QuickBooks Web Connector
router.post('/', 
  express.text({ type: 'text/xml' }), // Parse raw XML
  handleSOAPRequest
);

// Alternative endpoints for different SOAP actions (if needed)
router.post('/soap', 
  express.text({ type: 'text/xml' }),
  handleSOAPRequest
);

// Health check endpoint for QB Web Connector
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'QuickBooks Web Connector API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status endpoint to check active sessions
router.get('/status', (req, res) => {
  // This would normally require authentication
  res.json({
    status: 'operational',
    activeSessions: 0, // You would get this from your session store
    lastSync: null, // Last successful sync timestamp
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;