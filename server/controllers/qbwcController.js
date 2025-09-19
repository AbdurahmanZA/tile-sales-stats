import { 
  parseQBXML, 
  buildQBXML, 
  createItemQueryRequest, 
  createCustomerQueryRequest,
  createSalesReceiptQueryRequest,
  createInvoiceQueryRequest,
  createCompanyInfoQueryRequest,
  extractQBError,
  parseQBDate,
  generateRequestID
} from '../utils/qbxml.js';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * QuickBooks Web Connector Controller
 * Handles all SOAP requests from QB Web Connector
 */

// Store active sessions and requests
const activeSessions = new Map();
const activeRequests = new Map();

/**
 * SOAP Endpoint - Main entry point for QB Web Connector
 */
export async function handleSOAPRequest(req, res) {
  try {
    const soapAction = req.headers.soapaction || req.headers['soapaction'];
    const requestBody = req.body;
    
    console.log(`🔄 SOAP Action: ${soapAction}`);
    console.log(`📥 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    let response;
    
    switch (soapAction) {
      case 'serverVersion':
        response = await handleServerVersion();
        break;
        
      case 'clientVersion':
        response = await handleClientVersion(requestBody);
        break;
        
      case 'authenticate':
        response = await handleAuthenticate(requestBody);
        break;
        
      case 'sendRequestXML':
        response = await handleSendRequestXML(requestBody);
        break;
        
      case 'receiveResponseXML':
        response = await handleReceiveResponseXML(requestBody);
        break;
        
      case 'connectionError':
        response = await handleConnectionError(requestBody);
        break;
        
      case 'closeConnection':
        response = await handleCloseConnection(requestBody);
        break;
        
      default:
        response = await handleUnknownAction(soapAction);
    }
    
    console.log(`📤 SOAP Response:`, JSON.stringify(response, null, 2));
    
    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(response);
    
  } catch (error) {
    console.error('❌ SOAP request failed:', error);
    
    const errorResponse = buildSOAPFault('Server.Error', error.message);
    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(500).send(errorResponse);
  }
}

/**
 * Handle serverVersion request
 */
async function handleServerVersion() {
  const version = '1.0.0';
  
  return buildSOAPResponse('serverVersion', {
    serverVersionResult: version
  });
}

/**
 * Handle clientVersion request
 */
async function handleClientVersion(requestBody) {
  const clientVersion = requestBody.clientVersion || '0.0.0.0';
  
  console.log(`📋 Client Version: ${clientVersion}`);
  
  // Check if client version is supported
  const minVersion = '2.0.0.0';
  const isSupported = compareVersions(clientVersion, minVersion) >= 0;
  
  if (!isSupported) {
    return buildSOAPResponse('clientVersion', {
      clientVersionResult: 'W:Upgrade required. Minimum version is ' + minVersion
    });
  }
  
  return buildSOAPResponse('clientVersion', {
    clientVersionResult: ''
  });
}

/**
 * Handle authenticate request
 */
async function handleAuthenticate(requestBody) {
  const { strUserName, strPassword } = requestBody;
  
  console.log(`🔐 Authentication attempt: ${strUserName}`);
  
  // Validate credentials
  const expectedUsername = process.env.QBWC_USERNAME;
  const expectedPassword = process.env.QBWC_PASSWORD;
  
  if (strUserName !== expectedUsername || strPassword !== expectedPassword) {
    console.log('❌ Authentication failed: Invalid credentials');
    return buildSOAPResponse('authenticate', {
      authenticateResult: {
        '#text': 'nvu', // Invalid user
        '@_xmlns': ''
      }
    });
  }
  
  // Create session ticket
  const sessionTicket = uuidv4();
  const companyFile = process.env.QBWC_COMPANY_FILE || '';
  
  // Store session
  activeSessions.set(sessionTicket, {
    username: strUserName,
    createdAt: new Date(),
    companyFile: companyFile,
    currentStep: 'authenticated'
  });
  
  console.log(`✅ Authentication successful. Session: ${sessionTicket}`);
  
  // Log authentication
  await logSyncEvent(sessionTicket, 'authentication', 'success', {
    username: strUserName,
    companyFile: companyFile
  });
  
  return buildSOAPResponse('authenticate', {
    authenticateResult: {
      '#text': sessionTicket,
      '@_xmlns': ''
    }
  });
}

/**
 * Handle sendRequestXML request
 */
async function handleSendRequestXML(requestBody) {
  const { ticket, hcpResponse, companyFileName } = requestBody;
  
  console.log(`📨 SendRequestXML - Ticket: ${ticket}, Company: ${companyFileName}`);
  
  // Validate session
  const session = activeSessions.get(ticket);
  if (!session) {
    console.log('❌ Invalid session ticket');
    return buildSOAPResponse('sendRequestXML', {
      sendRequestXMLResult: ''
    });
  }
  
  try {
    // Update session with company file
    session.companyFile = companyFileName;
    session.currentStep = 'requesting_data';
    
    // Determine what data to request based on sync state
    const requestXML = await determineNextRequest(ticket);
    
    if (!requestXML) {
      console.log('✅ No more requests needed');
      return buildSOAPResponse('sendRequestXML', {
        sendRequestXMLResult: ''
      });
    }
    
    // Store the request for later processing
    activeRequests.set(ticket, {
      requestXML: requestXML,
      timestamp: new Date(),
      type: getRequestType(requestXML)
    });
    
    console.log(`📤 Sending request: ${getRequestType(requestXML)}`);
    
    return buildSOAPResponse('sendRequestXML', {
      sendRequestXMLResult: requestXML
    });
    
  } catch (error) {
    console.error('❌ SendRequestXML failed:', error);
    
    await logSyncEvent(ticket, 'send_request', 'error', {
      error: error.message,
      companyFile: companyFileName
    });
    
    return buildSOAPResponse('sendRequestXML', {
      sendRequestXMLResult: ''
    });
  }
}

/**
 * Handle receiveResponseXML request
 */
async function handleReceiveResponseXML(requestBody) {
  const { ticket, response, hresult, message } = requestBody;
  
  console.log(`📨 ReceiveResponseXML - Ticket: ${ticket}`);
  console.log(`📄 Response length: ${response ? response.length : 0} characters`);
  
  // Validate session
  const session = activeSessions.get(ticket);
  if (!session) {
    console.log('❌ Invalid session ticket');
    return buildSOAPResponse('receiveResponseXML', {
      receiveResponseXMLResult: -1
    });
  }
  
  try {
    // Check for errors
    if (hresult && hresult !== '0') {
      console.log(`❌ QB Error - HRESULT: ${hresult}, Message: ${message}`);
      
      await logSyncEvent(ticket, 'receive_response', 'error', {
        hresult: hresult,
        message: message
      });
      
      return buildSOAPResponse('receiveResponseXML', {
        receiveResponseXMLResult: -1
      });
    }
    
    // Process the response
    if (response && response.trim()) {
      await processQBResponse(ticket, response);
    }
    
    console.log('✅ Response processed successfully');
    
    return buildSOAPResponse('receiveResponseXML', {
      receiveResponseXMLResult: 100 // Continue processing
    });
    
  } catch (error) {
    console.error('❌ ReceiveResponseXML failed:', error);
    
    await logSyncEvent(ticket, 'receive_response', 'error', {
      error: error.message
    });
    
    return buildSOAPResponse('receiveResponseXML', {
      receiveResponseXMLResult: -1
    });
  }
}

/**
 * Handle connectionError request
 */
async function handleConnectionError(requestBody) {
  const { ticket, hresult, message } = requestBody;
  
  console.log(`❌ Connection Error - Ticket: ${ticket}, HRESULT: ${hresult}, Message: ${message}`);
  
  await logSyncEvent(ticket, 'connection_error', 'error', {
    hresult: hresult,
    message: message
  });
  
  return buildSOAPResponse('connectionError', {
    connectionErrorResult: 'done'
  });
}

/**
 * Handle closeConnection request
 */
async function handleCloseConnection(requestBody) {
  const { ticket } = requestBody;
  
  console.log(`🔒 Closing connection - Ticket: ${ticket}`);
  
  // Clean up session data
  activeSessions.delete(ticket);
  activeRequests.delete(ticket);
  
  await logSyncEvent(ticket, 'close_connection', 'success', {
    message: 'Connection closed normally'
  });
  
  return buildSOAPResponse('closeConnection', {
    closeConnectionResult: 'OK'
  });
}

/**
 * Handle unknown SOAP action
 */
async function handleUnknownAction(soapAction) {
  console.log(`⚠️  Unknown SOAP Action: ${soapAction}`);
  
  return buildSOAPFault('Client.UnknownAction', `Unknown SOAP action: ${soapAction}`);
}

/**
 * Determine what request to send next based on sync state
 */
async function determineNextRequest(ticket) {
  const session = activeSessions.get(ticket);
  
  // Get last sync info
  const { data: lastSync } = await supabase
    .from('qb_sync_log')
    .select('*')
    .eq('session_id', ticket)
    .eq('event_type', 'data_sync')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Define sync order: company info -> items -> customers -> sales
  const syncOrder = ['company', 'items', 'customers', 'sales'];
  let nextSyncType = 'company';
  
  if (lastSync) {
    const lastSyncType = lastSync.metadata?.sync_type;
    const currentIndex = syncOrder.indexOf(lastSyncType);
    if (currentIndex >= 0 && currentIndex < syncOrder.length - 1) {
      nextSyncType = syncOrder[currentIndex + 1];
    } else {
      return null; // All syncs complete
    }
  }
  
  // Build appropriate request
  let requestData;
  switch (nextSyncType) {
    case 'company':
      requestData = createCompanyInfoQueryRequest();
      break;
    case 'items':
      requestData = createItemQueryRequest();
      break;
    case 'customers':
      requestData = createCustomerQueryRequest();
      break;
    case 'sales':
      const fromDate = getLastSyncDate();
      requestData = createSalesReceiptQueryRequest(fromDate);
      break;
    default:
      return null;
  }
  
  return buildQBXML(requestData);
}

/**
 * Process QB response and store in database
 */
async function processQBResponse(ticket, responseXML) {
  try {
    const parsedResponse = parseQBXML(responseXML);
    console.log('🔄 Processing QB response...');
    
    // Check for QB errors
    const qbError = extractQBError(responseXML);
    if (qbError) {
      throw new Error(`QuickBooks Error ${qbError.code}: ${qbError.message}`);
    }
    
    // Determine response type and process accordingly
    if (parsedResponse.CompanyQueryRs) {
      await processCompanyInfo(ticket, parsedResponse.CompanyQueryRs);
    } else if (parsedResponse.ItemQueryRs) {
      await processItems(ticket, parsedResponse.ItemQueryRs);
    } else if (parsedResponse.CustomerQueryRs) {
      await processCustomers(ticket, parsedResponse.CustomerQueryRs);
    } else if (parsedResponse.SalesReceiptQueryRs) {
      await processSales(ticket, parsedResponse.SalesReceiptQueryRs);
    } else if (parsedResponse.InvoiceQueryRs) {
      await processSales(ticket, parsedResponse.InvoiceQueryRs, 'invoice');
    }
    
  } catch (error) {
    console.error('❌ Failed to process QB response:', error);
    throw error;
  }
}

/**
 * Process company information
 */
async function processCompanyInfo(ticket, companyData) {
  // Implementation for company data processing
  console.log('🏢 Processing company info...');
  
  await logSyncEvent(ticket, 'data_sync', 'success', {
    sync_type: 'company',
    records_processed: 1
  });
}

/**
 * Process inventory items
 */
async function processItems(ticket, itemsData) {
  // Implementation for items processing
  console.log('📦 Processing items...');
  
  await logSyncEvent(ticket, 'data_sync', 'success', {
    sync_type: 'items',
    records_processed: Array.isArray(itemsData) ? itemsData.length : 1
  });
}

/**
 * Process customers
 */
async function processCustomers(ticket, customersData) {
  // Implementation for customers processing
  console.log('👥 Processing customers...');
  
  await logSyncEvent(ticket, 'data_sync', 'success', {
    sync_type: 'customers',
    records_processed: Array.isArray(customersData) ? customersData.length : 1
  });
}

/**
 * Process sales data
 */
async function processSales(ticket, salesData, type = 'receipt') {
  // Implementation for sales processing
  console.log(`💰 Processing sales (${type})...`);
  
  await logSyncEvent(ticket, 'data_sync', 'success', {
    sync_type: 'sales',
    sales_type: type,
    records_processed: Array.isArray(salesData) ? salesData.length : 1
  });
}

/**
 * Helper functions
 */

function buildSOAPResponse(action, body) {
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action}Response xmlns="http://developer.intuit.com/">
      ${typeof body === 'string' ? body : JSON.stringify(body)}
    </${action}Response>
  </soap:Body>
</soap:Envelope>`;
  
  return soapEnvelope;
}

function buildSOAPFault(faultCode, faultString) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
}

function compareVersions(version1, version2) {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

function getRequestType(requestXML) {
  if (requestXML.includes('ItemQueryRq')) return 'items';
  if (requestXML.includes('CustomerQueryRq')) return 'customers';
  if (requestXML.includes('SalesReceiptQueryRq')) return 'sales_receipts';
  if (requestXML.includes('InvoiceQueryRq')) return 'invoices';
  if (requestXML.includes('CompanyQueryRq')) return 'company';
  return 'unknown';
}

function getLastSyncDate() {
  // Return date from 30 days ago as default
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

async function logSyncEvent(sessionId, eventType, status, metadata = {}) {
  try {
    const { error } = await supabase
      .from('qb_sync_log')
      .insert({
        session_id: sessionId,
        event_type: eventType,
        status: status,
        metadata: metadata,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Failed to log sync event:', error);
    }
  } catch (err) {
    console.error('Failed to log sync event:', err);
  }
}