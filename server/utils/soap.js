import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * SOAP utilities for QuickBooks Web Connector integration
 */

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
 * Parse SOAP envelope and extract body content
 */
export function parseSOAPRequest(xmlString) {
  try {
    console.log('📥 Parsing SOAP request...');
    
    const parsed = parser.parse(xmlString);
    
    // Navigate SOAP structure: Envelope -> Body -> Action
    if (parsed['soap:Envelope'] && parsed['soap:Envelope']['soap:Body']) {
      const body = parsed['soap:Envelope']['soap:Body'];
      
      // Find the action (first non-soap element in body)
      for (const key in body) {
        if (!key.startsWith('soap:')) {
          console.log(`🎯 SOAP Action found: ${key}`);
          return {
            action: key,
            data: body[key]
          };
        }
      }
    }
    
    // Fallback: try to find any action-like element
    console.log('⚠️  Standard SOAP structure not found, trying fallback...');
    return { action: 'unknown', data: parsed };
    
  } catch (error) {
    console.error('❌ SOAP parsing failed:', error.message);
    throw new Error(`Invalid SOAP format: ${error.message}`);
  }
}

/**
 * Build SOAP response envelope
 */
export function buildSOAPResponse(action, responseData) {
  try {
    console.log(`📤 Building SOAP response for: ${action}`);
    
    const responseAction = action.endsWith('Response') ? action : `${action}Response`;
    
    const soapEnvelope = {
      'soap:Envelope': {
        '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
        'soap:Body': {
          [responseAction]: {
            '@_xmlns': 'http://developer.intuit.com/',
            ...responseData
          }
        }
      }
    };
    
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(soapEnvelope)}`;
    
    console.log('✅ SOAP response built successfully');
    return xmlString;
    
  } catch (error) {
    console.error('❌ SOAP building failed:', error.message);
    throw new Error(`Failed to build SOAP response: ${error.message}`);
  }
}

/**
 * Build SOAP fault response
 */
export function buildSOAPFault(faultCode, faultString, detail = null) {
  try {
    console.log(`🚨 Building SOAP fault: ${faultCode}`);
    
    const fault = {
      'soap:Envelope': {
        '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
        'soap:Body': {
          'soap:Fault': {
            faultcode: faultCode,
            faultstring: faultString
          }
        }
      }
    };
    
    if (detail) {
      fault['soap:Envelope']['soap:Body']['soap:Fault'].detail = detail;
    }
    
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(fault)}`;
    
    console.log('✅ SOAP fault built successfully');
    return xmlString;
    
  } catch (error) {
    console.error('❌ SOAP fault building failed:', error.message);
    return buildSimpleSOAPFault(faultCode, faultString);
  }
}

/**
 * Build simple SOAP fault as fallback
 */
function buildSimpleSOAPFault(faultCode, faultString) {
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

/**
 * Extract value from SOAP data structure
 */
export function extractSOAPValue(data, path) {
  try {
    const keys = path.split('.');
    let current = data;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    // Handle text node wrapper
    if (current && typeof current === 'object' && '#text' in current) {
      return current['#text'];
    }
    
    return current;
  } catch (error) {
    console.warn(`⚠️  Failed to extract SOAP value at path: ${path}`, error.message);
    return null;
  }
}

/**
 * Validate SOAP request structure
 */
export function validateSOAPRequest(xmlString) {
  try {
    const { action, data } = parseSOAPRequest(xmlString);
    
    if (!action || action === 'unknown') {
      return { valid: false, error: 'No valid SOAP action found' };
    }
    
    return { valid: true, action, data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get SOAP action from headers or XML
 */
export function getSOAPAction(headers, xmlString = null) {
  // Try to get from SOAPAction header first
  let soapAction = headers.soapaction || headers['soapaction'];
  
  if (soapAction) {
    // Clean up SOAPAction header (remove quotes if present)
    soapAction = soapAction.replace(/"/g, '');
    return soapAction;
  }
  
  // Fallback: parse XML to find action
  if (xmlString) {
    try {
      const { action } = parseSOAPRequest(xmlString);
      return action;
    } catch (error) {
      console.warn('Could not extract action from XML:', error.message);
    }
  }
  
  return null;
}