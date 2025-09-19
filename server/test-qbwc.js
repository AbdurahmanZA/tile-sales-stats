#!/usr/bin/env node

/**
 * QuickBooks Web Connector Test Suite
 * Tests the SOAP endpoints for QB integration
 */

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const SERVER_URL = 'http://localhost:3001';
const QBWC_ENDPOINT = `${SERVER_URL}/api/quickbooks-connector`;

// Test credentials from .env
const TEST_USERNAME = 'qb_tile_user';
const TEST_PASSWORD = 'secure_password_2024';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * Test SOAP request helper
 */
async function testSOAPRequest(action, body) {
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="http://developer.intuit.com/">
      ${body}
    </${action}>
  </soap:Body>
</soap:Envelope>`;

  console.log(`\n🧪 Testing SOAP Action: ${action}`);
  console.log(`📤 Request:`, soapEnvelope.substring(0, 200) + '...');

  try {
    const response = await fetch(QBWC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': action,
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📥 Response:`, responseText.substring(0, 300) + '...');

    if (response.ok) {
      console.log(`✅ ${action} test passed`);
      return { success: true, data: responseText };
    } else {
      console.log(`❌ ${action} test failed`);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.error(`❌ ${action} test error:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run comprehensive QBWC tests
 */
async function runTests() {
  console.log('🚀 Starting QuickBooks Web Connector Tests');
  console.log(`🎯 Target: ${QBWC_ENDPOINT}`);

  // Test 1: Server Version
  console.log('\n' + '='.repeat(50));
  await testSOAPRequest('serverVersion', '');

  // Test 2: Client Version
  console.log('\n' + '='.repeat(50));
  await testSOAPRequest('clientVersion', '<clientVersion>2.1.0.30</clientVersion>');

  // Test 3: Authentication
  console.log('\n' + '='.repeat(50));
  const authResult = await testSOAPRequest('authenticate', `
    <strUserName>${TEST_USERNAME}</strUserName>
    <strPassword>${TEST_PASSWORD}</strPassword>
  `);

  let sessionTicket = null;
  if (authResult.success) {
    // Try to extract session ticket from response
    try {
      const parsed = parser.parse(authResult.data);
      // This would need to be adjusted based on actual response structure
      sessionTicket = 'test-session-ticket';
      console.log(`🎫 Session Ticket: ${sessionTicket}`);
    } catch (e) {
      console.log('⚠️  Could not extract session ticket from response');
    }
  }

  // Test 4: Send Request XML (if we have a session)
  if (sessionTicket) {
    console.log('\n' + '='.repeat(50));
    await testSOAPRequest('sendRequestXML', `
      <ticket>${sessionTicket}</ticket>
      <hcpResponse></hcpResponse>
      <companyFileName>TestCompany.qbw</companyFileName>
    `);

    // Test 5: Receive Response XML
    console.log('\n' + '='.repeat(50));
    const sampleQBXML = `<?xml version="1.0" ?>
<QBXML>
  <QBXMLMsgsRs>
    <CompanyQueryRs statusCode="0" statusSeverity="Info" statusMessage="Status OK">
      <CompanyRet>
        <CompanyName>Test Tile Company</CompanyName>
        <LegalCompanyName>Test Tile Company Ltd</LegalCompanyName>
        <Address>
          <Addr1>123 Tile Street</Addr1>
          <City>Johannesburg</City>
          <State>Gauteng</State>
          <PostalCode>2001</PostalCode>
          <Country>South Africa</Country>
        </Address>
      </CompanyRet>
    </CompanyQueryRs>
  </QBXMLMsgsRs>
</QBXML>`;

    await testSOAPRequest('receiveResponseXML', `
      <ticket>${sessionTicket}</ticket>
      <response>${sampleQBXML}</response>
      <hresult>0</hresult>
      <message></message>
    `);

    // Test 6: Close Connection
    console.log('\n' + '='.repeat(50));
    await testSOAPRequest('closeConnection', `<ticket>${sessionTicket}</ticket>`);
  }

  // Test 7: API Endpoints
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Testing REST API Endpoints');

  try {
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    const dashboardResponse = await fetch(`${SERVER_URL}/api/dashboard`);
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard API:', dashboardData.branches?.length || 0, 'branches');

    const salesResponse = await fetch(`${SERVER_URL}/api/sales`);
    const salesData = await salesResponse.json();
    console.log('✅ Sales API:', salesData.data?.length || 0, 'records');

  } catch (error) {
    console.error('❌ API test error:', error.message);
  }

  console.log('\n🏁 Tests completed!');
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running. Start it with: cd server && npm start');
    return false;
  }
  return false;
}

// Run tests if server is available
if (await checkServer()) {
  runTests().catch(console.error);
} else {
  process.exit(1);
}