const { google } = require('googleapis');
const { Resend } = require('resend');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings";
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || "noreply@tidymate.ca";

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function sendSubcontractorEmail(booking, subcontractor) {
  if (!resendApiKey) {
    console.warn("Email not sent: RESEND_API_KEY not configured");
    return { skipped: true };
  }

  const resend = new Resend(resendApiKey);
  const subject = `🧹 New Job Assignment: ${booking.serviceName} - ${booking.date}`;
  
  const addonsList = Array.isArray(booking.addons) ? booking.addons.join(", ") : booking.addons || "None";
  const total = `${booking.totalAmount.toFixed(2)} ${booking.currency.toUpperCase()}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066cc;">🧹 New Job Assignment</h2>
      <p>Hi ${subcontractor.name},</p>
      <p>You've been assigned a new cleaning job. Please review the details below:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📋 Job Details</h3>
        <p><strong>Service:</strong> ${booking.serviceName}</p>
        <p><strong>Add-ons:</strong> ${addonsList}</p>
        <p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
        <p><strong>Total Value:</strong> <span style="color: #0066cc; font-weight: bold;">${total}</span></p>
      </div>

      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">👤 Customer Information</h3>
        <p><strong>Name:</strong> ${booking.customerName}</p>
        <p><strong>Email:</strong> <a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></p>
        <p><strong>Phone:</strong> <a href="tel:${booking.phone}">${booking.phone}</a></p>
        <p><strong>Address:</strong> ${booking.address}</p>
      </div>

      ${booking.instructions ? `
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">📝 Special Instructions</h4>
        <p>${booking.instructions}</p>
      </div>
      ` : ''}

      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">✅ Next Steps</h3>
        <ol>
          <li><strong>Confirm availability</strong> - Reply to this email</li>
          <li><strong>Contact customer</strong> if needed</li>
          <li><strong>Arrive on time</strong> with equipment</li>
          <li><strong>Complete the service</strong></li>
        </ol>
      </div>

      <p style="color: #6c757d; font-size: 14px;">
        <strong>Reference ID:</strong> ${booking.sessionId}<br>
        <strong>Questions?</strong> Contact services@tidymate.ca
      </p>
    </div>
  `;

  await resend.emails.send({
    from: fromEmail,
    to: subcontractor.email,
    subject,
    html,
  });

  return { success: true };
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const bookingData = JSON.parse(event.body);
    
    console.log('📋 Processing booking from Zapier:', {
      customer: bookingData.customerName,
      service: bookingData.serviceName,
    });

    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured");
    }

    const sheets = await getGoogleSheetsClient();
    
    // Prepare booking data
    const bookingRow = [
      new Date().toISOString(),
      bookingData.customerName || "",
      bookingData.serviceName || "",
      bookingData.date || "",
      bookingData.time || "",
      "", // Will be filled by formula
      "", // Will be filled by formula
      ""  // Will be filled by formula
    ];

    // Add booking to sheet
    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [bookingRow],
      },
    });

    const updatedRange = appendResult.data.updates?.updatedRange;
    const rowNumber = updatedRange ? parseInt(updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0;

    console.log(`📍 Booking added to row ${rowNumber}`);

    // Wait for formulas
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Read assignment
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

      console.log(`👷 Subcontractor assigned: ${assignedSubcontractor.name}`);

      // Send email
      try {
        await sendSubcontractorEmail(bookingData, assignedSubcontractor);
        console.log(`📧 Notification sent to: ${assignedSubcontractor.email}`);
      } catch (emailError) {
        console.error("Email failed:", emailError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Booking processed successfully",
        assignedSubcontractor: assignedSubcontractor?.name || null,
        rowNumber,
      })
    };

  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to process booking"
      })
    };
  }
};