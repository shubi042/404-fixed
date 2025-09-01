const { google } = require('googleapis');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🧪 Testing Google Sheets integration...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
    const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings";
    
    if (!SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_ID not configured');
    }
    
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS not configured');
    }
    
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test booking data
    const testBooking = [
      new Date().toISOString(),  // A: Timestamp
      'Test Customer',           // B: Client Name
      'Test Service',           // C: Service
      '2024-01-15',            // D: Date
      'Morning',               // E: Time
      '',                      // F: Assigned Subcontractor (formula will fill)
      '',                      // G: Subcontractor Email (formula will fill)
      ''                       // H: Notified (formula will fill)
    ];
    
    console.log('📊 Adding booking to Google Sheets...');
    
    // Add the booking to the sheet
    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [testBooking],
      },
    });
    
    // Get the row number that was just added
    const updatedRange = appendResult.data.updates?.updatedRange;
    const rowNumber = updatedRange ? parseInt(updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0;
    
    console.log(`📍 Booking added to row ${rowNumber}`);
    
    // Wait for formulas to calculate
    console.log('⏳ Waiting for Google Sheets formulas to calculate...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Read back the assignment
    const readResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${rowNumber}:G${rowNumber}`,
    });
    
    const subcontractorData = readResult.data.values?.[0];
    let assignedSubcontractor = null;
    
    if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
      assignedSubcontractor = {
        name: subcontractorData[0],
        email: subcontractorData[1],
      };
      console.log('👷 Subcontractor assigned:', assignedSubcontractor.name);
    } else {
      console.log('⚠️ No subcontractor was assigned by the formula');
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Google Sheets integration test successful",
        result: {
          rowNumber,
          assignedSubcontractor
        },
        testData: {
          timestamp: testBooking[0],
          customerName: testBooking[1],
          serviceName: testBooking[2],
          date: testBooking[3],
          time: testBooking[4]
        }
      })
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: "Google Sheets integration test failed"
      })
    };
  }
};