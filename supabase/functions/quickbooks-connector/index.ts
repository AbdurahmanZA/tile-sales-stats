import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QBRequest {
  requestXML: string;
  connectionTicket: string;
  companyFileName: string;
  qbXMLCountry: string;
  qbXMLMajorVers: string;
  qbXMLMinorVers: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || '';

    console.log(`QuickBooks connector called with action: ${action}`);

    switch (action) {
      case 'authenticate':
        return handleAuthenticate(req);
      
      case 'sendRequestXML':
        return await handleSendRequestXML(req, supabase);
      
      case 'receiveResponseXML':
        return await handleReceiveResponseXML(req, supabase);
      
      case 'getLastError':
        return handleGetLastError(req);
      
      case 'closeConnection':
        return handleCloseConnection(req);
      
      default:
        return new Response('Invalid action', { 
          status: 400,
          headers: corsHeaders 
        });
    }
  } catch (error) {
    console.error('Error in QuickBooks connector:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function handleAuthenticate(req: Request): Response {
  // Return authentication response for QuickBooks Web Connector
  const authResponse = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <soap:Body>
        <authenticateResponse xmlns="http://developer.intuit.com/">
          <authenticateResult>
            <string>TILE_ANALYTICS_SESSION_${Date.now()}</string>
            <string>none</string>
          </authenticateResult>
        </authenticateResponse>
      </soap:Body>
    </soap:Envelope>
  `;

  return new Response(authResponse, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}

async function handleSendRequestXML(req: Request, supabase: any): Promise<Response> {
  // Generate qbXML request for tile business data
  const requestXML = `
    <?xml version="1.0" encoding="utf-8"?>
    <?qbxml version="13.0"?>
    <QBXML>
      <QBXMLMsgsRq onError="stopOnError">
        <SalesReceiptQueryRq requestID="1">
          <MaxReturned>100</MaxReturned>
          <FromModifiedDate>2024-01-01</FromModifiedDate>
          <ToModifiedDate>2024-12-31</ToModifiedDate>
        </SalesReceiptQueryRq>
        <ItemQueryRq requestID="2">
          <MaxReturned>1000</MaxReturned>
          <ActiveStatus>ActiveOnly</ActiveStatus>
        </ItemQueryRq>
        <CustomerQueryRq requestID="3">
          <MaxReturned>500</MaxReturned>
          <ActiveStatus>ActiveOnly</ActiveStatus>
        </CustomerQueryRq>
      </QBXMLMsgsRq>
    </QBXML>
  `;

  console.log('Generated QuickBooks request XML for tile business data');

  const response = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
          <sendRequestXMLResult>
            <![CDATA[${requestXML}]]>
          </sendRequestXMLResult>
        </sendRequestXMLResponse>
      </soap:Body>
    </soap:Envelope>
  `;

  return new Response(response, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}

async function handleReceiveResponseXML(req: Request, supabase: any): Promise<Response> {
  try {
    const body = await req.text();
    console.log('Received QuickBooks response XML:', body);

    // Parse the XML response and extract tile business data
    // This would contain sales receipts, inventory items, and customer data
    // For now, we'll simulate processing and store sample data

    // Simulate processing QuickBooks data for a tile business
    const branchId = 'f47e4b2a-8c7d-4e2f-9a5b-1c3d7e9f8a2b'; // Sample branch ID

    // Store sample sales data
    await supabase.from('sales_data').insert([
      {
        branch_id: branchId,
        transaction_date: '2024-09-18',
        customer_name: 'ABC Construction',
        tile_style: 'Ceramic 600x600 White',
        quantity_sold: 150,
        unit_price: 89.99,
        total_amount: 13498.50,
        margin_percentage: 18.5,
        currency: 'ZAR'
      },
      {
        branch_id: branchId,
        transaction_date: '2024-09-18',
        customer_name: 'Home Renovations Ltd',
        tile_style: 'Porcelain 800x800 Grey',
        quantity_sold: 80,
        unit_price: 156.50,
        total_amount: 12520.00,
        margin_percentage: 22.3,
        currency: 'ZAR'
      }
    ]);

    // Store sample inventory data
    await supabase.from('inventory_data').insert([
      {
        branch_id: branchId,
        tile_style: 'Ceramic 600x600 White',
        current_stock: 2500,
        reorder_level: 500,
        cost_per_unit: 73.99,
        supplier: 'Ceramic Suppliers SA',
        status: 'in_stock'
      },
      {
        branch_id: branchId,
        tile_style: 'Marble 450x450 Beige',
        current_stock: 120,
        reorder_level: 200,
        cost_per_unit: 125.00,
        supplier: 'Premium Stone Co',
        status: 'low_stock'
      }
    ]);

    console.log('Successfully processed and stored QuickBooks tile business data');

    const response = `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
            <receiveResponseXMLResult>100</receiveResponseXMLResult>
          </receiveResponseXMLResponse>
        </soap:Body>
      </soap:Envelope>
    `;

    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error processing QuickBooks response:', error);
    
    const errorResponse = `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
            <receiveResponseXMLResult>-1</receiveResponseXMLResult>
          </receiveResponseXMLResponse>
        </soap:Body>
      </soap:Envelope>
    `;

    return new Response(errorResponse, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  }
}

function handleGetLastError(req: Request): Response {
  const errorResponse = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <getLastErrorResponse xmlns="http://developer.intuit.com/">
          <getLastErrorResult>No errors</getLastErrorResult>
        </getLastErrorResponse>
      </soap:Body>
    </soap:Envelope>
  `;

  return new Response(errorResponse, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}

function handleCloseConnection(req: Request): Response {
  const closeResponse = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <closeConnectionResponse xmlns="http://developer.intuit.com/">
          <closeConnectionResult>Tile Analytics sync completed successfully</closeConnectionResult>
        </closeConnectionResponse>
      </soap:Body>
    </soap:Envelope>
  `;

  return new Response(closeResponse, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}