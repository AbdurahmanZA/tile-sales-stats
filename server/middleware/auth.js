import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

/**
 * Rate limiting middleware for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiting for QB Web Connector endpoints
 */
export const qbwcRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    error: 'QuickBooks Web Connector rate limit exceeded',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Basic authentication middleware for QB Web Connector
 */
export function qbwcAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header'
    });
  }
  
  try {
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    const expectedUsername = process.env.QBWC_USERNAME;
    const expectedPassword = process.env.QBWC_PASSWORD;
    
    if (username !== expectedUsername || password !== expectedPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    req.qbUser = { username, authenticated: true };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid authorization format'
    });
  }
}

/**
 * Validation middleware for request data
 */
export const validateQBRequest = [
  body('qbXMLRP').optional().isString().withMessage('qbXMLRP must be a string'),
  body('ticket').optional().isString().withMessage('ticket must be a string'),
  body('companyFileName').optional().isString().withMessage('companyFileName must be a string'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default to 500 server error
  let error = { message: 'Internal server error' };
  let status = 500;
  
  if (err.name === 'ValidationError') {
    status = 400;
    error = { message: 'Validation error', details: err.message };
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    error = { message: 'Unauthorized access' };
  } else if (err.message) {
    error = { message: err.message };
  }
  
  res.status(status).json({ error });
}

/**
 * CORS configuration for different endpoints
 */
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost',
      // Add production URLs here
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'SOAPAction'],
};

/**
 * Logging middleware for debugging
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}