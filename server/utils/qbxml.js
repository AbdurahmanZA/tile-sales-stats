import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * QuickBooks XML utilities for parsing and building QBXML requests/responses
 */

// XML Parser options
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseNodeValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
};

// XML Builder options  
const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Parse QBXML request from QuickBooks Web Connector
 */
export function parseQBXML(xmlString) {
  try {
    console.log('📥 Parsing QBXML:', xmlString.substring(0, 200) + '...');
    
    const parsed = parser.parse(xmlString);
    
    // Navigate through the XML structure
    if (parsed.QBXML && parsed.QBXML.QBXMLMsgsRq) {
      return parsed.QBXML.QBXMLMsgsRq;
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ QBXML parsing failed:', error.message);
    throw new Error(`Invalid QBXML format: ${error.message}`);
  }
}

/**
 * Build QBXML response for QuickBooks Web Connector
 */
export function buildQBXML(responseData, requestID = null) {
  try {
    console.log('📤 Building QBXML response...');
    
    const qbxml = {
      QBXML: {
        '@_version': '13.0',
        QBXMLMsgsRs: responseData
      }
    };
    
    if (requestID) {
      qbxml.QBXML.QBXMLMsgsRs['@_requestID'] = requestID;
    }
    
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(qbxml)}`;
    
    console.log('✅ QBXML built successfully');
    return xmlString;
  } catch (error) {
    console.error('❌ QBXML building failed:', error.message);
    throw new Error(`Failed to build QBXML: ${error.message}`);
  }
}

/**
 * Create item query request for inventory items
 */
export function createItemQueryRequest(maxReturned = 100) {
  return {
    ItemQueryRq: {
      '@_requestID': generateRequestID(),
      MaxReturned: maxReturned,
      ActiveStatus: 'All'
    }
  };
}

/**
 * Create customer query request
 */
export function createCustomerQueryRequest(maxReturned = 100) {
  return {
    CustomerQueryRq: {
      '@_requestID': generateRequestID(),
      MaxReturned: maxReturned,
      ActiveStatus: 'All'
    }
  };
}

/**
 * Create sales receipt query request
 */
export function createSalesReceiptQueryRequest(fromModifiedDate = null, maxReturned = 100) {
  const request = {
    SalesReceiptQueryRq: {
      '@_requestID': generateRequestID(),
      MaxReturned: maxReturned
    }
  };
  
  if (fromModifiedDate) {
    request.SalesReceiptQueryRq.ModifiedDateRangeFilter = {
      FromModifiedDate: fromModifiedDate
    };
  }
  
  return request;
}

/**
 * Create invoice query request
 */
export function createInvoiceQueryRequest(fromModifiedDate = null, maxReturned = 100) {
  const request = {
    InvoiceQueryRq: {
      '@_requestID': generateRequestID(),
      MaxReturned: maxReturned
    }
  };
  
  if (fromModifiedDate) {
    request.InvoiceQueryRq.ModifiedDateRangeFilter = {
      FromModifiedDate: fromModifiedDate
    };
  }
  
  return request;
}

/**
 * Create company info query request
 */
export function createCompanyInfoQueryRequest() {
  return {
    CompanyQueryRq: {
      '@_requestID': generateRequestID()
    }
  };
}

/**
 * Generate unique request ID
 */
export function generateRequestID() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract error information from QBXML response
 */
export function extractQBError(qbxmlResponse) {
  try {
    const parsed = parseQBXML(qbxmlResponse);
    
    if (parsed && parsed.statusCode && parsed.statusCode !== '0') {
      return {
        code: parsed.statusCode,
        message: parsed.statusMessage || 'Unknown QuickBooks error',
        severity: parsed.statusSeverity || 'Error'
      };
    }
    
    return null;
  } catch (error) {
    return {
      code: 'PARSE_ERROR',
      message: `Failed to parse QB response: ${error.message}`,
      severity: 'Error'
    };
  }
}

/**
 * Convert QB date format to ISO string
 */
export function parseQBDate(qbDateString) {
  if (!qbDateString) return null;
  
  try {
    // QB date format is usually YYYY-MM-DD
    const date = new Date(qbDateString);
    return date.toISOString();
  } catch (error) {
    console.warn('Invalid QB date format:', qbDateString);
    return null;
  }
}

/**
 * Convert ISO date to QB date format
 */
export function formatQBDate(isoDateString) {
  if (!isoDateString) return null;
  
  try {
    const date = new Date(isoDateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (error) {
    console.warn('Invalid ISO date format:', isoDateString);
    return null;
  }
}

/**
 * Validate QBXML structure
 */
export function validateQBXML(xmlString) {
  try {
    const parsed = parseQBXML(xmlString);
    
    if (!parsed) {
      return { valid: false, error: 'Empty or invalid XML' };
    }
    
    // Add more validation rules as needed
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}