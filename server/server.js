import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { testSupabaseConnection } from './config/supabase.js';
import { initializeDatabase, insertSampleData } from './config/database.js';

// Import middleware
import { corsOptions, errorHandler, requestLogger } from './middleware/auth.js';

// Import routes
import qbwcRoutes from './routes/qbwc.js';
import apiRoutes from './routes/api.js';

// Initialize environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware Configuration
 */

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://ydeyxmrradqlqedqhkmx.supabase.co"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logging
app.use(requestLogger);

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'QB Tile Analytics Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API Routes
 */

// QuickBooks Web Connector endpoints
app.use('/api/quickbooks-connector', qbwcRoutes);

// Dashboard API endpoints
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QB Tile Analytics Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      qbwc: '/api/quickbooks-connector',
      api: '/api',
      dashboard: '/api/dashboard'
    },
    documentation: 'See README.md for API documentation'
  });
});

/**
 * Error Handling
 */

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

/**
 * Server Initialization
 */
async function startServer() {
  try {
    console.log('🚀 Starting QB Tile Analytics Server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Port: ${PORT}`);
    
    // Test Supabase connection
    console.log('🔄 Testing Supabase connection...');
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.connected) {
      console.error('❌ Failed to connect to Supabase:', connectionTest.error);
      console.log('⚠️  Server will start but database features may not work');
    }
    
    // Initialize database schema if needed
    if (connectionTest.connected && !connectionTest.tablesExist) {
      console.log('🔄 Initializing database schema...');
      const dbInitialized = await initializeDatabase();
      
      if (dbInitialized) {
        console.log('🔄 Inserting sample data...');
        await insertSampleData();
      }
    }
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📡 QBWC Endpoint: http://localhost:${PORT}/api/quickbooks-connector`);
      console.log(`📊 API Endpoint: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 QuickBooks Web Connector Configuration:');
      console.log(`   - Username: ${process.env.QBWC_USERNAME || 'qb_tile_user'}`);
      console.log(`   - App Name: ${process.env.QBWC_APP_NAME || 'QB Tile Analytics'}`);
      console.log(`   - Update QWC file with this server URL`);
      console.log('');
      console.log('📋 Ready to accept QuickBooks connections!');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;